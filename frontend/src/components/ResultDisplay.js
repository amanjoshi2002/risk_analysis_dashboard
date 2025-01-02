import React from "react";

const ResultDisplay = ({ result, error }) => {
    if (error) {
        return <p style={{ color: "red" }}>Error: {error}</p>;
    }

    if (!result) {
        return <p>Enter a company symbol or name to see the results.</p>;
    }

    return (
        <div>
            <h2>Results for {result.input} ({result.stock_symbol})</h2>
            <p><strong>Current Price:</strong> ${result.current_price}</p>
            <p><strong>Suggestion:</strong> {result.suggestion}</p>
            <p><strong>Summary:</strong> {result.summary}</p>
            <h3>News Articles</h3>
            <ul>
                {result.news.map((article, index) => (
                    <li key={index}>
                        <a href={article.url} target="_blank" rel="noopener noreferrer">
                            {article.title}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ResultDisplay;
