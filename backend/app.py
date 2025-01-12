from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import joblib
import pandas as pd
import google.generativeai as genai
import base64
import matplotlib
matplotlib.use('Agg')  # Use the Agg backend for non-interactive plotting
import matplotlib.pyplot as plt
import io
from bs4 import BeautifulSoup


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

# Define credit score ranges for different agencies
AGENCY_RANGES = {
    "Experian": (0, 999),
    "Equifax": (0, 1000),
    "TransUnion": (0, 710)
}

def get_company_suggestions(input_value):
    """
    Fetch company name suggestions based on the input from "https://stockanalysis.com/stocks/".
    """
    try:
        response = requests.get("https://stockanalysis.com/stocks/")
        if response.status_code != 200:
            raise Exception("Failed to fetch company list from stockanalysis.com")

        # Parse the response to extract company names and symbols
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(response.text, 'html.parser')

        companies = []
        for link in soup.select('a[href^="/stocks/"]'):
            company_name = link.text.strip()
            symbol = link.get('href').split('/')[-1].upper()  # Extract symbol from URL

            # Filter out irrelevant results (e.g., generic terms like "Comparison Tool")
            if not symbol.isalpha() or len(symbol) > 5:  # Filter non-symbols and long text
                continue

            if input_value.lower() in company_name.lower() or input_value.lower() in symbol.lower():
                companies.append({"symbol": symbol, "name": company_name})

        return companies[:10]  # Return up to 10 suggestions

    except Exception as e:
        logging.error(f"Error fetching company suggestions: {e}")
        return []




@app.route('/search/<input_value>', methods=['GET'])
def search(input_value):
    """
    Fetch news articles, current stock price, historical stock data, and provide an investment suggestion.
    Handle both company symbols and company names. Suggest company names in a dropdown if input is not a valid symbol.
    """
    try:
        # Fetch matching company names for the input_value
        company_suggestions = get_company_suggestions(input_value)

        # If the input is a valid stock symbol, proceed directly
        if is_symbol(input_value):
            stock_symbol = input_value
        else:
            # If there are suggestions, return them to the user
            if company_suggestions:
                return jsonify({"suggestions": company_suggestions})

            # Attempt to find a stock symbol based on the input name
            stock_symbol = get_symbol_from_name(input_value)
            if not stock_symbol:
                return jsonify({"error": "Stock symbol not found for the given company name"}), 404

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

        # Use Gemini to generate an investment suggestion and summary
        prompt = (
            f"The stock market data for {stock_symbol} shows a current price of {current_price} and a 5-year trend of historical prices. "
            f"The historical prices are: {[(entry['date'], entry['price']) for entry in historical_data]}. "
            f"The news headlines related to this stock are: {[article['title'] for article in news]}. "
            f"Provide a detailed investment suggestion and a concise and in-depth summary, ignore the covid period when the market was down, consider the years before and after the covid period but do not use the term covid19 in repetition, in Markdown format with clear subheadings and bullet points."
        )
        logging.info("Sending prompt to Gemini API...")
        response = model.generate_content(prompt)

        # Ensure response text is available
        gemini_summary = response.text if response else "No summary available."

        # Log the response for debugging
        logging.info(f"Gemini API response: {gemini_summary}")

        # Return results for API response
        return jsonify({
            "input": input_value,
            "stock_symbol": stock_symbol,
            "current_price": current_price,
            "historical_data": historical_data,
            "news": news,
            "gemini_summary": gemini_summary
        })

    except Exception as e:
        logging.error(f"Error in /search endpoint: {str(e)}")
        return jsonify({"error": str(e)}), 500



