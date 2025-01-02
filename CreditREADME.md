# Credit Risk Assessment API Documentation

## Project Overview
This project is a **Credit Risk Assessment API** built using Flask. The API predicts the credit risk of an individual based on their financial and demographic information using multiple machine learning models. Additionally, it leverages Google's Gemini API to provide detailed advice for improving financial stability.

---

## Features
1. **Multiple Machine Learning Models**: Includes Logistic Regression, Decision Tree, Random Forest, CatBoost, LightGBM, and KNN models.
2. **Scaling and Preprocessing**: Prepares the input data using a pre-trained scaler.
3. **Risk Categorization**: Provides a "Low Risk," "Medium Risk," or "High Risk" classification based on the average prediction score.
4. **Generative AI Summary**: Uses Google's Gemini API to generate actionable financial advice.
5. **Cross-Origin Resource Sharing (CORS)**: Enables secure communication with a frontend interface.

---

## Prerequisites
1. Python 3.x
2. Required Libraries:
   - Flask
   - Flask-CORS
   - pandas
   - joblib
   - google-generativeai
   - scikit-learn
3. Pre-trained models and scaler files:
   - `logreg_model.pkl`
   - `tree_model.pkl`
   - `regr_rfr_model.pkl`
   - `reg_catb_model.pkl`
   - `lgbm_model.pkl`
   - `knn_model.pkl`
   - `scaler.pkl`
   - `feature_names.pkl`

---

## File Structure
- **`app.py`**: Main API code.
- **`models/`**: Folder containing pre-trained model files.
- **Frontend**: Contains the UI code to interact with the API.

---

## Code Explanation

### 1. **Importing Dependencies**
```python
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import google.generativeai as genai
import logging
```
- **Flask**: For creating the API.
- **Flask-CORS**: Enables cross-origin requests.
- **joblib**: Loads pre-trained machine learning models and scaler.
- **pandas**: Handles data input and preprocessing.
- **google.generativeai**: Integrates with the Gemini API for generating financial advice.
- **logging**: Logs errors and information.

---

### 2. **Logging Configuration**
```python
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
```
- Configures logging to track errors and events during execution.

---

### 3. **Loading Models and Scaler**
```python
logreg = joblib.load('./logreg_model.pkl')
tree_model = joblib.load('./tree_model.pkl')
regr_rfr = joblib.load('./regr_rfr_model.pkl')
reg_catb = joblib.load('./reg_catb_model.pkl')
lgbm_model = joblib.load('./lgbm_model.pkl')
knn = joblib.load('./knn_model.pkl')
scaler = joblib.load('./scaler.pkl')
feature_names = joblib.load('./feature_names.pkl')
```
- Loads six pre-trained machine learning models.
- Loads a pre-trained scaler for feature standardization.
- Loads feature names for consistent input formatting.

---

### 4. **Configuring Google Generative AI**
```python
genai.configure(api_key="YOUR_API_KEY")
model = genai.GenerativeModel("gemini-1.5-flash")
```
- Configures the Gemini API using an API key.
- Loads the specific model (`gemini-1.5-flash`) for generating advice.

---

### 5. **Initializing Flask App**
```python
app = Flask(__name__)
CORS(app)  # Enables CORS for frontend interaction
```
- Initializes the Flask app and enables CORS.

---

### 6. **Prediction Endpoint**
```python
@app.route('/predict', methods=['POST'])
def predict():
```
- Creates a POST endpoint `/predict` to handle prediction requests.

#### a. **Input Handling and Preprocessing**
```python
input_data = request.json
sample_input = pd.DataFrame([input_data], columns=feature_names)
sample_input.fillna(0, inplace=True)
sample_input_scaled = scaler.transform(sample_input)
```
- Accepts input data as JSON.
- Converts the input into a pandas DataFrame and fills missing values with `0`.
- Scales the input features using the pre-trained scaler.

#### b. **Model Predictions**
```python
predictions = {
    "Logistic Regression": int(logreg.predict(sample_input_scaled)[0]),
    "Decision Tree": int(tree_model.predict(sample_input_scaled)[0]),
    "Random Forest": int(regr_rfr.predict(sample_input_scaled)[0]),
    "CatBoost": int(reg_catb.predict(sample_input_scaled)[0]),
    "LightGBM": int(lgbm_model.predict(sample_input_scaled)[0]),
    "KNN": int(knn.predict(sample_input_scaled)[0])
}
```
- Generates predictions from all six models.
- Stores the results in a dictionary.

#### c. **Risk Categorization**
```python
avg_score = sum(predictions.values()) / len(predictions)
risk_category = "Low Risk" if avg_score <= 0.33 else "Medium Risk" if avg_score <= 0.66 else "High Risk"
```
- Calculates the average prediction score.
- Categorizes the risk based on the score:
  - `Low Risk`: `<= 0.33`
  - `Medium Risk`: `<= 0.66`
  - `High Risk`: `> 0.66`

#### d. **Generating Summary**
```python
prompt = (
    f"The credit risk is {risk_category} based on an average prediction score of {avg_score:.2f}."
    f" Provide detailed advice for improving financial stability and reducing risks."
)
response = model.generate_content(prompt)
summary = response.text
```
- Generates a financial advice summary based on the risk category and average score using the Gemini API.

#### e. **Returning the Response**
```python
return jsonify({
    "predictions": predictions,
    "average_score": avg_score,
    "risk_category": risk_category,
    "summary": summary
})
```
- Returns the predictions, average score, risk category, and summary as a JSON response.

---

### 7. **Error Handling**
```python
except Exception as e:
    logging.error(f"Error: {str(e)}")
    return jsonify({"error": str(e)}), 500
```
- Logs errors and returns a 500 error response if something goes wrong.

---

### 8. **Running the App**
```python
if __name__ == '__main__':
    app.run(debug=True)
```
- Runs the Flask app in debug mode for development purposes.

---

## How to Use
1. **Start the Flask App**:
   ```bash
   python app.py
   ```
   The app will run at `http://127.0.0.1:5000`.

2. **Make a POST Request to `/predict`**:
   - Example Request Body:
     ```json
     {
         "credit_score": 700,
         "net_income": 50000,
         "debt_to_income_ratio": 0.3
     }
     ```

3. **Receive the Response**:
   - Example Response:
     ```json
     {
         "predictions": {
             "Logistic Regression": 1,
             "Decision Tree": 0,
             "Random Forest": 1,
             "CatBoost": 1,
             "LightGBM": 1,
             "KNN": 0
         },
         "average_score": 0.67,
         "risk_category": "Medium Risk",
         "summary": "The credit risk is Medium Risk. Consider reducing your debt-to-income ratio."
     }
     ```

---

## Future Enhancements
1. Add additional models for more robust predictions.
2. Enhance the summary generation with more user-specific details.
3. Deploy the app to a cloud platform for production use.

---

This README file provides comprehensive understanding of the code and setup.

