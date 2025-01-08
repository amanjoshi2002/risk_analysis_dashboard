import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HomePage from "./components/HomePage";
import MarketPage from "./components/MarketPage";
import CreditRiskForm from "./components/CreditRiskForm";
import LiquidityManagement from "./components/LiquidityManagement";
import LiquidityResults from "./components/LiquidityResults";
import Navbar from "./components/Navbar";
import './App.css';

const App = () => {
    return (
        <Router>
            <Navbar />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/market" element={<MarketPage />} />
                <Route path="/credit" element={<CreditRiskForm />} />
                <Route path="/liquidity" element={<LiquidityManagement />} />
                <Route path="/liquidity-results" element={<LiquidityResults />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </Router>
    );
};

const NotFound = () => {
    return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h2>404 - Page Not Found</h2>
            <p>The page you are looking for does not exist.</p>
        </div>
    );
};

export default App;
