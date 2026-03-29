import { useState, useEffect } from "react";
import PrepForm from "./components/PrepForm";
import QuestionList from "./components/QuestionList";
import "./App.css";

const STORAGE_KEYS = {
  questions: "ip_questions",
  answers: "ip_answers",
};

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [questions, setQuestions] = useState(() =>
    loadFromStorage(STORAGE_KEYS.questions, [])
  );
  const [answers, setAnswers] = useState(() =>
    loadFromStorage(STORAGE_KEYS.answers, {})
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.questions, JSON.stringify(questions));
  }, [questions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.answers, JSON.stringify(answers));
  }, [answers]);

  const handleQuestions = (data) => {
    setQuestions(data);
    setAnswers({});
  };

  const handleStartOver = () => {
    setQuestions([]);
    setAnswers({});
  };

  const handleClearSession = () => {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    setQuestions([]);
    setAnswers({});
  };

  const hasSession = questions.length > 0;

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">🎯 Interview Prep</h1>
        {hasSession && (
          <div className="header-actions">
            <button className="start-over-btn" onClick={handleStartOver}>
              ← Start Over
            </button>
            <button className="clear-session-btn" onClick={handleClearSession}>
              Clear Session
            </button>
          </div>
        )}
      </header>

      <main className="app-main">
        {!hasSession ? (
          <PrepForm onQuestions={handleQuestions} />
        ) : (
          <QuestionList
            questions={questions}
            answers={answers}
            onAnswersChange={setAnswers}
          />
        )}
      </main>
    </div>
  );
}