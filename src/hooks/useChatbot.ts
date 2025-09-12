import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { createHuggingFaceProvider } from "../providers/huggingFaceProvider";
import { createChromeNativeProvider } from "../providers/chromeNativeProvider";

type Message = {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
};

type ChatbotState = {
  messages: Message[];
  loading: boolean;
  sendMessage: (message: string) => void;
  init: () => Promise<void>;
  clearChat: () => void;
  abortChatMessage: () => void;
};

const storage = {
  getMessages(): Message[] {
    return JSON.parse(localStorage.getItem("chatbot_messages") || "[]");
  },

  saveMessages(messages: Message[]) {
    localStorage.setItem("chatbot_messages", JSON.stringify(messages));
  },

  clearMessages() {
    localStorage.removeItem("chatbot_messages");
  },
};

export function useChatbot({
  provider = "chrome",
  config = { limit: 10 },
  initialPromptsFile = "/llms.md",
}: {
  provider?: "huggingface" | "chrome";
  config?: {
    limit: number;
  };
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

  useEffect(() => {
    const savedMessages = storage.getMessages();
    if (savedMessages.length > 0) {
      setMessages(savedMessages);
    }
  }, []);

  const saveMessages = useCallback((newMessages: Message[]) => {
    const messagesWithoutSystem = newMessages.filter(
      (m) => m.role !== "system",
    );
    storage.saveMessages(messagesWithoutSystem);
  }, []);

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

  const clearChat = useCallback(() => {
    setMessages([]);
    storage.clearMessages();
  }, []);

  const abortChatMessage = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort("Request aborted by user");
    }
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (messages.length > config.limit) {
        throw new Error("Limite de mensagens atingido");

        return;
      }

      setLoading(true);

      const userMessage: Message = {
        role: "user",
        content: text,
        timestamp: Date.now(),
      };

      const updatedMessages = [...messages, userMessage];

      setMessages(updatedMessages);

      try {
        const stream = await chatProvider.prompt(
          text,
          abortController.current.signal,
        );

        const botMessage: Message = {
          role: "assistant",
          content: "",
          timestamp: Date.now(),
        };

        const messagesWithBot = [...updatedMessages, botMessage];

        setMessages(messagesWithBot);

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

            setTimeout(() => saveMessages(updated), 0);

            return [...updated];
          });
        }
      } catch (err) {
        console.error(err);
        saveMessages(updatedMessages);
      } finally {
        setLoading(false);
      }
    },
    [chatProvider, messages, saveMessages, config.limit],
  );

  return {
    init,
    messages,
    loading,
    sendMessage,
    clearChat,
    abortChatMessage,
  };
}
