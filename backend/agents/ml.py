import pandas as pd
import numpy as np
from typing import Dict, Any
from agents.base import BaseAgent
from sklearn.ensemble import RandomForestClassifier

class MLAgent(BaseAgent):
    def __init__(self):
        super().__init__("ML Prediction Agent", 0.10)
        self._model_cache = {}

    def analyze(self, ticker: str, data: Dict[str, pd.DataFrame], context: Dict[str, Any]) -> Dict[str, Any]:
        df = data["stock_daily"]
        
        feature_cols = [
            "RSI_14", "MACD_Hist", "StochRSI", "ROC_10", "ADX_14", "MFI_14",
            "EMA_20_ratio", "EMA_50_ratio", "EMA_200_ratio", 
            "BB_Upper_ratio", "BB_Lower_ratio", "VWAP_ratio"
        ]
        
        # Cache Check (Do this FIRST to avoid processing all rows if cached)
        last_date = str(df["Date"].iloc[-1]) if "Date" in df.columns else ""
        df_len = len(df)
        cached = self._model_cache.get(ticker)
        
        probabilities = [0.20, 0.50, 0.30] # Default [Down, Flat, Up]
        probabilities_1w = [0.20, 0.50, 0.30] # Default [Down, Flat, Up] for 1-week
        model_details = "Random Forest Ensemble (Mocked fallback)"
        reasoning = []
        
        if cached and cached["train_len"] == df_len and cached["last_date"] == last_date:
            rf = cached["rf"]
            rf_1w = cached["rf_1w"]
            model_details = cached["model_details"]
            
            # Predict only on the last row (ratios computed on the fly for one row)
            latest_row = df.iloc[-1:].copy()
            latest_row["EMA_20_ratio"] = latest_row["Close"] / (latest_row["EMA_20"] + 1e-10)
            latest_row["EMA_50_ratio"] = latest_row["Close"] / (latest_row["EMA_50"] + 1e-10)
            latest_row["EMA_200_ratio"] = latest_row["Close"] / (latest_row["EMA_200"] + 1e-10)
            latest_row["BB_Upper_ratio"] = latest_row["Close"] / (latest_row["BB_Upper"] + 1e-10)
            latest_row["BB_Lower_ratio"] = latest_row["Close"] / (latest_row["BB_Lower"] + 1e-10)
            latest_row["VWAP_ratio"] = latest_row["Close"] / (latest_row["VWAP"] + 1e-10)
            latest_features = latest_row[feature_cols].fillna(0.0)
            
            # Predict 30d
            pred_proba = rf.predict_proba(latest_features)[0]
            classes = rf.classes_
            full_proba = {0: 0.0, 1: 0.0, 2: 0.0}
            for c, p in zip(classes, pred_proba):
                full_proba[c] = float(p)
            probabilities = [full_proba[0], full_proba[1], full_proba[2]]
            
            # Predict 1w
            pred_proba_1w = rf_1w.predict_proba(latest_features)[0]
            classes_1w = rf_1w.classes_
            full_proba_1w = {0: 0.0, 1: 0.0, 2: 0.0}
            for c, p in zip(classes_1w, pred_proba_1w):
                full_proba_1w[c] = float(p)
            probabilities_1w = [full_proba_1w[0], full_proba_1w[1], full_proba_1w[2]]
            
            reasoning.append("Retrieved pre-trained Random Forest models from memory cache.")
            reasoning.append("Model features include RSI, MACD histograms, VWAP ratios, and Bollinger Band compressions.")
            reasoning.append("Successfully trained 1-week outlook Random Forest Classifier model.")
        else:
            # Full feature/target calculation for training path
            df_copy = df.copy()
            df_copy["EMA_20_ratio"] = df_copy["Close"] / (df_copy["EMA_20"] + 1e-10)
            df_copy["EMA_50_ratio"] = df_copy["Close"] / (df_copy["EMA_50"] + 1e-10)
            df_copy["EMA_200_ratio"] = df_copy["Close"] / (df_copy["EMA_200"] + 1e-10)
            df_copy["BB_Upper_ratio"] = df_copy["Close"] / (df_copy["BB_Upper"] + 1e-10)
            df_copy["BB_Lower_ratio"] = df_copy["Close"] / (df_copy["BB_Lower"] + 1e-10)
            df_copy["VWAP_ratio"] = df_copy["Close"] / (df_copy["VWAP"] + 1e-10)
            
            # 30-day target (vectorized)
            fwd_days = 30
            fwd_return = (df_copy["Close"].shift(-fwd_days) - df_copy["Close"]) / df_copy["Close"]
            conds = [fwd_return.isna(), fwd_return > 0.05, fwd_return < -0.05]
            choices = [np.nan, 2, 0]
            df_copy["Target"] = np.select(conds, choices, default=1)
            
            # 1-week target (vectorized)
            fwd_days_1w = 5
            fwd_return_1w = (df_copy["Close"].shift(-fwd_days_1w) - df_copy["Close"]) / df_copy["Close"]
            conds_1w = [fwd_return_1w.isna(), fwd_return_1w > 0.01, fwd_return_1w < -0.01]
            choices_1w = [np.nan, 2, 0]
            df_copy["Target_1w"] = np.select(conds_1w, choices_1w, default=1)
            
            train_df = df_copy.dropna(subset=feature_cols + ["Target"])
            train_df_1w = df_copy.dropna(subset=feature_cols + ["Target_1w"])
            latest_features = df_copy[feature_cols].iloc[-1:].fillna(0.0)
            if len(train_df) > 100:
                try:
                    # Keep training fast: use last 1000 days for training
                    train_data = train_df.tail(1000)
                    
                    X_train = train_data[feature_cols]
                    y_train = train_data["Target"].astype(int)
                    
                    # Fit Random Forest Classifier
                    rf = RandomForestClassifier(n_estimators=50, max_depth=5, random_state=42)
                    rf.fit(X_train, y_train)
                    
                    # Predict probabilities
                    pred_proba = rf.predict_proba(latest_features)[0]
                    
                    # Handle cases where all classes aren't present in prediction
                    classes = rf.classes_
                    full_proba = {0: 0.0, 1: 0.0, 2: 0.0}
                    for c, p in zip(classes, pred_proba):
                        full_proba[c] = float(p)
                        
                    probabilities = [full_proba[0], full_proba[1], full_proba[2]]
                    model_details = f"Scikit-Learn Random Forest Classifier trained on {len(train_data)} historical days."
                    
                    reasoning.append(f"Successfully trained Random Forest Classifier ensemble on {len(train_data)} trading periods.")
                    reasoning.append(f"Model features include RSI, MACD histograms, VWAP ratios, and Bollinger Band compressions.")
                except Exception as e:
                    reasoning.append(f"ML training fallback triggered: {str(e)}")
                    rf = None
            else:
                reasoning.append("Insufficient data for ML model training. Using default prior probabilities.")
                rf = None

            if len(train_df_1w) > 100:
                try:
                    train_data_1w = train_df_1w.tail(1000)
                    X_train_1w = train_data_1w[feature_cols]
                    y_train_1w = train_data_1w["Target_1w"].astype(int)
                    
                    rf_1w = RandomForestClassifier(n_estimators=50, max_depth=5, random_state=42)
                    rf_1w.fit(X_train_1w, y_train_1w)
                    
                    pred_proba_1w = rf_1w.predict_proba(latest_features)[0]
                    classes_1w = rf_1w.classes_
                    full_proba_1w = {0: 0.0, 1: 0.0, 2: 0.0}
                    for c, p in zip(classes_1w, pred_proba_1w):
                        full_proba_1w[c] = float(p)
                    probabilities_1w = [full_proba_1w[0], full_proba_1w[1], full_proba_1w[2]]
                    reasoning.append(f"Successfully trained 1-week outlook Random Forest Classifier model.")
                except Exception as e:
                    reasoning.append(f"ML 1-week training fallback triggered: {str(e)}")
                    rf_1w = None
            else:
                rf_1w = None

            # Cache the models if both were successfully trained
            if rf is not None and rf_1w is not None:
                self._model_cache[ticker] = {
                    "rf": rf,
                    "rf_1w": rf_1w,
                    "train_len": df_len,
                    "last_date": last_date,
                    "model_details": model_details
                }

        # Derive score from probabilities:
        # Score = (P(Up) * 100) + (P(Flat) * 50) + (P(Down) * 0)
        score = probabilities[2] * 100.0 + probabilities[1] * 50.0
        
        # Class predictions
        prob_down, prob_flat, prob_up = probabilities
        
        if prob_up > 0.45:
            reasoning.append(f"ML Ensemble model flags HIGH probability of +5% breakout ({prob_up*100:.1f}% confidence).")
        elif prob_down > 0.45:
            reasoning.append(f"ML Ensemble model flags HIGH probability of -5% breakdown ({prob_down*100:.1f}% confidence).")
        else:
            reasoning.append(f"ML model predicts consolidation (Flat) with {prob_flat*100:.1f}% probability.")

        # Class predictions for 1-week
        prob_down_1w, prob_flat_1w, prob_up_1w = probabilities_1w
        if prob_up_1w > 0.45:
            reasoning.append(f"ML 1-Week model flags HIGH probability of short-term breakout ({prob_up_1w*100:.1f}% confidence).")

        return {
            "score": score,
            "confidence": 1.0,
            "reasoning": reasoning,
            "metrics": {
                "model_description": model_details,
                "prob_down": float(prob_down),
                "prob_flat": float(prob_flat),
                "prob_up": float(prob_up),
                "prob_down_1w": float(prob_down_1w),
                "prob_flat_1w": float(prob_flat_1w),
                "prob_up_1w": float(prob_up_1w),
                "expected_direction": "UP" if prob_up > prob_down and prob_up > prob_flat else "DOWN" if prob_down > prob_up and prob_down > prob_flat else "FLAT",
                "expected_direction_1w": "UP" if prob_up_1w > prob_down_1w and prob_up_1w > prob_flat_1w else "DOWN" if prob_down_1w > prob_up_1w and prob_down_1w > prob_flat_1w else "FLAT"
            }
        }
