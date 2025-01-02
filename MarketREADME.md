### README

---

# **Stock Dashboard API**

This project is a FastAPI-based backend designed to provide real-time stock market analysis and investment suggestions. It integrates multiple APIs to fetch financial data and news articles to assist users in making informed investment decisions. The application also supports interaction with a React-based frontend.

---

## Table of Contents
1. [Features](#features)
2. [Setup Instructions](#setup-instructions)
3. [API Endpoints](#api-endpoints)
4. [Code Explanation](#code-explanation)
    - [Main API Endpoint](#main-api-endpoint)
    - [Utility Functions](#utility-functions)
5. [Technologies Used](#technologies-used)
6. [Future Improvements](#future-improvements)

---

## **Features**
- Fetches real-time stock prices using the Alpha Vantage API.
- Provides historical stock data for the past 5 years.
- Fetches the top 5 news articles related to a stock using the News API.
- Suggests investment decisions based on stock trends and news sentiment analysis.
- CORS middleware is enabled to support interaction with a React frontend.

---

## **Setup Instructions**

### Prerequisites
1. Python 3.8 or higher.
2. Node.js and npm for the frontend integration.
3. API keys for:
   - **Alpha Vantage API** (for stock data)
   - **News API** (for fetching news articles).

### Backend Setup
1. Clone the repository:
   ```bash
   git clone <repository_url>
   cd stock-dashboard-backend
   ```

2. Install dependencies:
   ```bash
   pip install fastapi uvicorn requests
   ```

3. Add your API keys:
   Replace the `NEWS_API_KEY` and `STOCKS_API_KEY` in the code with your API keys.

4. Start the backend server:
   ```bash
   uvicorn backend:app --reload
   ```

### Frontend Setup (React)
1. Navigate to the frontend directory:
   ```bash
   cd stock-dashboard-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the React development server:
   ```bash
   npm start
   ```

---

## **API Endpoints**

### **`GET /search/{input_value}`**
Fetches stock data, news articles, and provides an investment suggestion for a given company name or stock symbol.

**Parameters**:
- `input_value` (string): The company name or stock symbol (e.g., "Tesla" or "TSLA").

**Response**:
- **Current Stock Price**.
- **Historical Stock Data**.
- **News Articles** (Top 5).
- **Investment Suggestion**:
  - **Invest**: Strong growth rate and positive sentiment.
  - **Hold**: Moderate growth or neutral sentiment.
  - **Avoid**: Decline in stock price and negative sentiment.

---

## **Code Explanation**

### **Main API Endpoint**
#### `@app.get("/search/{input_value}")`
- Handles both company names and stock symbols.
- Steps:
  1. **Input Validation**:
     - Checks if the input is a symbol or name.
     - Converts company name to a stock symbol if necessary using `get_symbol_from_name`.
  2. **Fetch Stock Data**:
     - Uses `get_stock_data` to fetch current and historical stock prices from the Alpha Vantage API.
  3. **Fetch News Articles**:
     - Uses `get_news` to fetch top 5 relevant news articles using the News API.
  4. **Analyze Investment**:
     - Analyzes stock trends and sentiment using `analyze_investment`.
  5. **Return Results**:
     - Responds with current price, historical data, news, and an investment suggestion.

---

### **Utility Functions**

#### `is_symbol(input_value: str)`
- Determines if the input is a stock symbol based on length and case (e.g., "TSLA").

#### `get_symbol_from_name(company_name: str)`
- Converts a company name to its stock symbol using the Alpha Vantage API.
- Example Input: `Tesla`
- Example Output: `"TSLA"`

#### `get_stock_data(symbol: str)`
- Fetches:
  1. Current stock price using `GLOBAL_QUOTE` from Alpha Vantage.
  2. Historical stock data (monthly prices for the last 5 years).

#### `get_news(query: str)`
- Fetches the top 5 news articles related to the stock symbol or company name using the News API.
- Returns:
  - Article title.
  - URL for detailed reading.

#### `analyze_investment(historical_data, current_price, news)`
- **Analysis Logic**:
  - **Invest**: Growth > 20% over 5 years and positive news sentiment.
  - **Hold**: Positive growth but mixed sentiment.
  - **Avoid**: Negative growth or unfavorable sentiment.
- Outputs:
  - Investment suggestion.
  - Summary explaining the suggestion.

---

## **Technologies Used**
1. **Backend**:
   - FastAPI (Python framework for building APIs).
   - Uvicorn (ASGI server for running FastAPI).
   - Requests (for making API calls to Alpha Vantage and News API).
2. **Frontend**:
   - React (for the user interface).
   - Axios (for HTTP requests from React to FastAPI).
3. **APIs**:
   - Alpha Vantage API (for stock data).
   - News API (for news articles).

---

## **Future Improvements**
1. **Enhance Error Handling**:
   - Add detailed error messages for specific scenarios (e.g., invalid input, API errors).
2. **User Authentication**:
   - Secure the API endpoints with authentication.
3. **Add Charts**:
   - Integrate a library like `Chart.js` to display historical stock trends graphically.
4. **Sentiment Analysis**:
   - Use Natural Language Processing (NLP) to analyze the sentiment of news articles dynamically.
5. **Database Integration**:
   - Store fetched data in a database for caching and quicker responses.

---

This README provides a comprehensive guide to understanding and setting up.
