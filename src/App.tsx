import { Chatbot } from "./components/Chatbot";

const App = () => {
  return (
    <div className="h-dvh w-full flex justify-end items-end bg-black">
      <Chatbot
        provider="chrome"
        config={{
          chatbotName: "Assistente IA",
          welcomeBubble: "👋 Olá! Suas mensagens são salvas automaticamente!",
          firstBotMessage:
            "Olá! Sou seu assistente virtual. Suas mensagens são salvas e você pode continuar nossa conversa mesmo após recarregar a página!",
          showClearButton: true,
          limit: 10,
        }}
      />
    </div>
  );
};

export default App;
