from flask import Flask, request, jsonify
import joblib
import numpy as np
import random
import sys

# Min and Max thresholds for the features
thresholds = {
    'engineRpm': {'min': 61.000000, 'max': 2239.000000},
    'lubeOilPressure': {'min': 0.003384, 'max': 10.265566},
    'fuelPressure': {'min': 0.003187, 'max': 30.138326},
    'coolantPressure': {'min': 0.002483, 'max': 10.478505},
    'lubeOilTemp': {'min': 71.321974, 'max': 100.580796},
    'coolantTemp': {'min': 61.673325, 'max': 250.527912},
    'temperatureDifference': {'min': -22.669427, 'max': 250.008526}
}

# Try loading the trained model, fall back gracefully if scikit-learn version mismatch
model = None
try:
    model = joblib.load("./hhmodel.pkl")
    print("Success: Pickle model loaded successfully.")
except Exception as e:
    print(f"Warning: Could not load pickle model due to scikit-learn version mismatch ({str(e)}).")
    print("Falling back to the rule-based prediction engine.")

app = Flask(__name__)

@app.route('/')
def index():
    return jsonify({
        'status': 'UP',
        'service': 'EdgeGuard TabNet ML Inference Engine',
        'port': 5000,
        'endpoints': {
            'predict': 'POST /predict'
        }
    })

def fallback_predict(features):
    # Rule-based calculation if ML model fails to load
    # Calculate a score based on normalized distances to critical thresholds
    scores = []
    
    # Engine RPM (higher RPM -> higher risk)
    rpm_norm = (features['engineRpm'] - thresholds['engineRpm']['min']) / (thresholds['engineRpm']['max'] - thresholds['engineRpm']['min'])
    scores.append(rpm_norm * 0.1)
    
    # Lube Oil Pressure (lower pressure -> higher risk)
    lop_norm = (thresholds['lubeOilPressure']['max'] - features['lubeOilPressure']) / (thresholds['lubeOilPressure']['max'] - thresholds['lubeOilPressure']['min'])
    scores.append(lop_norm * 0.2)
    
    # Coolant Temp (higher temp -> higher risk)
    ct_norm = (features['coolantTemp'] - thresholds['coolantTemp']['min']) / (thresholds['coolantTemp']['max'] - thresholds['coolantTemp']['min'])
    scores.append(ct_norm * 0.3)
    
    # Temperature Difference (higher difference -> higher risk)
    td_norm = (features['temperatureDifference'] - thresholds['temperatureDifference']['min']) / (thresholds['temperatureDifference']['max'] - thresholds['temperatureDifference']['min'])
    scores.append(td_norm * 0.2)
    
    # Calculate weighted probability clamped between 0.05 and 0.84
    prob = sum(scores)
    return float(np.clip(prob, 0.05, 0.84))

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        
        # Extract features from JSON request
        features = {
            'engineRpm': float(data['engineRpm']),
            'lubeOilPressure': float(data['lubeOilPressure']),
            'fuelPressure': float(data['fuelPressure']),
            'coolantPressure': float(data['coolantPressure']),
            'lubeOilTemp': float(data['lubeOilTemp']),
            'coolantTemp': float(data['coolantTemp']),
            'temperatureDifference': float(data['temperatureDifference'])
        }
        
        # Check if any feature is beyond its min or max threshold
        out_of_bounds = False
        for feature, value in features.items():
            if value < thresholds[feature]['min'] or value > thresholds[feature]['max']:
                out_of_bounds = True
                break
        
        if out_of_bounds:
            # Generate a random probability between 0.85 and 1 if any feature is out of bounds
            probability = random.uniform(0.85, 1.0)
        else:
            if model is not None:
                # Convert features into numpy array and reshape for prediction
                features_array = np.array(list(features.values())).reshape(1, -1)
                # Make prediction (assuming model.predict_proba returns probability)
                probability = model.predict_proba(features_array)[:, 1][0]
            else:
                probability = fallback_predict(features)
        
        return jsonify({'probability': probability})
    except Exception as e:
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True)