import React, { useState } from "react";
import './CreditRiskForm.css'; // Import the CSS file for styling

function CreditRiskForm() {
  const questions = [
    { name: "age", question: "What is your age?", type: "number" },
    { name: "owns_house", question: "Do you own a house? (1 = Yes, 0 = No)", type: "number" },
    { name: "owns_car", question: "Do you own a car? (1 = Yes, 0 = No)", type: "number" },
    { name: "credit_score", question: "What is your credit score?", type: "number" },
    { name: "net_yearly_income", question: "What is your net yearly income?", type: "number" },
    { name: "credit_limit", question: "What is your total credit limit?", type: "number" },
    { name: "credit_limit_used", question: "What percentage of your credit limit have you used?", type: "number" },
    { name: "default_in_last_6months", question: "How many times have you defaulted in the last 6 months?", type: "number" },
    { name: "gender", question: "What is your gender? (1 = Male, 0 = Female)", type: "number" },
    { name: "migrant_worker", question: "Are you a migrant worker? (1 = Yes, 0 = No)", type: "number" },
    { name: "no_of_children", question: "How many children do you have?", type: "number" },
    { name: "no_of_days_employed", question: "How many days have you been employed?", type: "number" },
  ];

  const occupations = [
    "Accountants",
    "Cleaning_staff",
    "Cooking_staff",
    "Drivers",
    "HR_staff",
    "IT_staff",
    "Laborers",
    "Managers",
    "Medicine_staff",
    "Private_service_staff",
    "Sales_staff",
    "Secretaries",
    "Security_staff",
    "Waiters_barmen_staff",
  ];

  const [responses, setResponses] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    const { value } = e.target;
    setResponses({ ...responses, [questions[currentQuestionIndex].name]: value });
  };

  const handleOccupationChange = (e) => {
    const selectedOccupation = e.target.value;
    const occupationResponses = {};

    // Mark selected occupation as 1 and others as 0
    occupations.forEach((occupation) => {
      occupationResponses[`occupation_${occupation}`] = occupation === selectedOccupation ? 1 : 0;
    });

    setResponses({ ...responses, ...occupationResponses });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmit();
    }
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
      console.log("Server response:", data);
      setResult(data);
    } catch (error) {
      console.error("Error fetching prediction:", error);
      alert("Error fetching prediction. Please check your connection and try again.");
    }
  };

  return (
    <div className="credit-risk-form full-screen">
      <h1>Credit Risk </h1>
      {result ? (
        <div className="result">
          <h2>Prediction Results</h2>
          <div className="predictions-grid">
            <h3>Predictions</h3>
            <div className="predictions-container">
              {Object.entries(result.predictions).map(([model, value]) => (
                <div className="prediction-card" key={model}>
                  <h4>{model.replace("_", " ")}</h4>
                  <p>{value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="average-score-window">
            <h3>Average Score</h3>
            <div>{result.average_score}</div>
          </div>
          <div className="risk-category-window">
            <h3>Risk Category</h3>
            <div>{result.risk_category}</div>
          </div>
          <div className="summary-window">
            <h3>Summary</h3>
            <div dangerouslySetInnerHTML={{ __html: result.summary }} />
          </div>
        </div>
      ) : (
        <div className="form-container">
          {currentQuestionIndex < questions.length ? (
            <>
              <h2>Question {currentQuestionIndex + 1} of {questions.length}</h2>
              <p>{questions[currentQuestionIndex].question}</p>
              <input
                className="form-input"
                type={questions[currentQuestionIndex].type}
                value={responses[questions[currentQuestionIndex].name] || ""}
                onChange={handleChange}
              />
              <button className="next-button" onClick={handleNext}>
                Next
              </button>
            </>
          ) : (
            <>
              <h2>Select Your Occupation</h2>
              <select className="occupation-select" onChange={handleOccupationChange} defaultValue="">
                <option value="" disabled>
                  Select an occupation
                </option>
                {occupations.map((occupation) => (
                  <option key={occupation} value={occupation}>
                    {occupation.replace("_", " ")}
                  </option>
                ))}
              </select>
              <button className="submit-button" onClick={handleSubmit}>
                Submit
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default CreditRiskForm;
