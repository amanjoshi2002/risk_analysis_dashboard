import React from "react";
import { Link } from "react-router-dom";
import './Navbar.css'; // Import styles for the Navbar

const Navbar = () => {
    return (
        <nav className="navbar">
            <h1>Risk Analysis Dashboard</h1>
            <ul>
                <li><Link to="/">Home</Link></li>
            </ul>
        </nav>
    );
};

export default Navbar; 