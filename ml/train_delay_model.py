"""
ML Model #1 — Delivery Delay Prediction Trainer
Trains Logistic Regression vs Random Forest, evaluates metrics, and saves the best model.
"""

import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix

from ml.preprocessing import load_raw_data, engineer_delay_features

def train_and_evaluate_delay_models(data_dir="ml/data", models_dir="ml/saved_models"):
    os.makedirs(models_dir, exist_ok=True)
    
    print("Loading data for Delivery Delay Prediction...")
    vehicles, drivers, trips, fuel, maintenance = load_raw_data(data_dir)
    
    X, y, driver_meta, vehicle_stats = engineer_delay_features(trips, drivers, vehicles)
    print(f"Total dataset size: {len(X)} samples, Delay class distribution: {y.value_counts().to_dict()}")
    
    # Save driver and vehicle historical statistics for live prediction
    joblib.dump(driver_meta, os.path.join(models_dir, "driver_stats.joblib"))
    joblib.dump(vehicle_stats, os.path.join(models_dir, "vehicle_stats.joblib"))
    
    # Define features
    categorical_features = ["traffic_level", "weather_condition"]
    numerical_features = [
        "distance_km",
        "estimated_duration",
        "number_of_stops",
        "hour_of_day",
        "day_of_week",
        "driver_experience",
        "driver_historical_delay_rate",
        "vehicle_historical_delay_rate"
    ]
    
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), numerical_features),
            ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features)
        ]
    )
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # 1. Baseline Model: Logistic Regression
    lr_pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", LogisticRegression(max_iter=1000, random_state=42))
    ])
    
    # 2. Improved Model: Random Forest
    rf_pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42))
    ])
    
    candidates = {
        "Logistic Regression": lr_pipeline,
        "Random Forest": rf_pipeline
    }
    
    best_model_name = None
    best_f1 = -1
    best_pipeline = None
    metrics_summary = {}
    
    for name, pipeline in candidates.items():
        print(f"\n--- Training {name} ---")
        pipeline.fit(X_train, y_train)
        
        y_pred = pipeline.predict(X_test)
        y_proba = pipeline.predict_proba(X_test)[:, 1]
        
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        auc = roc_auc_score(y_test, y_proba)
        cm = confusion_matrix(y_test, y_pred)
        
        print(f"Accuracy:  {acc:.4f}")
        print(f"Precision: {prec:.4f}")
        print(f"Recall:    {rec:.4f}")
        print(f"F1-Score:  {f1:.4f}")
        print(f"ROC-AUC:   {auc:.4f}")
        print(f"Confusion Matrix:\n{cm}")
        
        metrics_summary[name] = {
            "accuracy": float(acc),
            "precision": float(prec),
            "recall": float(rec),
            "f1_score": float(f1),
            "roc_auc": float(auc),
            "confusion_matrix": cm.tolist()
        }
        
        if f1 > best_f1:
            best_f1 = f1
            best_model_name = name
            best_pipeline = pipeline
            
    print(f"\n>>> Selected Best Model: {best_model_name} (F1: {best_f1:.4f})")
    
    # Save best model
    model_path = os.path.join(models_dir, "delay_model.joblib")
    joblib.dump({
        "pipeline": best_pipeline,
        "model_name": best_model_name,
        "metrics": metrics_summary[best_model_name],
        "feature_names": numerical_features + categorical_features,
        "trained_at": pd.Timestamp.now().isoformat()
    }, model_path)
    
    print(f"Saved best model to {model_path}")
    return metrics_summary

if __name__ == "__main__":
    train_and_evaluate_delay_models()
