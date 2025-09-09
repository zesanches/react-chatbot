import { useEffect, useState } from "react";
import { useChatbot } from "../hooks/useChatbot";

type ChatbotProps = {
  provider: "huggingface" | "chrome";
  avatar?: string;
};

type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

export function Chatbot({ provider, avatar }: ChatbotProps) {
  const { messages, loading, sendMessage, init } = useChatbot({
    provider,
  });

  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  };

  useEffect(() => {
    init();
  }, [init]);

  return (
    <div className="w-80 h-96 border border-gray-300 rounded-lg flex flex-col overflow-hidden">
      <div className="flex-1 p-2 flex flex-col gap-2 overflow-y-auto">
        {messages.map((message: Message, index: number) => (
          <div
            key={index}
            className={`flex items-center max-w-[70%] px-3 py-2 rounded-md break-words break-all ${
              message.role === "user"
                ? "bg-blue-500 text-white self-end"
                : "bg-gray-200 text-gray-900 self-start"
            }`}
          >
            {message.role === "assistant" && avatar && (
              <img
                src={avatar}
                alt="bot"
                className="w-6 h-6 rounded-full mr-2"
              />
            )}
            <span>{message.content}</span>
          </div>
        ))}
        {loading && <p className="italic text-gray-500">Digitando...</p>}
      </div>
      <div className="flex border-t border-gray-300">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="flex-1 px-3 py-2 outline-none"
        />
        <button
          onClick={handleSend}
          className="bg-blue-500 text-white px-4 hover:bg-blue-600 transition"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