@app.route('/predict', methods=['POST'])
def predict():
    try:
        input_data = request.json  # Get JSON data from the request

        # Validate input data
        if not input_data:
            return jsonify({"error": "Input data is required."}), 400

        agency = input_data.get("agency")
        credit_score = input_data.get("credit_score")

        # Validate agency
        if not agency or agency not in AGENCY_RANGES:
            return jsonify({"error": f"Invalid agency. Choose one of {list(AGENCY_RANGES.keys())}"}), 400

        # Validate credit score
        if credit_score is None:
            return jsonify({"error": "Credit score is required."}), 400

        min_score, max_score = AGENCY_RANGES[agency]
        if not (min_score <= credit_score <= max_score):
            return jsonify({"error": f"Invalid credit score for {agency}. Must be between {min_score} and {max_score}."}), 400

        # Standardize the credit score to a 0–1 scale
        standardized_score = (credit_score - min_score) / (max_score - min_score)
        input_data["standardized_score"] = standardized_score  # Add the standardized score to the input data

        # Convert input data into a DataFrame
        sample_input = pd.DataFrame([input_data], columns=feature_names)
        sample_input.fillna(0, inplace=True)  # Fill any missing values with 0
        sample_input_scaled = scaler.transform(sample_input)

        # Generate predictions from all models
        predictions = {
            "Logistic Regression": int(logreg.predict(sample_input_scaled)[0]),
            "Decision Tree": int(tree_model.predict(sample_input_scaled)[0]),
            "Random Forest": int(regr_rfr.predict(sample_input_scaled)[0]),
            "CatBoost": int(reg_catb.predict(sample_input_scaled)[0]),
            "LightGBM": int(lgbm_model.predict(sample_input_scaled)[0]),
            "KNN": int(knn.predict(sample_input_scaled)[0])
        }

        # Calculate the average score and categorize risk
        avg_score = sum(predictions.values()) / len(predictions)
        risk_category = "Low Risk" if avg_score <= 0.33 else "Medium Risk" if avg_score <= 0.66 else "High Risk"

        # Use Gemini to generate a well-structured summary
        prompt = (
            f"The credit risk is {risk_category} based on an average prediction score of {avg_score:.2f}."
            f" Provide a detailed credit suggestion and a concise and in depth summary advice in Markdown format with clear subheadings and bullet points for improving financial stability, make the summary UK focused but do not mention UK in output"
            f"and reducing risks, taking into account the credit score provided by {agency}."
        )
        logging.info("Sending credit prompt to Gemini API...")
        response = model.generate_content(prompt)

        # Ensure response text is available
        summary = response.text if response else "No advice available."

        # Log the response for debugging
        logging.info(f"Gemini API response for credit: {summary}")

        return jsonify({
            "predictions": predictions,
            "average_score": avg_score,
            "risk_category": risk_category,
            "summary": summary
        })

    except Exception as e:
        logging.error(f"Error in /predict endpoint: {str(e)}")
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

# ... existing imports ...

def validate_columns(df, required_columns):
    """Check if required columns exist in the dataframe."""
    missing_columns = [col for col in required_columns if col not in df.columns]
    return missing_columns

def convert_to_serializable(data):
    """Convert pandas/numpy data types to native Python types."""
    if isinstance(data, (pd.Series, pd.DataFrame)):
        return data.to_dict()
    if isinstance(data, (pd.Timestamp, pd.Timedelta)):
        return str(data)
    if isinstance(data, (int, float, str, bool, list, dict)):
        return data
    if hasattr(data, "item"):  # Handle numpy.int64, numpy.float64, etc.
        return data.item()
    return data

def generate_historical_chart(df):
    """Generate a line chart for historical closing prices and return it as base64 string."""
    plt.figure(figsize=(10, 6))
    plt.plot(pd.to_datetime(df['Date']), df['Close'], color='blue', linestyle='-', marker='o', markersize=2)
    plt.title("Historical Closing Prices")
    plt.xlabel("Date")
    plt.ylabel("Closing Price (USD)")
    plt.xticks(rotation=45)
    plt.grid(True)
    plt.tight_layout()

    buffer = io.BytesIO()
    plt.savefig(buffer, format='png')
    buffer.seek(0)
    base64_image = base64.b64encode(buffer.read()).decode('utf-8')
    buffer.close()
    plt.close()
    return base64_image

