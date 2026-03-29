import { useState } from "react";
import "./QuestionList.css";

export default function QuestionList({ questions }) {
  const [activeTab, setActiveTab] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState({});
  const [loadingId, setLoadingId] = useState(null);

  const filtered =
    activeTab === "all"
      ? questions
      : questions.filter((q) => q.type === activeTab);

  const toggleCard = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleAnswerChange = (id, value) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleGetFeedback = async (question) => {
    const answer = answers[question.id];
    if (!answer?.trim()) return;

    setLoadingId(question.id);
    setFeedback((prev) => ({ ...prev, [question.id]: null }));

    try {
      const response = await fetch("http://localhost:8000/evaluate-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.question,
          question_type: question.type,
          answer,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.detail || `Server error (${response.status})`);
      }

      const data = await response.json();
      setFeedback((prev) => ({ ...prev, [question.id]: data }));
    } catch (err) {
      setFeedback((prev) => ({
        ...prev,
        [question.id]: { error: err.message },
      }));
    } finally {
      setLoadingId(null);
    }
  };

  if (!questions.length) return null;

  return (
    <div className="question-list">
      <div className="tabs">
        {['all', 'behavioral', 'technical'].map((tab) => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            <span className="tab-count">
              {tab === "all"
                ? questions.length
                : questions.filter((q) => q.type === tab).length}
            </span>
          </button>
        ))}
      </div>

      <div className="cards">
        {filtered.map((q) => {
          const isExpanded = expandedId === q.id;
          const fb = feedback[q.id];
          const isLoading = loadingId === q.id;

          return (
            <div
              key={q.id}
              className={`card ${isExpanded ? "expanded" : ""}`}
            >
              <div className="card-header" onClick={() => toggleCard(q.id)}>
                <span className={`badge badge-${q.type}`}>{q.type}</span>
                <span className="card-question">{q.question}</span>
                <span className="chevron">{isExpanded ? "▲" : "▼"}</span>
              </div>

              {isExpanded && (
                <div className="card-body">
                  <textarea
                    className="answer-input"
                    placeholder="Type your answer here..."
                    rows={4}
                    value={answers[q.id] || ""}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  />

                  <button
                    className="feedback-btn"
                    disabled={isLoading || !answers[q.id]?.trim()}
                    onClick={() => handleGetFeedback(q)}
                  >
                    {isLoading ? (
                      <span className="spinner-wrapper">
                        <span className="spinner" />
                        Evaluating...
                      </span>
                    ) : (
                      "Get Feedback"
                    )}
                  </button>

                  {fb && !fb.error && (
                    <div className="feedback-result">
                      <div className="score-bar">
                        <span className="score-label">Score</span>
                        <div className="score-track">
                          <div
                            className="score-fill"
                            style={{ width: `${fb.score * 10}%` }}
                          />
                        </div>
                        <span className="score-value">{fb.score}/10</span>
                      </div>

                      <div className="feedback-section strengths">
                        <h4>✅ Strengths</h4>
                        <ul>
                          {fb.strengths.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="feedback-section improvements">
                        <h4>💡 Improvements</h4>
                        <ul>
                          {fb.improvements.map((imp, i) => (
                            <li key={i}>{imp}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {fb?.error && (
                    <p className="error-message">{fb.error}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}