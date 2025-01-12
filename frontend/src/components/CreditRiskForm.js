import React, { useState } from "react";
import ReactMarkdown from "react-markdown"; // For rendering Markdown
import "./CreditRiskForm.css"; // Import the CSS file for styling

function CreditRiskForm() {
  const questions = [
    { name: "agency", question: "Which credit agency are you using?", type: "agency" },
    { name: "credit_score", question: "What is your credit score?", type: "number" },
    { name: "age", question: "What is your age?", type: "number" },
    { name: "owns_house", question: "Do you own a house?", type: "binary" },
    { name: "owns_car", question: "Do you own a car?", type: "binary" },
    { name: "net_yearly_income", question: "What is your net yearly income?", type: "number" },
    { name: "credit_limit", question: "What is your total credit limit?", type: "number" },
    { name: "credit_limit_used", question: "What percentage of your credit limit have you used?", type: "number" },
    { name: "default_in_last_6months", question: "How many times have you defaulted in the last 6 months?", type: "number" },
    { name: "gender", question: "What is your gender?", type: "binary" },
    { name: "migrant_worker", question: "Are you a migrant worker?", type: "binary" },
    { name: "no_of_children", question: "How many children do you have?", type: "number" },
    { name: "no_of_days_employed", question: "How many days have you been employed?", type: "number" },
    { name: "occupation", question: "What is your occupation?", type: "occupation" },
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
    "Bussiness",
    "Self Employed"
  ];

  const agencyScoreRanges = {
    Experian: { min: 0, max: 999 },
    Equifax: { min: 0, max: 1000 },
    TransUnion: { min: 0, max: 710 },
  };

  const [responses, setResponses] = useState({});
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({}); // To track validation errors

  const handleChange = (e, name) => {
    const { value } = e.target;
    let numericValue;

    if (name === "gender") {
      numericValue = value === "Male" ? 1 : value === "Female" ? 0 : null;
    } else if (questions.find((q) => q.name === name)?.type === "binary") {
      numericValue = value === "Yes" ? 1 : value === "No" ? 0 : null;
    } else if (questions.find((q) => q.name === name)?.type === "number") {
      numericValue = value === "" ? "" : parseFloat(value);

      // Prevent negative values
      if (numericValue < 0) {
        setErrors({ ...errors, [name]: "Value cannot be negative." });
        return; // Prevent setting invalid value
      }

      // Validate credit score if applicable
      if (name === "credit_score" && responses.agency) {
        const selectedAgency = responses.agency;
        const range = agencyScoreRanges[selectedAgency];
        if (numericValue < range.min || numericValue > range.max) {
          setErrors({ ...errors, credit_score: `Credit score must be between ${range.min} and ${range.max} for ${selectedAgency}.` });
          return; // Prevent setting invalid value
        }
      }
    } else {
      numericValue = value;
    }

    setResponses({ ...responses, [name]: numericValue });
    setErrors({ ...errors, [name]: "" }); // Clear error for the field
  };

  const validateForm = () => {
    const newErrors = {};
    questions.forEach((q) => {
      if (responses[q.name] === undefined || responses[q.name] === null || responses[q.name] === "") {
        newErrors[q.name] = "This field is required.";
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Return true if no errors
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return; // Stop if validation fails

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
      <h1>Credit Risk Assessment</h1>
      {result ? (
        <div className="result">
          <h2>Prediction Results</h2>
          <div className="predictions-grid">
            {result.predictions &&
              Object.entries(result.predictions).map(([model, value]) => (
                <div className="prediction-card" key={model}>
                  <div className="prediction-title">{model.replace("_", " ")}</div>
                  <div className="prediction-value">{value}</div>
                </div>
              ))}
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
        <form className="form-container" onSubmit={handleSubmit}>
          {questions.map((q, index) => (
            <div key={q.name} className="form-group">
              <label htmlFor={q.name}>
                {q.question} <span className="required">*</span>
              </label>
              {q.type === "agency" ? (
                <>
                  <select
                    id={q.name}
                    className={`form-input ${errors[q.name] ? "error" : ""}`}
                    value={responses[q.name] || ""}
                    onChange={(e) => handleChange(e, q.name)}
                  >
                    <option value="" disabled>
                      Select a credit agency
                    </option>
                    <option value="Experian">Experian</option>
                    <option value="Equifax">Equifax</option>
                    <option value="TransUnion">TransUnion</option>
                  </select>
                  <div className="agency-ranges">
                    <p>Experian: 0-999</p>
                    <p>Equifax: 0-1000</p>
                    <p>TransUnion: 0-710</p>
                  </div>
                </>
              ) : q.type === "binary" && q.name !== "gender" ? (
                <select
                  id={q.name}
                  className={`form-input ${errors[q.name] ? "error" : ""}`}
                  value={responses[q.name] === 1 ? "Yes" : responses[q.name] === 0 ? "No" : ""}
                  onChange={(e) => handleChange(e, q.name)}
                >
                  <option value="" disabled>
                    Select Yes or No
                  </option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              ) : q.name === "gender" ? (
                <select
                  id={q.name}
                  className={`form-input ${errors[q.name] ? "error" : ""}`}
                  value={responses[q.name] === 1 ? "Male" : responses[q.name] === 0 ? "Female" : ""}
                  onChange={(e) => handleChange(e, q.name)}
                >
                  <option value="" disabled>
                    Select Gender
                  </option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              ) : q.name === "occupation" ? (
                <select
                  id={q.name}
                  className={`form-input ${errors[q.name] ? "error" : ""}`}
                  value={responses[q.name] || ""}
                  onChange={(e) => handleChange(e, q.name)}
                >
                  <option value="" disabled>
                    Select your occupation
                  </option>
                  {occupations.map((occupation, idx) => (
                    <option key={idx} value={occupation}>
                      {occupation}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={q.name}
                  className={`form-input ${errors[q.name] ? "error" : ""}`}
                  type={q.type}
                  value={responses[q.name] === 0 ? 0 : responses[q.name] || ""}
                  onChange={(e) => handleChange(e, q.name)}
                />
              )}
              {errors[q.name] && <span className="error-message">{errors[q.name]}</span>}
            </div>
          ))}
          <button type="submit" className="submit-button">
            Submit
          </button>
        </form>
      )}
    </div>
  );
}

export default CreditRiskForm;
