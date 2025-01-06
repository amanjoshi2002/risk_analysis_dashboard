import React, { useState } from "react";
import ReactMarkdown from "react-markdown"; // For rendering Markdown
import './CreditRiskForm.css'; // Import the CSS file for styling

function CreditRiskForm() {
  const questions = [
    { name: "agency", question: "Which credit agency are you using?", type: "agency" },
    { name: "credit_score", question: "What is your credit score?", type: "number" },
    { name: "age", question: "What is your age?", type: "number" },
    { name: "owns_house", question: "Do you own a house? (1 = Yes, 0 = No)", type: "binary" },
    { name: "owns_car", question: "Do you own a car? (1 = Yes, 0 = No)", type: "binary" },
    { name: "net_yearly_income", question: "What is your net yearly income?", type: "number" },
    { name: "credit_limit", question: "What is your total credit limit?", type: "number" },
    { name: "credit_limit_used", question: "What percentage of your credit limit have you used?", type: "number" },
    { name: "default_in_last_6months", question: "How many times have you defaulted in the last 6 months?", type: "number" },
    { name: "gender", question: "What is your gender?", type: "binary" },
    { name: "migrant_worker", question: "Are you a migrant worker? (1 = Yes, 0 = No)", type: "binary" },
    { name: "no_of_children", question: "How many children do you have?", type: "number" },
    { name: "no_of_days_employed", question: "How many days have you been employed?", type: "number" },
  ];

  const [responses, setResponses] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [selectedField, setSelectedField] = useState(null);

  const handleChange = (e) => {
    const { value } = e.target;
    let numericValue;

    if (questions[currentQuestionIndex].name === "gender") {
      numericValue = value === "Male" ? 1 : value === "Female" ? 0 : null;
    } else {
      numericValue =
        value === "Yes"
          ? 1
          : value === "No"
          ? 0
          : questions[currentQuestionIndex].type === "number"
          ? parseFloat(value) || 0
          : value;
    }

    setResponses({ ...responses, [questions[currentQuestionIndex].name]: numericValue });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedField(null);
    } else {
      handleSubmit();
    }
  };

  const handleFieldSelect = (fieldName) => {
    setSelectedField(fieldName);
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(responses),
      });
      const data = await response.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      setResult(data);
    } catch (error) {
      console.error("Error fetching prediction:", error);
      alert("Error fetching prediction. Please check your connection and try again.");
    }
  };

  return (
    <div className="credit-risk-form full-screen">
      <h1>Credit Risk</h1>
      {result ? (
        <div className="result">
          <h2>Prediction Results</h2>
          <div className="predictions-grid">
            <h3>Predictions</h3>
            <div className="predictions-container">
              {result.predictions &&
                Object.entries(result.predictions).map(([model, value]) => (
                  <div className="prediction-card" key={model}>
                    <h4>{model.replace("_", " ")}</h4>
                    <p>{value}</p>
                  </div>
                ))}
            </div>
          </div>
          <div className="average-score-window">
            <h3>Average Score</h3>
            <div>{result.average_score || "N/A"}</div>
          </div>
          <div className="risk-category-window">
            <h3>Risk Category</h3>
            <div>{result.risk_category || "N/A"}</div>
          </div>
          <div className="summary-window">
            <h3>Summary</h3>
            <ReactMarkdown>{result.summary || "No summary available."}</ReactMarkdown>
          </div>
        </div>
      ) : (
        <div className="form-container">
          {currentQuestionIndex < questions.length ? (
            <>
              <h2>Question {currentQuestionIndex + 1} of {questions.length}</h2>
              <p>{questions[currentQuestionIndex].question}</p>
              {questions[currentQuestionIndex].name === "agency" ? (
                <select
                  className={`form-input ${selectedField === "agency" ? "selected" : ""}`}
                  onChange={(e) => { handleChange(e); handleFieldSelect("agency"); }}
                  defaultValue=""
                >
                  <option value="" disabled>Select a credit agency</option>
                  <option value="Experian">Experian</option>
                  <option value="Equifax">Equifax</option>
                  <option value="TransUnion">TransUnion</option>
                </select>
              ) : questions[currentQuestionIndex].type === "binary" && questions[currentQuestionIndex].name !== "gender" ? (
                <select
                  className={`form-input ${selectedField === "binary" ? "selected" : ""}`}
                  onChange={(e) => { handleChange(e); handleFieldSelect("binary"); }}
                  defaultValue=""
                >
                  <option value="" disabled>Select Yes or No</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              ) : questions[currentQuestionIndex].name === "gender" ? (
                <select
                  className={`form-input ${selectedField === "gender" ? "selected" : ""}`}
                  onChange={(e) => { handleChange(e); handleFieldSelect("gender"); }}
                  defaultValue=""
                >
                  <option value="" disabled>Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              ) : (
                <input
                  className={`form-input ${selectedField === questions[currentQuestionIndex].name ? "selected" : ""}`}
                  type={questions[currentQuestionIndex].type}
                  value={responses[questions[currentQuestionIndex].name] || ""}
                  onChange={(e) => { handleChange(e); handleFieldSelect(questions[currentQuestionIndex].name); }}
                />
              )}
              <button className="next-button" onClick={handleNext}>
                Next
              </button>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default CreditRiskForm;
