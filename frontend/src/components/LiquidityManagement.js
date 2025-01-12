import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function LiquidityManagement() {
  const [files, setFiles] = useState({
    cash_flow: null,
    historical: null,
    financials: null,
    balance_sheet: null,
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setFiles({ ...files, [e.target.name]: e.target.files[0] });
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    if (files.cash_flow) formData.append("cash_flow", files.cash_flow);
    if (files.historical) formData.append("historical", files.historical);
    if (files.financials) formData.append("financials", files.financials);
    if (files.balance_sheet) formData.append("balance_sheet", files.balance_sheet);

    try {
      const response = await axios.post("http://127.0.0.1:5000/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      navigate("/liquidity-results", { state: { result: response.data } });
    } catch (err) {
      setError("Error uploading files or processing data. Please try again.");
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif", maxWidth: "600px", margin: "0 auto" }}>
      <h1 style={{ textAlign: "center", marginBottom: "30px" }}>Liquidity Management</h1>
      <form onSubmit={handleUpload} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={{ marginBottom: "5px", fontWeight: "bold" }}>Cash Flow Data:</label>
          <input type="file" name="cash_flow" onChange={handleFileChange} style={inputStyle} />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={{ marginBottom: "5px", fontWeight: "bold" }}>Historical Data:</label>
          <input type="file" name="historical" onChange={handleFileChange} style={inputStyle} />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={{ marginBottom: "5px", fontWeight: "bold" }}>Financials Data:</label>
          <input type="file" name="financials" onChange={handleFileChange} style={inputStyle} />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={{ marginBottom: "5px", fontWeight: "bold" }}>Balance Sheet Data:</label>
          <input type="file" name="balance_sheet" onChange={handleFileChange} style={inputStyle} />
        </div>
        <button type="submit" style={buttonStyle}>
          Upload
        </button>
        {/* Link to dataset */}
      <div style={{ marginTop: "20px" }}>
        <p>
          Looking for data? <a href="https://www.kaggle.com/datasets/yahqaskaluso/s-and-p500-financial-data-2013-2023" target="_blank" rel="noopener noreferrer">Get data from here</a>.
        </p>
      </div>
      </form>

      {error && <div style={{ marginTop: "20px", color: "red" }}>{error}</div>}
    </div>
  );
}

const inputStyle = {
  padding: "10px",
  borderRadius: "4px",
  border: "1px solid #ccc",
  fontSize: "16px",
};

const buttonStyle = {
  marginTop: "20px",
  padding: "10px 20px",
  borderRadius: "4px",
  border: "none",
  backgroundColor: "#007BFF",
  color: "#fff",
  fontSize: "16px",
  cursor: "pointer",
  transition: "background-color 0.3s",
};

export default LiquidityManagement; 
