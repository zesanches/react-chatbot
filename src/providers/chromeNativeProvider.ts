type ChromeMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

interface LanguageModelSession {
  prompt(messages: ChromeMessage[]): Promise<string>;
  promptStreaming(
    messages: ChromeMessage[],
    options?: { signal?: AbortSignal },
  ): ReadableStream<string>;
  inputUsage?: number;
  inputQuota?: number;
}

export function createChromeNativeProvider() {
  const messages: ChromeMessage[] = [];
  let session: LanguageModelSession | null = null;

  async function init(initialPrompts: string) {
    try {
      if (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        !(window as any).LanguageModel &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        !(window as any).ai?.languageModel
      ) {
        throw new Error("Modelo de IA nativo não disponível neste navegador.");
      }

      messages.push({ role: "system", content: initialPrompts });

      const lm =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).LanguageModel ?? (window as any).ai.languageModel;

      const availability = await lm.availability();

      if (availability === "available") {
        session = await lm.create({
          initialPrompts: messages,
        });

        return { isCreated: true, initialPrompts };
      } else if (availability === "unavailable") {
        throw new Error("Modelo de IA não está disponível neste dispositivo.");
      } else {
        throw new Error(
          "Status de disponibilidade desconhecido do modelo de IA.",
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(
        "Erro desconhecido ao inicializar o modelo de IA nativo.",
      );
    }
  }

  async function prompt(
    text: string,
    signal?: AbortSignal,
  ): Promise<ReadableStream<string>> {
    try {
      if (!session) {
        throw new Error("Session não inicializada");
      }

      const lm =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).LanguageModel ?? (window as any).ai.languageModel;

      const availability = await lm.availability();

      if (availability === "available") {
        messages.push({ role: "user", content: text });

        const stream = session.promptStreaming(messages, {
          signal,
        });

        if (!stream) {
          throw new Error("Falha ao criar stream de resposta");
        }

        return stream;
      } else {
        throw new Error("Modelo indisponível");
      }
    } catch (error) {
      if (signal?.aborted) {
        throw new Error("Request aborted by user");
      }

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new Error("Request aborted by user");
        }

        if (error.message.includes("quota")) {
          throw new Error(
            "Cota de uso do modelo de IA foi excedida. Tente novamente mais tarde.",
          );
        }

        if (error.message.includes("rate")) {
          throw new Error(
            "Muitas requisições. Aguarde um momento antes de tentar novamente.",
          );
        }

        // Propaga erro original se já tem uma mensagem clara
        throw error;
      }

      throw new Error("Erro desconhecido ao processar mensagem com IA nativa.");
    }
  }

  return { init, prompt };
}