def process_historical_data(file):
    try:
        df = pd.read_csv(file)
        required_columns = ['Date', 'Close']
        missing_columns = validate_columns(df, required_columns)

        if missing_columns:
            return {"error": f"Missing columns in historical data: {missing_columns}"}

        chart = generate_historical_chart(df)
        explanation = (
            "This chart displays the historical closing prices over time. "
            "It helps visualize trends, identify peaks and troughs, and assess market behavior."
        )

        return {
            "chart": chart,
            "explanation": explanation,
        }

    except Exception as e:
        return {"error": f"Error processing historical data: {e}"}

def summarize_with_gemini(data):
    """Use Gemini API to summarize the financial data."""
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        summary_prompt = (
            "Summarize the following financial data with a focus on liquidity, cash flow, "
            "and other key financial metrics:\n" + str(data)
        )
        response = model.generate_content(summary_prompt)
        return response.text
    except Exception as e:
        return f"Error summarizing with Gemini: {e}"

@app.route('/upload', methods=['POST'])
def upload_files():
    try:
        # Files uploaded by the user
        cash_flow_file = request.files.get("cash_flow")
        historical_file = request.files.get("historical")
        financials_file = request.files.get("financials")
        balance_sheet_file = request.files.get("balance_sheet")

        # Initialize results
        results = {
            "liquidity_analysis": {},
            "balance_sheet": {},
            "cash_flow": {},
            "financials_data": {},
            "historical_chart": {},
        }

        # Process balance sheet data
        if balance_sheet_file:
            df = pd.read_csv(balance_sheet_file)
            results["balance_sheet"] = {
                "total_assets": convert_to_serializable(df['Net Tangible Assets'].iloc[0]),
                "total_liabilities": convert_to_serializable(df['Total Debt'].iloc[0]),
                "current_assets": convert_to_serializable(df['Cash And Cash Equivalents'].iloc[0]),
                "current_liabilities": convert_to_serializable(-df['Working Capital'].iloc[0]),
            }

            results["liquidity_analysis"] = {
                "net_debt": results["balance_sheet"]["total_liabilities"] - results["balance_sheet"]["current_assets"],
                "current_working_capital": results["balance_sheet"]["current_assets"] + results["balance_sheet"]["current_liabilities"],
                "quick_ratio": (
                    results["balance_sheet"]["current_assets"] / results["balance_sheet"]["current_liabilities"]
                    if results["balance_sheet"]["current_liabilities"] > 0
                    else float('inf')
                ),
                "cash_ratio": (
                    results["balance_sheet"]["current_assets"] / results["balance_sheet"]["total_liabilities"]
                    if results["balance_sheet"]["total_liabilities"] > 0
                    else float('inf')
                ),
            }

        # Process cash flow data
        if cash_flow_file:
            df = pd.read_csv(cash_flow_file)
            results["cash_flow"] = {
                "insights": {
                    "free_cash_flow": convert_to_serializable(df['Free Cash Flow'].sum()),
                }
            }

        # Process financials data
        if financials_file:
            df = pd.read_csv(financials_file)
            results["financials_data"] = {
                "insights": {
                    "gross_profit": convert_to_serializable(df['Gross Profit'].sum()),
                    "operating_income": convert_to_serializable(df['Operating Income'].sum()),
                }
            }

        # Process historical data
        if historical_file:
            results["historical_chart"] = process_historical_data(historical_file)

        # Generate summary using Gemini
        summary = summarize_with_gemini(results)
        results["summary"] = summary

        return jsonify(results)

    except Exception as e:
        return jsonify({"error": f"Error in upload_files: {e}"}), 500



if __name__ == '__main__':
    app.run(debug=True)
