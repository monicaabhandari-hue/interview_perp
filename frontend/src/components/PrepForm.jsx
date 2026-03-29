import { useState } from "react";
import "./PrepForm.css";

export default function PrepForm({ onQuestions }) {
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:8000/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_title: jobTitle,
          company_name: companyName,
          job_description: jobDescription || undefined,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.detail || `Server error (${response.status})`);
      }

      const data = await response.json();
      onQuestions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="prep-form" onSubmit={handleSubmit}>
      <h2>Interview Prep</h2>

      <label htmlFor="jobTitle">Job Title *</label>
      <input
        id="jobTitle"
        type="text"
        placeholder="e.g. Senior Frontend Engineer"
        value={jobTitle}
        onChange={(e) => setJobTitle(e.target.value)}
        required
      />

      <label htmlFor="companyName">Company Name *</label>
      <input
        id="companyName"
        type="text"
        placeholder="e.g. Stripe"
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
        required
      />

      <label htmlFor="jobDescription">Job Description (optional)</label>
      <textarea
        id="jobDescription"
        placeholder="Paste the job description here..."
        rows={5}
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
      />

      <button type="submit" disabled={loading}>
        {loading ? (
          <span className="spinner-wrapper">
            <span className="spinner" />
            Generating...
          </span>
        ) : (
          "Generate Questions"
        )}
      </button>

      {error && <p className="error-message">{error}</p>}
    </form>
  );
}