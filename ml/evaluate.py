"""
SentinalX ML Evaluation Script (Phase 17 Fix - SentinalX-NER-ML-v3)
Loads the trained model artifact from ml/model.json and prints the four-pillar leakage audit and metrics.
"""

import json
import os
import sys

def evaluate():
    model_path = "ml/model.json"
    if not os.path.exists(model_path):
        print("[ERROR] Model artifact ml/model.json not found. Run ml/train.py first.")
        sys.exit(1)

    with open(model_path, "r", encoding="utf-8") as f:
        model = json.load(f)

    print("==================================================")
    print("SENTINALX NER ML SCIENTIFIC EVALUATION REPORT")
    print("==================================================")
    print(f"Model Version:    {model['model_version']}")
    print(f"Dataset Version:  {model['dataset_version']}")
    print(f"Model Type:       {model['model_type']}")
    print(f"Status:           {model['status']} (Honest Limited Sample Label)")
    print(f"Split Strategy:   {model['validation_strategy']}")
    print(f"Min Train-Test D: {model.get('min_train_test_distance_km', 'N/A')} km")
    print("--------------------------------------------------")
    print("FOUR-PILLAR LEAKAGE AUDIT RESULTS:")
    la = model.get("leakage_audit", {})
    print(f"  * Temporal Leakage:      {la.get('temporal_leakage', False)}")
    print(f"  * Spatial Leakage:       {la.get('spatial_leakage', False)}")
    print(f"  * Same-Incident Leakage: {la.get('same_incident_leakage', False)}")
    print(f"  * Duplicate Leakage:     {la.get('duplicate_leakage', False)}")
    print("--------------------------------------------------")
    print("SAMPLE COUNTS:")
    metrics = model["metrics"]
    print(f"  Training Samples: {metrics['train_sample_count']} (<= 2022) [Pos: {metrics['positive_train_count']}, Neg: {metrics['negative_train_count']}]")
    print(f"  Test Samples:     {metrics['test_sample_count']} (>= 2023) [Pos: {metrics['positive_test_count']}, Neg: {metrics['negative_test_count']}]")
    print("--------------------------------------------------")
    print("METRICS ON HELD-OUT TEST SET:")
    print(f"  Precision:        {metrics['precision']}")
    print(f"  Recall:           {metrics['recall']}")
    print(f"  F1 Score:         {metrics['f1_score']}")
    print(f"  Accuracy:         {metrics['accuracy']}")
    cm = metrics["confusion_matrix"]
    print(f"  Confusion Matrix: TP={cm['true_positives']}, FP={cm['false_positives']}, TN={cm['true_negatives']}, FN={cm['false_negatives']}")
    print("--------------------------------------------------")
    print("FEATURE IMPORTANCES:")
    for feat, imp in model["feature_importances"].items():
        print(f"  {feat:20s}: {imp:.3f} ({imp*100:.1f}%)")
    print("--------------------------------------------------")
    print("MODEL LIMITATIONS:")
    for lim in model.get("model_limitations", []):
        print(f"  * {lim}")
    print("==================================================")

if __name__ == "__main__":
    evaluate()
