import { Chatbot } from "./components/Chatbot";

const App = () => {
  return (
    <div className="h-dvh w-full flex justify-end items-end bg-zinc-800">
      <Chatbot provider="chrome" />
    </div>
  );
};

export default App;
