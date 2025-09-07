import { Chatbot } from "./components/Chatbot";

const App = () => {
  return (
    <div className="h-dvh w-full flex justify-end items-end">
      <Chatbot provider="chrome" systemPrompt="" />
    </div>
  );
};

export default App;
