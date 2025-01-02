import React, { useState } from "react";
import axios from "axios"; // Import axios
import './MarketPage.css'; // Ensure you have the necessary CSS for styling
import Chart from 'chart.js/auto'; // Ensure you have chart.js installed

const MarketPage = () => {
    const [companySymbol, setCompanySymbol] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [stockData, setStockData] = useState(null);
    const [stockChart, setStockChart] = useState(null);
    const [timeFrame, setTimeFrame] = useState("1Y"); // Default time frame

    const searchStock = async () => {
        setLoading(true);
        setError("");
        setStockData(null);

        try {
            const response = await axios.get(`http://127.0.0.1:5000/search/${companySymbol}`);
            const data = response.data;

            if (data.error) {
                setError(data.error);
                return;
            }

            setStockData(data);
            updateChart(data.historical_data);
        } catch (err) {
            setError("Error fetching stock data");
        } finally {
            setLoading(false);
        }
    };

    const updateChart = (historicalData) => {
        if (stockChart) {
            stockChart.destroy();
        }

        const ctx = document.getElementById('stockChart').getContext('2d');
        const sortedData = historicalData.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Filter data based on selected time frame
        const filteredData = sortedData.filter(item => {
            const date = new Date(item.date);
            const now = new Date();
            if (timeFrame === "1Y") return date >= new Date(now.setFullYear(now.getFullYear() - 1));
            if (timeFrame === "3Y") return date >= new Date(now.setFullYear(now.getFullYear() - 3));
            if (timeFrame === "5Y") return date >= new Date(now.setFullYear(now.getFullYear() - 5));
            return true; // All time
        });

        const newChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: filteredData.map(item => item.date),
                datasets: [{
                    label: 'Stock Price',
                    data: filteredData.map(item => item.price),
                    borderColor: '#2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Historical Stock Price'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false
                    }
                }
            }
        });

        setStockChart(newChart);
    };

    const handleTimeFrameChange = (frame) => {
        setTimeFrame(frame);
        if (stockData) {
            updateChart(stockData.historical_data); // Update chart with new time frame
        }
    };

    return (
        <div className="container">
            <h2>Stock Analysis</h2>
            <div className="search-container">
                <input
                    type="text"
                    value={companySymbol}
                    onChange={(e) => setCompanySymbol(e.target.value)}
                    placeholder="Enter stock symbol (e.g., TSLA)"
                />
                <button onClick={searchStock}>Search</button>
            </div>

            {loading && <div className="loading">Loading...</div>}
            {error && <div className="error">{error}</div>}

            {stockData && (
                <div id="stockHeader" className="header">
                    <h2>Results for {companySymbol} ({stockData.stock_symbol})</h2>
                    <p><strong>Current Price:</strong> ${stockData.current_price}</p>
                    <p><strong>Suggestion:</strong> {stockData.suggestion}</p>
                </div>
            )}

            <div className="chart-container">
                <canvas id="stockChart"></canvas>
            </div>

            {stockData && (
                <div className="time-frame-buttons">
                    <button onClick={() => handleTimeFrameChange("1Y")}>1 Year</button>
                    <button onClick={() => handleTimeFrameChange("3Y")}>3 Years</button>
                    <button onClick={() => handleTimeFrameChange("5Y")}>5 Years</button>
                    <button onClick={() => handleTimeFrameChange("ALL")}>All Time</button>
                </div>
            )}

            {stockData && (
                <div className="summary-window">
                    <h3>Summary</h3>
                    <p>{stockData.summary}</p>
                </div>
            )}

            {stockData && (
                <div className="news-window">
                    <h3>News Articles</h3>
                    <ul>
                        {stockData.news.map((article, index) => (
                            <li key={index}>
                                <a href={article.url} target="_blank" rel="noopener noreferrer">
                                    {article.title}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default MarketPage; 