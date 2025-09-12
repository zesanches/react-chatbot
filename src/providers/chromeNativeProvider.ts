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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!(window as any).LanguageModel && !(window as any).ai?.languageModel) {
      throw new Error("Modelo de IA nativo não disponível neste navegador.");
    }

    messages.push({ role: "system", content: initialPrompts });

    const lm =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).LanguageModel ?? (window as any).ai.languageModel;

    const availability = await lm.availability();

    if (availability) {
      session = await lm.create({
        initialPrompts: messages,
      });

      return { isCreated: true, initialPrompts };
    }

    return { isCreated: false, initialPrompts };
  }

  async function prompt(
    text: string,
    signal?: AbortSignal,
  ): Promise<ReadableStream<string>> {
    if (!session) throw new Error("Session não inicializada");

    const lm =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).LanguageModel ?? (window as any).ai.languageModel;

    const availability = await lm.availability();

    if (availability) {
      messages.push({ role: "user", content: text });

      return session.promptStreaming(messages, {
        signal,
      });
    }

    throw new Error("Modelo indisponível");
  }

  return { init, prompt };
}
