"""
SentinalX ML Inference Script
Accepts geotechnical features and outputs tabular probability and binary hazard class.
"""

import json
import math
import sys

def predict(rainfall_24h, rainfall_72h, slope, elevation, soil_moisture, seismic):
    score = (
        (rainfall_24h / 100.0) * 1.8 +
        (rainfall_72h / 200.0) * 1.5 +
        (soil_moisture / 0.50) * 1.2 +
        (slope / 45.0) * 1.0 +
        (seismic / 3.0) * 0.5 -
        2.2
    )
    prob = 1.0 / (1.0 + math.exp(-max(-10, min(10, score))))
    pred = 1 if prob >= 0.50 else 0
    return {
        "prediction": pred,
        "probability": round(prob, 4),
        "risk_score_equivalent": round(prob * 100.0, 1),
        "hazard_class": "ELEVATED_LANDSLIDE_RISK" if pred == 1 else "LOW_LANDSLIDE_PROBABILITY"
    }

if __name__ == "__main__":
    # Test sample
    result = predict(rainfall_24h=92.0, rainfall_72h=195.0, slope=44.0, elevation=2650, soil_moisture=0.41, seismic=1.8)
    print(json.dumps(result, indent=2))
