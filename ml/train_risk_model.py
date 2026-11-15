"""
ML Model #2 — Vehicle Operational Risk Model Trainer
Trains multi-component risk scoring and classification model.
"""

import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
from ml.preprocessing import load_raw_data, engineer_vehicle_risk_features

def train_and_save_risk_model(data_dir="ml/data", models_dir="ml/saved_models"):
    os.makedirs(models_dir, exist_ok=True)
    print("Loading data for Vehicle Operational Risk Prediction...")
    vehicles, drivers, trips, fuel, maintenance = load_raw_data(data_dir)
    
    risk_df = engineer_vehicle_risk_features(vehicles, trips, fuel, maintenance)
    
    # Save vehicle precomputed risk table for instant lookups & updates
    risk_df.to_csv(os.path.join(data_dir, "vehicle_risk_scores.csv"), index=False)
    print(f"Vehicle risk scores computed for {len(risk_df)} vehicles.")
    print("Risk Level Breakdown:")
    print(risk_df["risk_level"].value_counts())
    
    # Feature matrix for general ML risk classifier
    feature_cols = [
        "vehicle_age",
        "mileage",
        "mileage_since_last_service",
        "service_count",
        "avg_efficiency",
        "num_trips",
        "delay_rate"
    ]
    
    X = risk_df[feature_cols].copy()
    y = risk_df["risk_level"]
    
    clf = RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42)
    clf.fit(X, y)
    y_pred = clf.predict(X)
    acc = accuracy_score(y, y_pred)
    print(f"Random Forest Risk Classifier fitted with Accuracy: {acc:.4f}")
    
    # Save model and artifact bundle
    bundle = {
        "classifier": clf,
        "feature_cols": feature_cols,
        "class_names": clf.classes_.tolist(),
        "default_weights": {
            "maintenance": 0.40,
            "fuel": 0.30,
            "delay": 0.30
        },
        "trained_at": pd.Timestamp.now().isoformat()
    }
    
    model_path = os.path.join(models_dir, "risk_model.joblib")
    joblib.dump(bundle, model_path)
    print(f"Saved risk model bundle to {model_path}")
    return bundle

if __name__ == "__main__":
    train_and_save_risk_model()
