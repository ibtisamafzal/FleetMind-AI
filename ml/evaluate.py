"""
Model Evaluation Utility for FleetMind AI
Evaluates saved models and prints detailed metric reports.
"""

import os
import joblib
import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score

def print_model_evaluation(models_dir="ml/saved_models"):
    delay_path = os.path.join(models_dir, "delay_model.joblib")
    risk_path = os.path.join(models_dir, "risk_model.joblib")
    
    if os.path.exists(delay_path):
        delay_bundle = joblib.load(delay_path)
        print("========================================")
        print(f" DELIVERY DELAY MODEL: {delay_bundle.get('model_name')}")
        print("========================================")
        metrics = delay_bundle.get("metrics", {})
        for k, v in metrics.items():
            if k != "confusion_matrix":
                print(f"  {k.upper()}: {v:.4f}" if isinstance(v, float) else f"  {k.upper()}: {v}")
        print(f"  Confusion Matrix: {metrics.get('confusion_matrix')}")
    else:
        print(f"Delay model not found at {delay_path}")
        
    if os.path.exists(risk_path):
        risk_bundle = joblib.load(risk_path)
        print("\n========================================")
        print(" VEHICLE OPERATIONAL RISK MODEL")
        print("========================================")
        print(f"  Features: {risk_bundle.get('feature_cols')}")
        print(f"  Classes:  {risk_bundle.get('class_names')}")
        print(f"  Weights:  {risk_bundle.get('default_weights')}")
    else:
        print(f"Risk model not found at {risk_path}")

if __name__ == "__main__":
    print_model_evaluation()
