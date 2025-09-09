import { useState, useCallback, useMemo, useRef } from "react";
import { createHuggingFaceProvider } from "../providers/huggingFaceProvider";
import { createChromeNativeProvider } from "../providers/chromeNativeProvider";

type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

type ChatbotState = {
  messages: Message[];
  loading: boolean;
  sendMessage: (message: string) => void;
  init: () => Promise<void>;
};

export function useChatbot({
  provider = "chrome",
  initialPromptsFile = "/llms.txt",
}: {
  provider?: "huggingface" | "chrome";
  initialPromptsFile?: string;
}): ChatbotState {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const abortController = useRef(new AbortController());

  const chatProvider = useMemo(() => {
    return provider === "huggingface"
      ? createHuggingFaceProvider()
      : createChromeNativeProvider();
  }, [provider]);

  const init = useCallback(async () => {
    let initialPrompts = "";

    try {
      const res = await fetch(initialPromptsFile);

      if (res.ok) {
        initialPrompts = await res.text();
      }
    } catch (e: unknown) {
      console.warn("Arquivo de prompts não encontrado, usando systemPrompt", e);
    }

    await chatProvider.init(initialPrompts);
  }, [chatProvider, initialPromptsFile]);

  const sendMessage = useCallback(
    async (text: string) => {
      setLoading(true);

      const userMessage: Message = { role: "user", content: text };
      setMessages((prev) => [...prev, userMessage]);

      try {
        const stream = await chatProvider.prompt(
          text,
          abortController.current.signal,
        );

        // Criar mensagem "vazia" do bot e ir atualizando
        const botMessage: Message = { role: "assistant", content: "" };
        setMessages((prev) => [...prev, botMessage]);

        const reader = (stream as ReadableStream<string>).getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk =
            typeof value === "string" ? value : decoder.decode(value);

          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];

            if (last.role === "assistant") {
              last.content += chunk;
            }

            return [...updated];
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [chatProvider],
  );

  return {
    init,
    messages,
    loading,
    sendMessage,
  };
}
