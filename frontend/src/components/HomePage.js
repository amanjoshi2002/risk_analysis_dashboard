import React from "react";
import './HomePage.css'; // Ensure you have the necessary CSS for styling

const HomePage = () => {
    const navigateToRisk = (riskType) => {
        if (riskType === 'market') {
            window.location.href = '/market';
        } else if (riskType === 'credit') {
            window.location.href = '/credit';
        } else {
            alert(`${riskType.charAt(0).toUpperCase() + riskType.slice(1)} risk analysis coming soon!`);
        }
    };

    return (
        <div>
            <h1>Risk Analysis Dashboard</h1>
            <div className="cards-container">
                <div className="card credit" onClick={() => navigateToRisk('credit')}>
                    <div className="card-header">Credit Risk</div>
                    <div className="card-content">
                        <div className="card-icon">💳</div>
                        <p>Analyze and assess credit risks associated with financial instruments and counterparties.</p>
                    </div>
                </div>

                <div className="card market" onClick={() => navigateToRisk('market')}>
                    <div className="card-header">Market Risk</div>
                    <div className="card-content">
                        <div className="card-icon">📈</div>
                        <p>Monitor and analyze market movements and their impact on investment portfolios.</p>
                    </div>
                </div>

                <div className="card liquidity" onClick={() => navigateToRisk('liquidity')}>
                    <div className="card-header">Liquidity Risk</div>
                    <div className="card-content">
                        <div className="card-icon">💧</div>
                        <p>Evaluate and track liquidity positions and potential risks in financial operations.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage; 