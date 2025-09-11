import { useEffect, useState, useRef } from "react";
import { useChatbot } from "../hooks/useChatbot";

type ChatbotProps = {
  provider: "huggingface" | "chrome";
  avatar?: string;
  config?: ChatbotConfig;
};

type Message = {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
};

type ChatbotConfig = {
  chatbotName?: string;
  welcomeBubble?: string;
  firstBotMessage?: string;
  primaryColor?: string;
  backgroundColor?: string;
  headerColor?: string;
  botBubble?: string;
  botText?: string;
  userBubble?: string;
  userText?: string;
  buttonColor?: string;
  typingDelay?: number;
  showClearButton?: boolean;
  limit: number;
};

const defaultConfig: ChatbotConfig = {
  chatbotName: "Assistente IA",
  welcomeBubble: "👋 Olá! Como posso ajudar você hoje?",
  firstBotMessage: "Olá! Sou seu assistente virtual. Como posso te ajudar?",
  primaryColor: "#23A267",
  backgroundColor: "#181C24",
  headerColor: "#1e202c",
  botBubble: "#f6f8fa",
  botText: "#1b5e20",
  userBubble: "#23A267",
  userText: "#ffffff",
  buttonColor: "#23A267",
  typingDelay: 1200,
  showClearButton: false,
  limit: 10,
};

const parseMarkdown = (text: string): string => {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(
      /`(.*?)`/g,
      '<code style="background: rgba(0,0,0,0.1); padding: 2px 4px; border-radius: 3px;">$1</code>',
    )
    .replace(/\n/g, "<br>");
};

