from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import joblib
import pandas as pd
import google.generativeai as genai
import logging
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# Load the models and scaler for credit risk prediction
logreg = joblib.load('./logreg_model.pkl')
tree_model = joblib.load('./tree_model.pkl')
regr_rfr = joblib.load('./regr_rfr_model.pkl')
reg_catb = joblib.load('./reg_catb_model.pkl')
lgbm_model = joblib.load('./lgbm_model.pkl')
knn = joblib.load('./knn_model.pkl')
scaler = joblib.load('./scaler.pkl') 
feature_names = joblib.load('./feature_names.pkl')  

# Configure Gemini
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-flash")

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"]) 

# API Keys from .env
NEWS_API_KEY = os.getenv("NEWS_API_KEY")
STOCKS_API_KEY = os.getenv("STOCKS_API_KEY")
# Base URLs
NEWS_API_URL = "https://newsapi.org/v2/everything"
STOCKS_API_URL = "https://www.alphavantage.co/query"

@app.route('/search/<input_value>', methods=['GET'])
def search(input_value):
    """
    Fetch news articles, current stock price, historical stock data, and provide an investment suggestion.
    Handle both company symbols and company names.
    """
    try:
        # Convert company name to stock symbol if necessary
        if not is_symbol(input_value):
            stock_symbol = get_symbol_from_name(input_value)
            if not stock_symbol:
                return jsonify({"error": "Stock symbol not found for the given company name"}), 404
        else:
            stock_symbol = input_value

        # Fetch stock data
        stock_data = get_stock_data(stock_symbol)
        if not stock_data:
            return jsonify({"error": "Stock data not found"}), 404

        current_price = stock_data["current_price"]
        historical_data = stock_data["historical_data"]

        # Fetch news articles
        news = get_news(stock_symbol)
        if not news:
            return jsonify({"error": "News articles not found"}), 404

        # Analyze the historical data and news for investment suggestion
        suggestion, summary = analyze_investment(historical_data, current_price, news)

        # Return results for API response
        return jsonify({
            "input": input_value,
            "stock_symbol": stock_symbol,
            "current_price": current_price,
            "historical_data": historical_data,
            "news": news,
            "suggestion": suggestion,
            "summary": summary
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/predict', methods=['POST'])
def predict():
    try:
        input_data = request.json  # Get JSON data from the request
        sample_input = pd.DataFrame([input_data], columns=feature_names)
        sample_input.fillna(0, inplace=True)
        sample_input_scaled = scaler.transform(sample_input)

        predictions = {
            "Logistic Regression": int(logreg.predict(sample_input_scaled)[0]),
            "Decision Tree": int(tree_model.predict(sample_input_scaled)[0]),
            "Random Forest": int(regr_rfr.predict(sample_input_scaled)[0]),
            "CatBoost": int(reg_catb.predict(sample_input_scaled)[0]),
            "LightGBM": int(lgbm_model.predict(sample_input_scaled)[0]),
            "KNN": int(knn.predict(sample_input_scaled)[0])
        }

        avg_score = sum(predictions.values()) / len(predictions)
        risk_category = "Low Risk" if avg_score <= 0.33 else "Medium Risk" if avg_score <= 0.66 else "High Risk"

        # Use Gemini to generate a summary
        prompt = (
            f"The credit risk is {risk_category} based on an average prediction score of {avg_score:.2f}."
            f" Provide detailed advice in bullet points for improving financial stability and reducing risks."
        )
        response = model.generate_content(prompt)
        summary = response.text

        return jsonify({
            "predictions": predictions,
            "average_score": avg_score,
            "risk_category": risk_category,
            "summary": summary
        })

    except Exception as e:
        logging.error(f"Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Helper functions for backend.py functionality
def is_symbol(input_value: str) -> bool:
    return len(input_value) <= 5 and input_value.isupper()

def get_symbol_from_name(company_name: str) -> str:
    """
    Convert a company name to its stock symbol using the Alpha Vantage API.
    """
    try:
        response = requests.get(
            STOCKS_API_URL,
            params={
                "function": "SYMBOL_SEARCH",
                "keywords": company_name,
                "apikey": STOCKS_API_KEY
            }
        )
        if response.status_code != 200:
            raise Exception("Failed to fetch stock symbol")

        data = response.json().get("bestMatches", [])
        if not data:
            return None

        # Return the most relevant symbol
        return data[0]["1. symbol"]  # The key for the symbol in the API response
    except Exception as e:
        print(f"Error fetching stock symbol: {e}")
        return None

def get_stock_data(symbol: str):
    # Fetch current stock price
    current_price_response = requests.get(
        STOCKS_API_URL,
        params={
            "function": "GLOBAL_QUOTE",
            "symbol": symbol,
            "apikey": STOCKS_API_KEY
        }
    )
    if current_price_response.status_code != 200:
        return None

    current_price_data = current_price_response.json()
    try:
        current_price = float(current_price_data["Global Quote"]["05. price"])
    except KeyError:
        return None

    # Fetch historical stock data (5 years)
    historical_response = requests.get(
        STOCKS_API_URL,
        params={
            "function": "TIME_SERIES_MONTHLY_ADJUSTED",
            "symbol": symbol,
            "apikey": STOCKS_API_KEY
        }
    )
    if historical_response.status_code != 200:
        return None

    historical_data = historical_response.json().get("Monthly Adjusted Time Series", {})

    # Process the historical data for the past 5 years
    processed_data = []
    for date, data in historical_data.items():
        processed_data.append({"date": date, "price": float(data["4. close"])})

    # Limit to the most recent 60 months (5 years)
    processed_data = processed_data[:60]

    return {"current_price": current_price, "historical_data": processed_data}

def get_news(query: str):
    response = requests.get(
        NEWS_API_URL,
        params={
            "q": query,
            "apiKey": NEWS_API_KEY,
            "pageSize": 5,
            "sortBy": "relevance"
        }
    )
    if response.status_code != 200:
        return None

    articles = response.json().get("articles", [])
    news_data = [
        {"title": article["title"], "url": article["url"]}
        for article in articles
    ]
    return news_data

def analyze_investment(historical_data, current_price, news):
    """
    Analyze stock trends and news sentiment to provide an investment suggestion and a summary.
    """
    # Analyze historical data (growth trend)
    prices = [entry["price"] for entry in historical_data]
    growth_rate = (prices[-1] - prices[0]) / prices[0] * 100

    # Simple analysis logic
    if growth_rate > 20 and len(news) >= 3:
        suggestion = "Invest"
        summary = (
            f"The stock has shown a strong growth rate of {growth_rate:.2f}% over the past 5 years, "
            f"and recent news sentiment is predominantly positive. This indicates good potential for investment."
        )
    elif growth_rate > 0:
        suggestion = "Hold"
        summary = (
            f"The stock has grown by {growth_rate:.2f}% over the past 5 years. However, mixed or neutral news sentiment "
            f"suggests that it may be better to wait before making a decision."
        )
    else:
        suggestion = "Avoid"
        summary = (
            f"The stock has declined by {growth_rate:.2f}% over the past 5 years, and recent news sentiment is not "
            f"favorable. Investing in this stock may carry significant risk."
        )

    return suggestion, summary

if __name__ == '__main__':
    app.run(debug=True) 