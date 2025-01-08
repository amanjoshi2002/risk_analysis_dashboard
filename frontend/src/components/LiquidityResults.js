import React from "react";
import { useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";

function LiquidityResults() {
  const location = useLocation();
  const { result } = location.state || {};

  if (!result) {
    return <div>No results to display.</div>;
  }

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Liquidity Management Results</h1>
      <div
        style={{
          marginTop: "20px",
          padding: "10px",
          border: "1px solid #ccc",
          background: "#f9f9f9",
        }}
      >
        <h2>Results:</h2>

        {/* Display insights */}
        <div>
          <h3>Insights:</h3>
          <div style={{ marginBottom: "10px" }}>
            <strong>Balance Sheet:</strong>
            <ul>
              <li>Current Assets: ${result.balance_sheet.current_assets.toLocaleString()}</li>
              <li>Current Liabilities: ${result.balance_sheet.current_liabilities.toLocaleString()}</li>
              <li>Total Assets: ${result.balance_sheet.total_assets.toLocaleString()}</li>
              <li>Total Liabilities: ${result.balance_sheet.total_liabilities.toLocaleString()}</li>
            </ul>
          </div>
          <div style={{ marginBottom: "10px" }}>
            <strong>Cash Flow:</strong>
            <ul>
              <li>Free Cash Flow: ${result.cash_flow.insights.free_cash_flow.toLocaleString()}</li>
            </ul>
          </div>
          <div style={{ marginBottom: "10px" }}>
            <strong>Financials Data:</strong>
            <ul>
              <li>Gross Profit: ${result.financials_data.insights.gross_profit.toLocaleString()}</li>
              <li>Operating Income: ${result.financials_data.insights.operating_income.toLocaleString()}</li>
            </ul>
          </div>
        </div>

        {/* Historical Chart */}
        {result.historical_chart?.error ? (
          <div style={{ marginTop: "20px", color: "red" }}>
            <h3>Historical Chart Error:</h3>
            <p>{result.historical_chart.error}</p>
          </div>
        ) : (
          result.historical_chart?.chart && (
            <div style={{ marginTop: "20px" }}>
              <h3>Historical Closing Prices Chart</h3>
              <img
                src={`data:image/png;base64,${result.historical_chart.chart}`}
                alt="Historical Chart"
                style={{ maxWidth: "100%", height: "auto" }}
              />
              <p style={{ marginTop: "10px" }}>{result.historical_chart.explanation}</p>
            </div>
          )
        )}

        {/* Liquidity Analysis */}
        {result.liquidity_analysis && (
          <div style={{ marginTop: "20px" }}>
            <h3>Liquidity Analysis:</h3>
            <ul>
              <li>Cash Ratio: {result.liquidity_analysis.cash_ratio.toFixed(2)}</li>
              <li>Current Working Capital: ${result.liquidity_analysis.current_working_capital.toLocaleString()}</li>
              <li>Net Debt: ${result.liquidity_analysis.net_debt.toLocaleString()}</li>
              <li>Quick Ratio: {result.liquidity_analysis.quick_ratio.toFixed(2)}</li>
            </ul>
          </div>
        )}

        {/* Gemini Summary */}
        {result.summary && (
          <div style={{ marginTop: "20px" }}>
            <h3>Gemini Summary:</h3>
            <ReactMarkdown>{result.summary}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

export default LiquidityResults; 