export function Chatbot({
  provider,
  avatar = "../public/avatar.jpeg",
  config: userConfig,
}: ChatbotProps) {
  const config = { ...defaultConfig, ...userConfig };
  const { messages, loading, sendMessage, init, clearChat } = useChatbot({
    provider,
    config: {
      ...config,
      limit: config.limit || 10,
    },
  });

  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [firstMessageShown, setFirstMessageShown] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    init();
  }, [init]);

  const handleSend = () => {
    if (!input.trim() || loading) return;
    sendMessage(input);
    setInput("");
  };

  const handleOpen = () => {
    setIsOpen(true);
    setShowWelcome(false);
    setFirstMessageShown(true);
    setTimeout(() => inputRef.current?.focus(), 200);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleClearChat = () => {
    if (
      window.confirm(
        "Tem certeza que deseja limpar todo o histórico da conversa?",
      )
    ) {
      clearChat();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const TypingIndicator = () => (
    <div className="flex items-center gap-1 ml-10 my-2 h-6">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full"
          style={{
            backgroundColor: config.botText,
            animation: `typing-pulse 1.4s infinite ${i * 0.2}s`,
            opacity: 0.6,
          }}
        />
      ))}
    </div>
  );

  return (
    <div className="relative">
      <style>{`
        @keyframes typing-pulse {
          0%, 60%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          30% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: translateX(60px) scale(0.8);
          }
          60% {
            transform: translateX(-5px) scale(1.05);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        .chat-window {
          animation: slide-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .welcome-bubble {
          animation: bounce-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .messages-container {
          scrollbar-width: thin;
          scrollbar-color: ${config.primaryColor} ${config.backgroundColor};
        }

        .messages-container::-webkit-scrollbar {
          width: 8px;
        }

        .messages-container::-webkit-scrollbar-track {
          background: ${config.backgroundColor};
        }

        .messages-container::-webkit-scrollbar-thumb {
          background: ${config.primaryColor};
          border-radius: 10px;
          border: 2px solid ${config.backgroundColor};
        }

        .hover-scale:hover {
          transform: scale(1.05);
        }
      `}</style>

      <button
        onClick={handleOpen}
        className="fixed bottom-8 right-8 w-16 h-16 bg-white rounded-full border-none cursor-pointer flex items-center justify-center p-0 transition-all duration-300 hover-scale z-50 shadow-lg hover:shadow-xl"
        style={{
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
        }}
        aria-label="Abrir chat"
      >
        <div className="relative">
          <img src={avatar} alt="Chatbot" className="w-12 h-12 rounded-full" />
          {showWelcome && (
            <span className="absolute -top-2 -right-2 min-w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
              1
            </span>
          )}
        </div>
      </button>

      {showWelcome && !isOpen && (
        <div
          className="welcome-bubble fixed bottom-20 right-24 max-w-xs p-4 rounded-2xl cursor-pointer transition-all duration-200 hover:shadow-lg z-50"
          style={{
            backgroundColor: config.botBubble,
            color: config.botText,
            borderBottomLeftRadius: "8px",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
          }}
          onClick={handleOpen}
        >
          <div className="text-sm leading-relaxed">{config.welcomeBubble}</div>
        </div>
      )}

      {isOpen && (
        <div
          className="chat-window fixed bottom-24 right-8 w-80 h-96 rounded-lg flex flex-col overflow-hidden z-50 shadow-2xl"
          style={{
            backgroundColor: config.backgroundColor,
            maxWidth: "90vw",
            maxHeight: "80vh",
          }}
        >
          <div
            className="px-4 py-3 flex items-center gap-3 text-white font-medium border-b"
            style={{
              backgroundColor: config.headerColor,
              borderBottomColor: "rgba(255, 255, 255, 0.1)",
            }}
          >
            <img src={avatar} alt="Bot" className="w-8 h-8 rounded-full" />
            <span className="flex-1 text-lg">{config.chatbotName}</span>

            {/* Botão de limpar chat (opcional) */}
            {config.showClearButton && messages.length > 0 && (
              <button
                onClick={handleClearChat}
                className="text-gray-400 hover:text-white text-sm bg-transparent border-none cursor-pointer transition-colors duration-200 p-1 rounded hover:bg-white/10"
                aria-label="Limpar chat"
                title="Limpar conversa"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}

            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white text-2xl font-bold leading-none bg-transparent border-none cursor-pointer transition-colors duration-200"
              aria-label="Fechar chat"
            >
              ×
            </button>
          </div>

          <div
            className="messages-container flex-1 p-3 overflow-y-auto space-y-3"
            style={{ backgroundColor: config.backgroundColor }}
          >
            {firstMessageShown &&
              config.firstBotMessage &&
              messages.length === 0 && (
                <div className="flex items-start gap-3">
                  <img
                    src={avatar}
                    alt="Bot"
                    className="w-8 h-8 rounded-full flex-shrink-0"
                  />
                  <div
                    className="max-w-xs px-3 py-2 rounded-2xl text-sm leading-relaxed"
                    style={{
                      backgroundColor: config.botBubble,
                      color: config.botText,
                      borderBottomLeftRadius: "6px",
                    }}
                    dangerouslySetInnerHTML={{
                      __html: parseMarkdown(config.firstBotMessage),
                    }}
                  />
                </div>
              )}

            {messages.map((message: Message, index: number) => (
              <div key={index}>
                {message.role === "user" ? (
                  <div className="flex justify-end">
                    <div
                      className="max-w-xs px-3 py-2 rounded-2xl text-sm leading-relaxed"
                      style={{
                        backgroundColor: config.userBubble,
                        color: config.userText,
                        borderBottomRightRadius: "6px",
                      }}
                    >
                      {message.content}
                    </div>
                  </div>
                ) : message.role === "assistant" ? (
                  <div className="flex items-start gap-3">
                    <img
                      src={avatar}
                      alt="Bot"
                      className="w-8 h-8 rounded-full flex-shrink-0"
                    />
                    <div
                      className="max-w-xs px-3 py-2 rounded-2xl text-sm leading-relaxed"
                      style={{
                        backgroundColor: config.botBubble,
                        color: config.botText,
                        borderBottomLeftRadius: "6px",
                      }}
                      dangerouslySetInnerHTML={{
                        __html: parseMarkdown(message.content),
                      }}
                    />
                  </div>
                ) : null}
              </div>
            ))}

            {loading && <TypingIndicator />}

            <div ref={messagesEndRef} />
          </div>

          <div
            className="flex gap-2 p-3 border-t"
            style={{
              backgroundColor: config.headerColor,
              borderTopColor: "rgba(255, 255, 255, 0.1)",
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Digite sua mensagem..."
              disabled={loading}
              className="flex-1 px-3 py-2 rounded-lg border-none text-sm outline-none transition-all duration-200 disabled:opacity-50"
              style={{
                backgroundColor: config.backgroundColor,
                color: "#fff",
              }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="px-4 py-2 rounded-lg border-none text-white text-sm font-medium cursor-pointer transition-all duration-200 disabled:opacity-50 hover:opacity-90"
              style={{
                backgroundColor: config.buttonColor,
              }}
            >
              {loading ? "..." : "Enviar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
