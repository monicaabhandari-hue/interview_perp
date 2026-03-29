import { useState } from "react";
import PrepForm from "./components/PrepForm";
import QuestionList from "./components/QuestionList";
import "./App.css";

export default function App() {
  const [questions, setQuestions] = useState([]);

  const handleQuestions = (data) => {
    setQuestions(data);
  };

  const handleStartOver = () => {
    setQuestions([]);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">🎯 Interview Prep</h1>
        {questions.length > 0 && (
          <button className="start-over-btn" onClick={handleStartOver}>
            ← Start Over
          </button>
        )}
      </header>

      <main className="app-main">
        {questions.length === 0 ? (
          <PrepForm onQuestions={handleQuestions} />
        ) : (
          <QuestionList questions={questions} />
        )}
      </main>
    </div>
  );
}