import os
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# Constants for Stock Universe with expanded multi-factor metadata
STOCKS_METADATA = {
    "RELIANCE": {
        "market_cap": "large", "sector": "Energy", "base_price": 1000.0, "beta": 1.1, 
        "pe": 26.5, "pb": 2.3, "roe": 11.5, "roce": 12.8, "debt_eq": 0.4, 
        "rev_growth": 12.0, "prof_growth": 9.5, "operating_margin": 18.5, 
        "net_margin": 12.2, "ev_ebitda": 14.8, "peg_ratio": 1.8, 
        "interest_coverage": 6.5, "fcf": 8500.0, "eps_growth": 11.2, 
        "expected_eps": 48.5, "revenue_estimate": 82000.0, 
        "eps_surprise": 2.4, "revenue_surprise": 1.2, "guidance_change": 0.5,
        "promoter_pct": 50.3, "fii_pct": 21.8, "dii_pct": 16.5, "public_pct": 11.4,
        "promoter_change": 0.0, "fii_change": 0.45
    },
    "TCS": {
        "market_cap": "large", "sector": "IT", "base_price": 1800.0, "beta": 0.85, 
        "pe": 30.2, "pb": 7.8, "roe": 39.1, "roce": 52.4, "debt_eq": 0.05, 
        "rev_growth": 9.2, "prof_growth": 8.0, "operating_margin": 26.2, 
        "net_margin": 20.5, "ev_ebitda": 21.4, "peg_ratio": 2.5, 
        "interest_coverage": 45.0, "fcf": 12000.0, "eps_growth": 8.5, 
        "expected_eps": 62.0, "revenue_estimate": 61000.0, 
        "eps_surprise": 1.1, "revenue_surprise": -0.5, "guidance_change": -0.2,
        "promoter_pct": 72.3, "fii_pct": 12.5, "dii_pct": 9.8, "public_pct": 5.4,
        "promoter_change": 0.1, "fii_change": -0.2
    },
    "INFYS": {
        "market_cap": "large", "sector": "IT", "base_price": 900.0, "beta": 0.95, 
        "pe": 25.8, "pb": 6.2, "roe": 28.5, "roce": 37.1, "debt_eq": 0.08, 
        "rev_growth": 8.5, "prof_growth": 7.2, "operating_margin": 21.0, 
        "net_margin": 16.8, "ev_ebitda": 18.2, "peg_ratio": 2.2, 
        "interest_coverage": 38.0, "fcf": 7800.0, "eps_growth": 7.8, 
        "expected_eps": 31.5, "revenue_estimate": 40500.0, 
        "eps_surprise": -1.5, "revenue_surprise": 0.8, "guidance_change": -1.0,
        "promoter_pct": 14.8, "fii_pct": 34.2, "dii_pct": 32.5, "public_pct": 18.5,
        "promoter_change": 0.0, "fii_change": 1.2
    },
    "HDFCBANK": {
        "market_cap": "large", "sector": "Banking", "base_price": 800.0, "beta": 1.05, 
        "pe": 19.8, "pb": 2.8, "roe": 16.2, "roce": 14.8, "debt_eq": 0.85, 
        "rev_growth": 14.5, "prof_growth": 16.0, "operating_margin": 42.0, 
        "net_margin": 18.2, "ev_ebitda": 12.0, "peg_ratio": 1.1, 
        "interest_coverage": 3.2, "fcf": -2500.0, "eps_growth": 14.8, 
        "expected_eps": 22.4, "revenue_estimate": 32000.0, 
        "eps_surprise": 3.8, "revenue_surprise": 2.1, "guidance_change": 1.5,
        "promoter_pct": 0.0, "fii_pct": 47.5, "dii_pct": 30.2, "public_pct": 22.3,
        "promoter_change": 0.0, "fii_change": -1.8
    },
    "ICICIBANK": {
        "market_cap": "large", "sector": "Banking", "base_price": 400.0, "beta": 1.15, 
        "pe": 17.5, "pb": 3.1, "roe": 17.8, "roce": 15.2, "debt_eq": 0.82, 
        "rev_growth": 16.0, "prof_growth": 18.5, "operating_margin": 44.5, 
        "net_margin": 19.8, "ev_ebitda": 10.5, "peg_ratio": 0.9, 
        "interest_coverage": 3.5, "fcf": -1200.0, "eps_growth": 17.2, 
        "expected_eps": 18.5, "revenue_estimate": 24000.0, 
        "eps_surprise": 4.5, "revenue_surprise": 2.8, "guidance_change": 2.0,
        "promoter_pct": 0.0, "fii_pct": 44.1, "dii_pct": 36.8, "public_pct": 19.1,
        "promoter_change": 0.0, "fii_change": 1.5
    },
    "SBIN": {
        "market_cap": "large", "sector": "Banking", "base_price": 250.0, "beta": 1.25, 
        "pe": 10.2, "pb": 1.4, "roe": 14.5, "roce": 11.2, "debt_eq": 1.1, 
        "rev_growth": 10.8, "prof_growth": 12.0, "operating_margin": 32.1, 
        "net_margin": 13.5, "ev_ebitda": 7.8, "peg_ratio": 0.85, 
        "interest_coverage": 2.2, "fcf": -4500.0, "eps_growth": 11.8, 
        "expected_eps": 15.2, "revenue_estimate": 45000.0, 
        "eps_surprise": 5.2, "revenue_surprise": 1.9, "guidance_change": 1.2,
        "promoter_pct": 57.6, "fii_pct": 10.8, "dii_pct": 24.5, "public_pct": 7.1,
        "promoter_change": 0.0, "fii_change": -0.1
    },
    "ITC": {
        "market_cap": "large", "sector": "FMCG", "base_price": 200.0, "beta": 0.65, 
        "pe": 28.0, "pb": 5.8, "roe": 29.2, "roce": 38.5, "debt_eq": 0.01, 
        "rev_growth": 7.5, "prof_growth": 8.2, "operating_margin": 35.8, 
        "net_margin": 27.2, "ev_ebitda": 19.5, "peg_ratio": 2.8, 
        "interest_coverage": 120.0, "fcf": 6200.0, "eps_growth": 8.0, 
        "expected_eps": 4.5, "revenue_estimate": 17200.0, 
        "eps_surprise": 0.5, "revenue_surprise": 0.3, "guidance_change": 0.0,
        "promoter_pct": 0.0, "fii_pct": 43.2, "dii_pct": 42.1, "public_pct": 14.7,
        "promoter_change": 0.0, "fii_change": 0.8
    },
    "HINDUNILVR": {
        "market_cap": "large", "sector": "FMCG", "base_price": 1200.0, "beta": 0.6, 
        "pe": 55.4, "pb": 11.2, "roe": 19.5, "roce": 25.4, "debt_eq": 0.03, 
        "rev_growth": 6.8, "prof_growth": 7.0, "operating_margin": 23.5, 
        "net_margin": 16.9, "ev_ebitda": 38.2, "peg_ratio": 5.2, 
        "interest_coverage": 95.0, "fcf": 7500.0, "eps_growth": 6.5, 
        "expected_eps": 11.2, "revenue_estimate": 15400.0, 
        "eps_surprise": -0.8, "revenue_surprise": 0.4, "guidance_change": 0.2,
        "promoter_pct": 61.9, "fii_pct": 14.2, "dii_pct": 12.1, "public_pct": 11.8,
        "promoter_change": 0.0, "fii_change": -0.45
    },
    "TATAMOTORS": {
        "market_cap": "mid", "sector": "Auto", "base_price": 300.0, "beta": 1.4, 
        "pe": 15.2, "pb": 2.9, "roe": 21.0, "roce": 18.5, "debt_eq": 1.2, 
        "rev_growth": 18.5, "prof_growth": 25.0, "operating_margin": 11.8, 
        "net_margin": 6.5, "ev_ebitda": 8.5, "peg_ratio": 0.6, 
        "interest_coverage": 4.8, "fcf": 9200.0, "eps_growth": 24.5, 
        "expected_eps": 15.8, "revenue_estimate": 105000.0, 
        "eps_surprise": 8.5, "revenue_surprise": 4.2, "guidance_change": 3.0,
        "promoter_pct": 46.4, "fii_pct": 18.2, "dii_pct": 17.5, "public_pct": 17.9,
        "promoter_change": 0.0, "fii_change": 2.1
    },
    "MARUTI": {
        "market_cap": "large", "sector": "Auto", "base_price": 4500.0, "beta": 1.0, 
        "pe": 27.2, "pb": 3.5, "roe": 13.8, "roce": 17.2, "debt_eq": 0.05, 
        "rev_growth": 11.0, "prof_growth": 14.5, "operating_margin": 10.2, 
        "net_margin": 7.8, "ev_ebitda": 15.2, "peg_ratio": 1.7, 
        "interest_coverage": 35.0, "fcf": 4800.0, "eps_growth": 13.9, 
        "expected_eps": 110.5, "revenue_estimate": 34000.0, 
        "eps_surprise": 2.1, "revenue_surprise": 1.5, "guidance_change": 0.8,
        "promoter_pct": 56.4, "fii_pct": 21.5, "dii_pct": 16.2, "public_pct": 5.9,
        "promoter_change": 0.0, "fii_change": 0.4
    },
    "SUNPHARMA": {
        "market_cap": "mid", "sector": "Pharma", "base_price": 500.0, "beta": 0.75, 
        "pe": 32.5, "pb": 4.1, "roe": 15.8, "roce": 17.0, "debt_eq": 0.1, 
        "rev_growth": 9.8, "prof_growth": 11.2, "operating_margin": 22.4, 
        "net_margin": 17.5, "ev_ebitda": 20.8, "peg_ratio": 2.4, 
        "interest_coverage": 18.0, "fcf": 5500.0, "eps_growth": 10.2, 
        "expected_eps": 10.8, "revenue_estimate": 12500.0, 
        "eps_surprise": 1.8, "revenue_surprise": 0.9, "guidance_change": 0.5,
        "promoter_pct": 54.5, "fii_pct": 16.8, "dii_pct": 19.5, "public_pct": 9.2,
        "promoter_change": 0.0, "fii_change": -0.2
    },
    "CIPLA": {
        "market_cap": "mid", "sector": "Pharma", "base_price": 600.0, "beta": 0.7, 
        "pe": 24.2, "pb": 3.2, "roe": 14.2, "roce": 16.5, "debt_eq": 0.12, 
        "rev_growth": 8.2, "prof_growth": 10.0, "operating_margin": 20.1, 
        "net_margin": 15.2, "ev_ebitda": 15.0, "peg_ratio": 1.9, 
        "interest_coverage": 16.5, "fcf": 3200.0, "eps_growth": 9.5, 
        "expected_eps": 12.4, "revenue_estimate": 6200.0, 
        "eps_surprise": 1.2, "revenue_surprise": 0.5, "guidance_change": 0.0,
        "promoter_pct": 33.6, "fii_pct": 27.2, "dii_pct": 22.1, "public_pct": 17.1,
        "promoter_change": 0.0, "fii_change": 0.55
    },
    "TATASTEEL": {
        "market_cap": "mid", "sector": "Metals", "base_price": 80.0, "beta": 1.35, 
        "pe": 12.8, "pb": 1.1, "roe": 8.5, "roce": 9.8, "debt_eq": 0.95, 
        "rev_growth": 5.5, "prof_growth": -2.0, "operating_margin": 9.5, 
        "net_margin": 3.1, "ev_ebitda": 8.1, "peg_ratio": -3.5, 
        "interest_coverage": 2.5, "fcf": 2100.0, "eps_growth": -1.8, 
        "expected_eps": 1.5, "revenue_estimate": 58000.0, 
        "eps_surprise": -4.2, "revenue_surprise": -1.5, "guidance_change": -2.0,
        "promoter_pct": 33.9, "fii_pct": 19.6, "dii_pct": 23.2, "public_pct": 23.3,
        "promoter_change": 0.0, "fii_change": -0.8
    },
    "JSWSTEEL": {
        "market_cap": "mid", "sector": "Metals", "base_price": 120.0, "beta": 1.3, 
        "pe": 16.2, "pb": 1.8, "roe": 10.2, "roce": 11.5, "debt_eq": 0.88, 
        "rev_growth": 7.2, "prof_growth": 4.5, "operating_margin": 12.1, 
        "net_margin": 4.8, "ev_ebitda": 10.2, "peg_ratio": 2.8, 
        "interest_coverage": 3.1, "fcf": 3500.0, "eps_growth": 4.2, 
        "expected_eps": 2.8, "revenue_estimate": 42000.0, 
        "eps_surprise": 0.8, "revenue_surprise": -0.2, "guidance_change": -0.5,
        "promoter_pct": 45.1, "fii_pct": 20.8, "dii_pct": 21.2, "public_pct": 12.9,
        "promoter_change": 0.0, "fii_change": 0.3
    },
    "LT": {
        "market_cap": "large", "sector": "Realty", "base_price": 1000.0, "beta": 1.1, 
        "pe": 33.1, "pb": 4.5, "roe": 14.8, "roce": 13.9, "debt_eq": 1.5, 
        "rev_growth": 13.5, "prof_growth": 15.0, "operating_margin": 14.5, 
        "net_margin": 8.2, "ev_ebitda": 20.5, "peg_ratio": 2.1, 
        "interest_coverage": 4.2, "fcf": 4500.0, "eps_growth": 14.1, 
        "expected_eps": 32.5, "revenue_estimate": 48000.0, 
        "eps_surprise": 2.5, "revenue_surprise": 1.1, "guidance_change": 0.5,
        "promoter_pct": 0.0, "fii_pct": 24.2, "dii_pct": 38.5, "public_pct": 37.3,
        "promoter_change": 0.0, "fii_change": 0.95
    },
    # --- New stocks to make exactly 50 total ---
    "AXISBANK": {
        "market_cap": "large", "sector": "Banking", "base_price": 450.0, "beta": 1.12, 
        "pe": 16.2, "pb": 2.2, "roe": 14.8, "roce": 13.2, "debt_eq": 0.88, 
        "rev_growth": 11.2, "prof_growth": 13.5, "operating_margin": 40.5, 
        "net_margin": 17.5, "ev_ebitda": 11.0, "peg_ratio": 1.2, 
        "interest_coverage": 3.0, "fcf": 2800.0, "eps_growth": 12.8, 
        "expected_eps": 25.5, "revenue_estimate": 18500.0, 
        "eps_surprise": 2.8, "revenue_surprise": 1.5, "guidance_change": 0.8,
        "promoter_pct": 0.0, "fii_pct": 51.2, "dii_pct": 29.5, "public_pct": 19.3,
        "promoter_change": 0.0, "fii_change": 0.65
    },
    "KOTAKBANK": {
        "market_cap": "large", "sector": "Banking", "base_price": 950.0, "beta": 0.98, 
        "pe": 24.5, "pb": 3.4, "roe": 15.2, "roce": 14.0, "debt_eq": 0.80, 
        "rev_growth": 12.5, "prof_growth": 14.2, "operating_margin": 43.0, 
        "net_margin": 19.0, "ev_ebitda": 13.5, "peg_ratio": 1.7, 
        "interest_coverage": 3.6, "fcf": 1900.0, "eps_growth": 13.5, 
        "expected_eps": 42.0, "revenue_estimate": 16000.0, 
        "eps_surprise": 1.5, "revenue_surprise": 0.8, "guidance_change": 0.2,
        "promoter_pct": 25.9, "fii_pct": 38.5, "dii_pct": 21.2, "public_pct": 14.4,
        "promoter_change": 0.0, "fii_change": -0.4
    },
    "BHARTIARTL": {
        "market_cap": "large", "sector": "Energy", "base_price": 550.0, "beta": 0.90, 
        "pe": 45.2, "pb": 6.2, "roe": 12.5, "roce": 11.8, "debt_eq": 1.6, 
        "rev_growth": 14.2, "prof_growth": 18.0, "operating_margin": 48.5, 
        "net_margin": 10.2, "ev_ebitda": 10.8, "peg_ratio": 2.5, 
        "interest_coverage": 3.8, "fcf": 6200.0, "eps_growth": 15.2, 
        "expected_eps": 16.5, "revenue_estimate": 34000.0, 
        "eps_surprise": 4.1, "revenue_surprise": 2.3, "guidance_change": 1.2,
        "promoter_pct": 54.8, "fii_pct": 22.1, "dii_pct": 18.2, "public_pct": 4.9,
        "promoter_change": 0.1, "fii_change": 0.55
    },
    "WIPRO": {
        "market_cap": "mid", "sector": "IT", "base_price": 280.0, "beta": 0.92, 
        "pe": 20.8, "pb": 3.1, "roe": 15.8, "roce": 19.5, "debt_eq": 0.12, 
        "rev_growth": 6.5, "prof_growth": 5.2, "operating_margin": 16.2, 
        "net_margin": 13.5, "ev_ebitda": 12.5, "peg_ratio": 3.2, 
        "interest_coverage": 22.0, "fcf": 4200.0, "eps_growth": 5.8, 
        "expected_eps": 18.2, "revenue_estimate": 22000.0, 
        "eps_surprise": -0.5, "revenue_surprise": -1.2, "guidance_change": -0.8,
        "promoter_pct": 72.9, "fii_pct": 9.5, "dii_pct": 11.2, "public_pct": 6.4,
        "promoter_change": 0.0, "fii_change": -0.3
    },
    "HCLTECH": {
        "market_cap": "large", "sector": "IT", "base_price": 600.0, "beta": 0.88, 
        "pe": 23.2, "pb": 4.8, "roe": 22.0, "roce": 28.2, "debt_eq": 0.08, 
        "rev_growth": 8.8, "prof_growth": 9.2, "operating_margin": 18.5, 
        "net_margin": 15.2, "ev_ebitda": 15.1, "peg_ratio": 2.5, 
        "interest_coverage": 32.0, "fcf": 5800.0, "eps_growth": 9.0, 
        "expected_eps": 48.0, "revenue_estimate": 26000.0, 
        "eps_surprise": 2.2, "revenue_surprise": 0.5, "guidance_change": 0.5,
        "promoter_pct": 60.8, "fii_pct": 18.5, "dii_pct": 15.2, "public_pct": 5.5,
        "promoter_change": 0.0, "fii_change": 0.85
    },
    "TECHM": {
        "market_cap": "mid", "sector": "IT", "base_price": 500.0, "beta": 1.08, 
        "pe": 28.5, "pb": 3.8, "roe": 13.5, "roce": 16.2, "debt_eq": 0.15, 
        "rev_growth": 7.2, "prof_growth": 6.0, "operating_margin": 11.5, 
        "net_margin": 9.2, "ev_ebitda": 16.2, "peg_ratio": 4.8, 
        "interest_coverage": 14.5, "fcf": 2800.0, "eps_growth": 5.2, 
        "expected_eps": 35.5, "revenue_estimate": 13500.0, 
        "eps_surprise": -2.1, "revenue_surprise": -0.8, "guidance_change": -1.2,
        "promoter_pct": 35.1, "fii_pct": 26.5, "dii_pct": 28.1, "public_pct": 10.3,
        "promoter_change": 0.0, "fii_change": -0.7
    },
    "LTIM": {
        "market_cap": "mid", "sector": "IT", "base_price": 2400.0, "beta": 1.02, 
        "pe": 32.8, "pb": 6.8, "roe": 25.5, "roce": 32.1, "debt_eq": 0.04, 
        "rev_growth": 11.5, "prof_growth": 10.8, "operating_margin": 16.0, 
        "net_margin": 12.8, "ev_ebitda": 21.0, "peg_ratio": 3.0, 
        "interest_coverage": 42.0, "fcf": 3600.0, "eps_growth": 10.5, 
        "expected_eps": 112.5, "revenue_estimate": 16500.0, 
        "eps_surprise": 1.8, "revenue_surprise": 1.1, "guidance_change": 0.2,
        "promoter_pct": 68.6, "fii_pct": 13.2, "dii_pct": 12.5, "public_pct": 5.7,
        "promoter_change": 0.0, "fii_change": 0.4
    },
    "TITAN": {
        "market_cap": "mid", "sector": "FMCG", "base_price": 1400.0, "beta": 1.05, 
        "pe": 72.5, "pb": 18.2, "roe": 26.2, "roce": 24.8, "debt_eq": 0.42, 
        "rev_growth": 18.5, "prof_growth": 15.2, "operating_margin": 11.2, 
        "net_margin": 7.5, "ev_ebitda": 42.0, "peg_ratio": 4.5, 
        "interest_coverage": 8.5, "fcf": 2100.0, "eps_growth": 16.0, 
        "expected_eps": 36.8, "revenue_estimate": 11500.0, 
        "eps_surprise": 3.5, "revenue_surprise": 1.8, "guidance_change": 1.0,
        "promoter_pct": 52.9, "fii_pct": 18.8, "dii_pct": 10.5, "public_pct": 17.8,
        "promoter_change": 0.0, "fii_change": 0.75
    },
    "BAJFINANCE": {
        "market_cap": "large", "sector": "Banking", "base_price": 3200.0, "beta": 1.25, 
        "pe": 32.5, "pb": 6.8, "roe": 22.1, "roce": 19.8, "debt_eq": 1.15, 
        "rev_growth": 22.0, "prof_growth": 25.5, "operating_margin": 62.0, 
        "net_margin": 24.5, "ev_ebitda": 22.0, "peg_ratio": 1.3, 
        "interest_coverage": 4.5, "fcf": -6500.0, "eps_growth": 24.2, 
        "expected_eps": 162.0, "revenue_estimate": 14000.0, 
        "eps_surprise": 5.2, "revenue_surprise": 3.5, "guidance_change": 2.0,
        "promoter_pct": 54.7, "fii_pct": 21.0, "dii_pct": 14.1, "public_pct": 10.2,
        "promoter_change": 0.0, "fii_change": 1.15
    },
    "BAJAJFINSV": {
        "market_cap": "mid", "sector": "Banking", "base_price": 800.0, "beta": 1.18, 
        "pe": 36.2, "pb": 4.5, "roe": 13.5, "roce": 12.2, "debt_eq": 1.05, 
        "rev_growth": 18.2, "prof_growth": 20.1, "operating_margin": 48.0, 
        "net_margin": 14.2, "ev_ebitda": 25.2, "peg_ratio": 1.8, 
        "interest_coverage": 3.8, "fcf": -3200.0, "eps_growth": 19.5, 
        "expected_eps": 48.2, "revenue_estimate": 9500.0, 
        "eps_surprise": 2.4, "revenue_surprise": 1.2, "guidance_change": 0.5,
        "promoter_pct": 60.7, "fii_pct": 8.8, "dii_pct": 7.5, "public_pct": 23.0,
        "promoter_change": 0.0, "fii_change": 0.2
    },
    "BAJAJ_AUTO": {
        "market_cap": "mid", "sector": "Auto", "base_price": 3800.0, "beta": 0.85, 
        "pe": 26.5, "pb": 7.2, "roe": 28.5, "roce": 36.2, "debt_eq": 0.01, 
        "rev_growth": 15.2, "prof_growth": 17.5, "operating_margin": 19.5, 
        "net_margin": 15.8, "ev_ebitda": 18.0, "peg_ratio": 1.5, 
        "interest_coverage": 85.0, "fcf": 4100.0, "eps_growth": 16.8, 
        "expected_eps": 242.0, "revenue_estimate": 12000.0, 
        "eps_surprise": 4.2, "revenue_surprise": 2.5, "guidance_change": 1.5,
        "promoter_pct": 54.9, "fii_pct": 14.2, "dii_pct": 13.5, "public_pct": 17.4,
        "promoter_change": 0.0, "fii_change": 0.95
    },
    "HEROMOTOCO": {
        "market_cap": "mid", "sector": "Auto", "base_price": 1800.0, "beta": 0.90, 
        "pe": 22.0, "pb": 4.1, "roe": 19.2, "roce": 25.1, "debt_eq": 0.02, 
        "rev_growth": 9.5, "prof_growth": 11.2, "operating_margin": 14.0, 
        "net_margin": 10.5, "ev_ebitda": 13.5, "peg_ratio": 1.9, 
        "interest_coverage": 65.0, "fcf": 2800.0, "eps_growth": 10.8, 
        "expected_eps": 145.0, "revenue_estimate": 9500.0, 
        "eps_surprise": 1.8, "revenue_surprise": 0.9, "guidance_change": 0.2,
        "promoter_pct": 34.8, "fii_pct": 27.5, "dii_pct": 25.2, "public_pct": 12.5,
        "promoter_change": 0.0, "fii_change": -0.15
    },
    "MM": {
        "market_cap": "mid", "sector": "Auto", "base_price": 850.0, "beta": 1.15, 
        "pe": 18.5, "pb": 3.1, "roe": 17.5, "roce": 16.2, "debt_eq": 0.95, 
        "rev_growth": 16.5, "prof_growth": 21.0, "operating_margin": 12.5, 
        "net_margin": 7.2, "ev_ebitda": 11.2, "peg_ratio": 0.85, 
        "interest_coverage": 5.2, "fcf": 3500.0, "eps_growth": 20.2, 
        "expected_eps": 55.0, "revenue_estimate": 24000.0, 
        "eps_surprise": 5.8, "revenue_surprise": 3.2, "guidance_change": 2.5,
        "promoter_pct": 19.3, "fii_pct": 39.5, "dii_pct": 27.2, "public_pct": 14.0,
        "promoter_change": 0.0, "fii_change": 1.65
    },
    "EICHERMOT": {
        "market_cap": "mid", "sector": "Auto", "base_price": 1800.0, "beta": 1.02, 
        "pe": 28.2, "pb": 6.8, "roe": 24.1, "roce": 31.0, "debt_eq": 0.02, 
        "rev_growth": 13.8, "prof_growth": 16.5, "operating_margin": 26.5, 
        "net_margin": 20.1, "ev_ebitda": 20.1, "peg_ratio": 1.7, 
        "interest_coverage": 48.0, "fcf": 2600.0, "eps_growth": 15.8, 
        "expected_eps": 118.0, "revenue_estimate": 4500.0, 
        "eps_surprise": 3.1, "revenue_surprise": 1.5, "guidance_change": 0.5,
        "promoter_pct": 49.2, "fii_pct": 21.8, "dii_pct": 10.2, "public_pct": 18.8,
        "promoter_change": 0.0, "fii_change": 0.72
    },
    "ADANIENT": {
        "market_cap": "mid", "sector": "Energy", "base_price": 1200.0, "beta": 1.85, 
        "pe": 95.2, "pb": 9.8, "roe": 9.2, "roce": 10.5, "debt_eq": 1.45, 
        "rev_growth": 24.5, "prof_growth": 32.0, "operating_margin": 8.5, 
        "net_margin": 2.5, "ev_ebitda": 32.5, "peg_ratio": 3.0, 
        "interest_coverage": 2.1, "fcf": -8500.0, "eps_growth": 30.5, 
        "expected_eps": 24.5, "revenue_estimate": 28000.0, 
        "eps_surprise": 8.5, "revenue_surprise": 4.1, "guidance_change": 1.5,
        "promoter_pct": 72.6, "fii_pct": 14.5, "dii_pct": 5.8, "public_pct": 7.1,
        "promoter_change": 0.5, "fii_change": 1.8
    },
    "ADANIPORTS": {
        "market_cap": "mid", "sector": "Energy", "base_price": 500.0, "beta": 1.35, 
        "pe": 28.5, "pb": 3.8, "roe": 14.2, "roce": 13.5, "debt_eq": 1.10, 
        "rev_growth": 16.2, "prof_growth": 20.5, "operating_margin": 52.0, 
        "net_margin": 21.2, "ev_ebitda": 14.2, "peg_ratio": 1.4, 
        "interest_coverage": 3.5, "fcf": 2100.0, "eps_growth": 19.8, 
        "expected_eps": 32.0, "revenue_estimate": 6200.0, 
        "eps_surprise": 3.8, "revenue_surprise": 1.8, "guidance_change": 1.0,
        "promoter_pct": 65.5, "fii_pct": 15.2, "dii_pct": 11.5, "public_pct": 7.8,
        "promoter_change": 0.0, "fii_change": 0.95
    },
    "POWERGRID": {
        "market_cap": "mid", "sector": "Energy", "base_price": 140.0, "beta": 0.65, 
        "pe": 11.5, "pb": 1.8, "roe": 18.5, "roce": 12.8, "debt_eq": 2.1, 
        "rev_growth": 5.2, "prof_growth": 6.8, "operating_margin": 86.0, 
        "net_margin": 32.5, "ev_ebitda": 7.5, "peg_ratio": 1.7, 
        "interest_coverage": 2.8, "fcf": 9200.0, "eps_growth": 6.5, 
        "expected_eps": 18.5, "revenue_estimate": 11000.0, 
        "eps_surprise": 1.1, "revenue_surprise": 0.3, "guidance_change": 0.0,
        "promoter_pct": 51.3, "fii_pct": 28.5, "dii_pct": 14.2, "public_pct": 6.0,
        "promoter_change": 0.0, "fii_change": 0.25
    },
    "NTPC": {
        "market_cap": "mid", "sector": "Energy", "base_price": 120.0, "beta": 0.72, 
        "pe": 12.8, "pb": 1.5, "roe": 12.5, "roce": 9.8, "debt_eq": 1.8, 
        "rev_growth": 7.8, "prof_growth": 9.5, "operating_margin": 28.5, 
        "net_margin": 10.8, "ev_ebitda": 8.0, "peg_ratio": 1.35, 
        "interest_coverage": 2.6, "fcf": 6500.0, "eps_growth": 9.2, 
        "expected_eps": 16.2, "revenue_estimate": 15000.0, 
        "eps_surprise": 2.1, "revenue_surprise": 0.8, "guidance_change": 0.2,
        "promoter_pct": 51.1, "fii_pct": 15.8, "dii_pct": 27.2, "public_pct": 5.9,
        "promoter_change": 0.0, "fii_change": 0.4
    },
    "ONGC": {
        "market_cap": "mid", "sector": "Energy", "base_price": 100.0, "beta": 0.95, 
        "pe": 6.5, "pb": 0.8, "roe": 14.1, "roce": 13.5, "debt_eq": 0.45, 
        "rev_growth": -2.5, "prof_growth": 5.8, "operating_margin": 22.0, 
        "net_margin": 12.5, "ev_ebitda": 4.1, "peg_ratio": 1.1, 
        "interest_coverage": 8.2, "fcf": 14000.0, "eps_growth": 5.5, 
        "expected_eps": 32.0, "revenue_estimate": 36000.0, 
        "eps_surprise": 4.2, "revenue_surprise": -1.5, "guidance_change": 0.0,
        "promoter_pct": 58.9, "fii_pct": 9.2, "dii_pct": 22.8, "public_pct": 9.1,
        "promoter_change": 0.0, "fii_change": -0.1
    },
    "BPCL": {
        "market_cap": "small", "sector": "Energy", "base_price": 200.0, "beta": 1.05, 
        "pe": 8.2, "pb": 1.3, "roe": 16.8, "roce": 14.2, "debt_eq": 0.95, 
        "rev_growth": 4.5, "prof_growth": 12.0, "operating_margin": 8.5, 
        "net_margin": 4.2, "ev_ebitda": 5.2, "peg_ratio": 0.68, 
        "interest_coverage": 4.5, "fcf": 5200.0, "eps_growth": 11.5, 
        "expected_eps": 42.0, "revenue_estimate": 28000.0, 
        "eps_surprise": 6.5, "revenue_surprise": 1.1, "guidance_change": 0.5,
        "promoter_pct": 52.9, "fii_pct": 12.8, "dii_pct": 21.5, "public_pct": 12.8,
        "promoter_change": 0.0, "fii_change": 0.35
    },
    "IOC": {
        "market_cap": "small", "sector": "Energy", "base_price": 80.0, "beta": 0.98, 
        "pe": 7.8, "pb": 1.1, "roe": 15.2, "roce": 12.8, "debt_eq": 0.85, 
        "rev_growth": 3.8, "prof_growth": 9.2, "operating_margin": 6.8, 
        "net_margin": 3.5, "ev_ebitda": 4.8, "peg_ratio": 0.85, 
        "interest_coverage": 5.1, "fcf": 6100.0, "eps_growth": 9.0, 
        "expected_eps": 12.5, "revenue_estimate": 32000.0, 
        "eps_surprise": 5.1, "revenue_surprise": 0.8, "guidance_change": 0.0,
        "promoter_pct": 51.5, "fii_pct": 8.5, "dii_pct": 24.1, "public_pct": 15.9,
        "promoter_change": 0.0, "fii_change": 0.12
    },
    "COALINDIA": {
        "market_cap": "mid", "sector": "Energy", "base_price": 180.0, "beta": 0.80, 
        "pe": 8.8, "pb": 2.4, "roe": 42.5, "roce": 50.1, "debt_eq": 0.10, 
        "rev_growth": 6.2, "prof_growth": 11.5, "operating_margin": 24.5, 
        "net_margin": 18.2, "ev_ebitda": 5.8, "peg_ratio": 0.75, 
        "interest_coverage": 28.0, "fcf": 16000.0, "eps_growth": 11.2, 
        "expected_eps": 48.0, "revenue_estimate": 18000.0, 
        "eps_surprise": 3.2, "revenue_surprise": 1.4, "guidance_change": 0.5,
        "promoter_pct": 63.1, "fii_pct": 9.5, "dii_pct": 21.2, "public_pct": 6.2,
        "promoter_change": 0.0, "fii_change": 0.45
    },
    "ASIANPAINT": {
        "market_cap": "small", "sector": "FMCG", "base_price": 1800.0, "beta": 0.75, 
        "pe": 58.2, "pb": 14.5, "roe": 28.2, "roce": 36.5, "debt_eq": 0.05, 
        "rev_growth": 9.8, "prof_growth": 11.0, "operating_margin": 21.2, 
        "net_margin": 14.8, "ev_ebitda": 38.5, "peg_ratio": 5.2, 
        "interest_coverage": 48.0, "fcf": 3500.0, "eps_growth": 10.8, 
        "expected_eps": 38.2, "revenue_estimate": 8500.0, 
        "eps_surprise": 1.2, "revenue_surprise": 0.5, "guidance_change": -0.2,
        "promoter_pct": 52.6, "fii_pct": 17.5, "dii_pct": 10.2, "public_pct": 19.7,
        "promoter_change": 0.0, "fii_change": -0.3
    },
    "BRITANNIA": {
        "market_cap": "small", "sector": "FMCG", "base_price": 2400.0, "beta": 0.58, 
        "pe": 52.8, "pb": 16.1, "roe": 48.5, "roce": 54.2, "debt_eq": 0.45, 
        "rev_growth": 8.5, "prof_growth": 10.2, "operating_margin": 18.5, 
        "net_margin": 13.2, "ev_ebitda": 34.0, "peg_ratio": 5.1, 
        "interest_coverage": 12.5, "fcf": 2100.0, "eps_growth": 10.1, 
        "expected_eps": 82.5, "revenue_estimate": 4200.0, 
        "eps_surprise": 2.1, "revenue_surprise": 0.8, "guidance_change": 0.5,
        "promoter_pct": 50.6, "fii_pct": 19.5, "dii_pct": 14.8, "public_pct": 15.1,
        "promoter_change": 0.0, "fii_change": 0.62
    },
    "TATACONSUM": {
        "market_cap": "small", "sector": "FMCG", "base_price": 500.0, "beta": 0.70, 
        "pe": 65.2, "pb": 8.2, "roe": 8.5, "roce": 10.2, "debt_eq": 0.25, 
        "rev_growth": 11.2, "prof_growth": 13.5, "operating_margin": 14.2, 
        "net_margin": 9.5, "ev_ebitda": 36.8, "peg_ratio": 4.8, 
        "interest_coverage": 15.0, "fcf": 1800.0, "eps_growth": 13.0, 
        "expected_eps": 11.2, "revenue_estimate": 3800.0, 
        "eps_surprise": 1.5, "revenue_surprise": 0.9, "guidance_change": 0.2,
        "promoter_pct": 34.4, "fii_pct": 25.1, "dii_pct": 16.2, "public_pct": 24.3,
        "promoter_change": 0.0, "fii_change": 0.8
    },
    "NESTLEIND": {
        "market_cap": "small", "sector": "FMCG", "base_price": 12000.0, "beta": 0.48, 
        "pe": 78.5, "pb": 24.2, "roe": 102.5, "roce": 128.5, "debt_eq": 0.02, 
        "rev_growth": 9.2, "prof_growth": 12.0, "operating_margin": 23.2, 
        "net_margin": 16.2, "ev_ebitda": 52.0, "peg_ratio": 6.5, 
        "interest_coverage": 110.0, "fcf": 2800.0, "eps_growth": 11.8, 
        "expected_eps": 210.0, "revenue_estimate": 5000.0, 
        "eps_surprise": 0.8, "revenue_surprise": 0.4, "guidance_change": 0.1,
        "promoter_pct": 62.8, "fii_pct": 12.1, "dii_pct": 8.9, "public_pct": 16.2,
        "promoter_change": 0.0, "fii_change": -0.2
    },
    "APOLLOHOSP": {
        "market_cap": "small", "sector": "Pharma", "base_price": 2800.0, "beta": 0.95, 
        "pe": 82.5, "pb": 10.2, "roe": 12.8, "roce": 15.2, "debt_eq": 0.65, 
        "rev_growth": 15.5, "prof_growth": 22.0, "operating_margin": 12.8, 
        "net_margin": 4.8, "ev_ebitda": 28.5, "peg_ratio": 3.8, 
        "interest_coverage": 4.1, "fcf": 1200.0, "eps_growth": 21.5, 
        "expected_eps": 55.0, "revenue_estimate": 4500.0, 
        "eps_surprise": 4.2, "revenue_surprise": 1.5, "guidance_change": 1.0,
        "promoter_pct": 29.3, "fii_pct": 47.1, "dii_pct": 11.5, "public_pct": 12.1,
        "promoter_change": 0.0, "fii_change": 1.45
    },
    "DIVISLAB": {
        "market_cap": "small", "sector": "Pharma", "base_price": 2200.0, "beta": 0.88, 
        "pe": 55.2, "pb": 7.5, "roe": 14.8, "roce": 19.2, "debt_eq": 0.01, 
        "rev_growth": 8.2, "prof_growth": 6.5, "operating_margin": 28.5, 
        "net_margin": 22.1, "ev_ebitda": 36.0, "peg_ratio": 8.5, 
        "interest_coverage": 95.0, "fcf": 1800.0, "eps_growth": 6.2, 
        "expected_eps": 52.0, "revenue_estimate": 2200.0, 
        "eps_surprise": -1.2, "revenue_surprise": 0.5, "guidance_change": -0.5,
        "promoter_pct": 51.9, "fii_pct": 19.2, "dii_pct": 18.5, "public_pct": 10.4,
        "promoter_change": 0.0, "fii_change": -0.8
    },
    "DRREDDY": {
        "market_cap": "small", "sector": "Pharma", "base_price": 3100.0, "beta": 0.70, 
        "pe": 18.5, "pb": 3.2, "roe": 18.1, "roce": 22.8, "debt_eq": 0.05, 
        "rev_growth": 12.1, "prof_growth": 14.2, "operating_margin": 24.2, 
        "net_margin": 18.2, "ev_ebitda": 11.8, "peg_ratio": 1.3, 
        "interest_coverage": 42.0, "fcf": 3900.0, "eps_growth": 13.8, 
        "expected_eps": 185.0, "revenue_estimate": 6800.0, 
        "eps_surprise": 3.8, "revenue_surprise": 2.1, "guidance_change": 0.8,
        "promoter_pct": 26.7, "fii_pct": 29.5, "dii_pct": 24.1, "public_pct": 19.7,
        "promoter_change": 0.0, "fii_change": 0.55
    },
    "HINDALCO": {
        "market_cap": "small", "sector": "Metals", "base_price": 250.0, "beta": 1.45, 
        "pe": 13.2, "pb": 1.6, "roe": 12.1, "roce": 11.5, "debt_eq": 0.85, 
        "rev_growth": 8.5, "prof_growth": 10.8, "operating_margin": 9.8, 
        "net_margin": 4.5, "ev_ebitda": 7.8, "peg_ratio": 1.2, 
        "interest_coverage": 3.5, "fcf": 4100.0, "eps_growth": 10.2, 
        "expected_eps": 18.5, "revenue_estimate": 16000.0, 
        "eps_surprise": 2.5, "revenue_surprise": 1.2, "guidance_change": 0.5,
        "promoter_pct": 34.6, "fii_pct": 26.8, "dii_pct": 25.5, "public_pct": 13.1,
        "promoter_change": 0.0, "fii_change": 0.45
    },
    "INDUSINDBK": {
        "market_cap": "small", "sector": "Banking", "base_price": 700.0, "beta": 1.30, 
        "pe": 13.5, "pb": 1.8, "roe": 13.8, "roce": 12.2, "debt_eq": 0.90, 
        "rev_growth": 13.2, "prof_growth": 15.1, "operating_margin": 38.5, 
        "net_margin": 16.0, "ev_ebitda": 9.2, "peg_ratio": 0.9, 
        "interest_coverage": 2.5, "fcf": 1100.0, "eps_growth": 14.5, 
        "expected_eps": 68.0, "revenue_estimate": 11000.0, 
        "eps_surprise": 3.1, "revenue_surprise": 1.9, "guidance_change": 0.8,
        "promoter_pct": 16.5, "fii_pct": 38.2, "dii_pct": 28.5, "public_pct": 16.8,
        "promoter_change": 0.0, "fii_change": 0.72
    },
    "GRASIM": {
        "market_cap": "small", "sector": "Metals", "base_price": 1000.0, "beta": 1.20, 
        "pe": 28.5, "pb": 1.9, "roe": 7.2, "roce": 8.5, "debt_eq": 0.75, 
        "rev_growth": 11.2, "prof_growth": 5.2, "operating_margin": 8.8, 
        "net_margin": 3.8, "ev_ebitda": 15.5, "peg_ratio": 5.5, 
        "interest_coverage": 3.1, "fcf": -1200.0, "eps_growth": 5.0, 
        "expected_eps": 32.0, "revenue_estimate": 14000.0, 
        "eps_surprise": -0.8, "revenue_surprise": 0.5, "guidance_change": 0.0,
        "promoter_pct": 42.8, "fii_pct": 16.5, "dii_pct": 22.1, "public_pct": 18.6,
        "promoter_change": 0.0, "fii_change": -0.2
    },
    "ULTRACEMCO": {
        "market_cap": "small", "sector": "Realty", "base_price": 4000.0, "beta": 1.05, 
        "pe": 34.5, "pb": 4.2, "roe": 12.8, "roce": 14.5, "debt_eq": 0.35, 
        "rev_growth": 12.0, "prof_growth": 14.5, "operating_margin": 18.2, 
        "net_margin": 11.2, "ev_ebitda": 18.5, "peg_ratio": 2.4, 
        "interest_coverage": 6.8, "fcf": 3800.0, "eps_growth": 14.0, 
        "expected_eps": 185.0, "revenue_estimate": 16000.0, 
        "eps_surprise": 2.2, "revenue_surprise": 1.4, "guidance_change": 0.5,
        "promoter_pct": 59.9, "fii_pct": 15.8, "dii_pct": 14.5, "public_pct": 9.8,
        "promoter_change": 0.0, "fii_change": 0.5
    },
    "SBILIFE": {
        "market_cap": "small", "sector": "Banking", "base_price": 800.0, "beta": 0.88, 
        "pe": 82.5, "pb": 9.2, "roe": 11.8, "roce": 11.2, "debt_eq": 0.02, 
        "rev_growth": 18.2, "prof_growth": 21.0, "operating_margin": 4.5, 
        "net_margin": 3.2, "ev_ebitda": 52.0, "peg_ratio": 3.9, 
        "interest_coverage": 95.0, "fcf": 1400.0, "eps_growth": 20.5, 
        "expected_eps": 15.2, "revenue_estimate": 8500.0, 
        "eps_surprise": 2.5, "revenue_surprise": 1.5, "guidance_change": 0.5,
        "promoter_pct": 55.4, "fii_pct": 25.2, "dii_pct": 14.8, "public_pct": 4.6,
        "promoter_change": 0.0, "fii_change": 0.8
    },
    "SHRIRAMFIN": {
        "market_cap": "small", "sector": "Banking", "base_price": 1100.0, "beta": 1.35, 
        "pe": 12.5, "pb": 1.8, "roe": 15.5, "roce": 13.8, "debt_eq": 1.45, 
        "rev_growth": 15.2, "prof_growth": 18.5, "operating_margin": 35.2, 
        "net_margin": 15.2, "ev_ebitda": 8.5, "peg_ratio": 0.68, 
        "interest_coverage": 2.2, "fcf": -2100.0, "eps_growth": 18.0, 
        "expected_eps": 95.0, "revenue_estimate": 7800.0, 
        "eps_surprise": 4.5, "revenue_surprise": 2.2, "guidance_change": 1.2,
        "promoter_pct": 25.4, "fii_pct": 53.5, "dii_pct": 15.8, "public_pct": 5.3,
        "promoter_change": 0.0, "fii_change": 1.95
    }
}

SECTORS = ["Energy", "IT", "Banking", "FMCG", "Auto", "Pharma", "Metals", "Realty"]

def generate_market_data(days=3650, output_dir="data"):
    """
    Generates 10+ years of daily historical data with 100+ multi-factor features.
    """
    os.makedirs(output_dir, exist_ok=True)
    np.random.seed(42)  # For reproducibility

    # 1. Generate Dates
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    date_range = pd.date_range(start=start_date, end=end_date, freq='B') # Business days
    n_days = len(date_range)

    print(f"Generating data for {n_days} business days...")

    # 2. Generate Global Factors
    # Expanded US, Bond, Currencies, Commodities, Volatility and Economic Indices
    sp500 = np.zeros(n_days)
    nasdaq = np.zeros(n_days)
    dji = np.zeros(n_days)
    dxy = np.zeros(n_days)
    us10y = np.zeros(n_days)
    india_10y = np.zeros(n_days)
    usd_inr = np.zeros(n_days)
    crude = np.zeros(n_days)
    wti_crude = np.zeros(n_days)
    gold = np.zeros(n_days)
    silver = np.zeros(n_days)
    copper = np.zeros(n_days)
    vix = np.zeros(n_days)
    india_vix = np.zeros(n_days)

    # India Economics
    india_cpi = np.zeros(n_days)
    india_wpi = np.zeros(n_days)
    india_gdp = np.zeros(n_days)
    india_iip = np.zeros(n_days)
    india_pmi = np.zeros(n_days)
    india_repo = np.zeros(n_days)

    # US Economics
    us_cpi = np.zeros(n_days)
    us_jobs = np.zeros(n_days)
    us_fed_rate = np.zeros(n_days)
    us_gdp = np.zeros(n_days)

    # Initial Values
    sp500[0] = 2000.0
    nasdaq[0] = 5000.0
    dji[0] = 16000.0
    dxy[0] = 95.0
    us10y[0] = 2.0
    india_10y[0] = 7.0
    usd_inr[0] = 68.0
    crude[0] = 50.0
    wti_crude[0] = 48.0
    gold[0] = 1200.0
    silver[0] = 16.0
    copper[0] = 2.5
    vix[0] = 15.0
    india_vix[0] = 16.0

    india_cpi[0] = 5.2
    india_wpi[0] = 3.5
    india_gdp[0] = 6.8
    india_iip[0] = 4.2
    india_pmi[0] = 54.5
    india_repo[0] = 6.0

    us_cpi[0] = 2.1
    us_jobs[0] = 180.0
    us_fed_rate[0] = 1.5
    us_gdp[0] = 2.0

    # Macro shocks simulation
    for i in range(1, n_days):
        # S&P 500, Nasdaq, Dow Jones
        sp_ret = np.random.normal(0.0003, 0.01)  # small positive drift
        nas_ret = sp_ret + np.random.normal(0.0001, 0.013)
        dji_ret = sp_ret + np.random.normal(-0.0001, 0.008)
        
        sp500[i] = sp500[i-1] * (1 + sp_ret)
        nasdaq[i] = nasdaq[i-1] * (1 + nas_ret)
        dji[i] = dji[i-1] * (1 + dji_ret)

        # DXY & US/India Yields & Currencies
        dxy_ret = -0.3 * sp_ret + np.random.normal(0, 0.004)
        dxy[i] = dxy[i-1] * (1 + dxy_ret)
        
        yield_chg = -0.05 * sp_ret * 100 + np.random.normal(0, 0.03)
        us10y[i] = max(0.5, us10y[i-1] + yield_chg)
        
        in_yield_chg = 0.6 * yield_chg + np.random.normal(0, 0.015)
        india_10y[i] = max(3.5, india_10y[i-1] + in_yield_chg)
        
        usd_inr_ret = 0.2 * dxy_ret + np.random.normal(0.00005, 0.0015)
        usd_inr[i] = max(50.0, usd_inr[i-1] * (1 + usd_inr_ret))

        # Commodities (Crude, WTI, Gold, Silver, Copper)
        crude[i] = max(20.0, crude[i-1] + np.random.normal(0.02, 1.2))
        wti_crude[i] = max(18.0, crude[i] - 2.0 + np.random.normal(0, 0.3))
        gold[i] = max(800.0, gold[i-1] + np.random.normal(0.2, 12.0) - 10 * dxy_ret)
        silver[i] = max(10.0, gold[i]/75.0 + np.random.normal(0, 0.25))
        copper[i] = max(1.0, copper[i-1] + 1.2 * sp_ret + np.random.normal(0, 0.04))

        # VIX and India VIX (mean reverting, spiked on big drops)
        market_drop = min(0, sp_ret)
        vix[i] = max(9.0, 15.0 + (vix[i-1] - 15.0) * 0.95 - 150 * market_drop + np.random.normal(0, 1.0))
        india_vix[i] = max(9.0, 16.0 + (india_vix[i-1] - 16.0) * 0.95 - 120 * market_drop + np.random.normal(0, 1.2))

        # Economics step simulation (monthly/quarterly steps)
        # India economic metrics
        if i % 20 == 0:  # Monthly
            india_cpi[i] = max(2.0, india_cpi[i-1] + np.random.normal(0.0, 0.2))
            india_wpi[i] = max(-1.0, india_wpi[i-1] + np.random.normal(0.0, 0.3))
            india_iip[i] = max(-2.0, india_iip[i-1] + np.random.normal(0.0, 0.5))
            india_pmi[i] = np.clip(india_pmi[i-1] + np.random.normal(0.0, 0.8), 45.0, 62.0)
            
            # Central Bank Repo rate adjustments
            if abs(india_cpi[i] - 4.0) > 1.5 and np.random.random() < 0.3:
                india_repo[i] = india_repo[i-1] + (0.25 if india_cpi[i] > 4.0 else -0.25)
            else:
                india_repo[i] = india_repo[i-1]
                
            us_cpi[i] = max(0.5, us_cpi[i-1] + np.random.normal(0.0, 0.15))
            us_jobs[i] = max(0.0, us_jobs[i-1] + np.random.normal(10.0, 50.0))
            if abs(us_cpi[i] - 2.0) > 1.0 and np.random.random() < 0.3:
                us_fed_rate[i] = us_fed_rate[i-1] + (0.25 if us_cpi[i] > 2.0 else -0.25)
            else:
                us_fed_rate[i] = us_fed_rate[i-1]
        else:
            india_cpi[i] = india_cpi[i-1]
            india_wpi[i] = india_wpi[i-1]
            india_iip[i] = india_iip[i-1]
            india_pmi[i] = india_pmi[i-1]
            india_repo[i] = india_repo[i-1]
            
            us_cpi[i] = us_cpi[i-1]
            us_jobs[i] = us_jobs[i-1]
            us_fed_rate[i] = us_fed_rate[i-1]

        if i % 60 == 0:  # Quarterly GDP
            india_gdp[i] = max(1.0, india_gdp[i-1] + np.random.normal(0.0, 0.3))
            us_gdp[i] = max(-2.0, us_gdp[i-1] + np.random.normal(0.0, 0.2))
        else:
            india_gdp[i] = india_gdp[i-1]
            us_gdp[i] = us_gdp[i-1]

    macro_df = pd.DataFrame({
        "Date": date_range,
        "SP500": sp500,
        "NASDAQ": nasdaq,
        "DJI": dji,
        "DXY": dxy,
        "US10Y": us10y,
        "India10Y": india_10y,
        "USDINR": usd_inr,
        "CrudeOil": crude,
        "WTICrude": wti_crude,
        "Gold": gold,
        "Silver": silver,
        "Copper": copper,
        "VIX": vix,
        "IndiaVIX": india_vix,
        "IndiaCPI": india_cpi,
        "IndiaWPI": india_wpi,
        "IndiaGDP": india_gdp,
        "IndiaIIP": india_iip,
        "IndiaPMI": india_pmi,
        "IndiaRepoRate": india_repo,
        "USCPI": us_cpi,
        "USJobs": us_jobs,
        "USFedRate": us_fed_rate,
        "USGDP": us_gdp
    })
    macro_df.to_csv(os.path.join(output_dir, "macro_indices.csv"), index=False)

    # 3. Generate Nifty 50 Index and Sector Returns
    nifty = np.zeros(n_days)
    nifty[0] = 7500.0
    
    sector_prices = {sec: np.zeros(n_days) for sec in SECTORS}
    for sec in SECTORS:
        sector_prices[sec][0] = 1000.0

    sector_cycle_drift = {
        "Banking": lambda t: 0.0001 + 0.00015 * np.sin(2 * np.pi * t / (n_days / 3)), 
        "IT": lambda t: 0.00015 + 0.0002 * np.cos(2 * np.pi * t / (n_days / 2)),
        "Pharma": lambda t: 0.00008 + 0.0001 * np.sin(2 * np.pi * t / (n_days / 4)),
        "Auto": lambda t: 0.00012 + 0.00015 * np.cos(2 * np.pi * t / (n_days / 3.5)),
        "FMCG": lambda t: 0.00006 + 0.00005 * np.sin(2 * np.pi * t / n_days),
        "Metals": lambda t: 0.00005 + 0.00035 * np.sin(2 * np.pi * t / (n_days / 1.5)),
        "Energy": lambda t: 0.00008 + 0.0001 * np.cos(2 * np.pi * t / (n_days / 2.5)),
        "Realty": lambda t: 0.00002 + 0.00025 * np.sin(2 * np.pi * t / (n_days / 5))
    }

    for i in range(1, n_days):
        nifty_ret = 0.4 * (sp500[i]/sp500[i-1] - 1) + np.random.normal(0.0004, 0.009)
        nifty[i] = nifty[i-1] * (1 + nifty_ret)

        for sec in SECTORS:
            sec_drift = sector_cycle_drift[sec](i)
            macro_factor = 0.0
            if sec == "IT":
                macro_factor = -0.15 * (dxy[i]/dxy[i-1] - 1) - 0.1 * (us10y[i] - us10y[i-1])
            elif sec == "Banking" or sec == "Realty":
                macro_factor = -0.2 * (us10y[i] - us10y[i-1])
            elif sec == "Energy" or sec == "Metals":
                macro_factor = 0.25 * (crude[i]/crude[i-1] - 1 if sec == "Energy" else gold[i]/gold[i-1] - 1)
            
            sec_ret = nifty_ret + sec_drift + macro_factor + np.random.normal(0, 0.007)
            sector_prices[sec][i] = sector_prices[sec][i-1] * (1 + sec_ret)

    nifty_df = pd.DataFrame({"Date": date_range, "Nifty50": nifty})
    for sec in SECTORS:
        nifty_df[sec] = sector_prices[sec]
    nifty_df.to_csv(os.path.join(output_dir, "nifty_sectors.csv"), index=False)

    # 4. Generate Stock Price Data & Options/Derivatives
    for ticker, meta in STOCKS_METADATA.items():
        print(f"Generating data for {ticker}...")
        sec = meta["sector"]
        beta = meta["beta"]
        
        prices = np.zeros(n_days)
        prices[0] = meta["base_price"]
        
        volumes = np.zeros(n_days)
        volumes[0] = 500000.0

        delivery_pct = np.zeros(n_days)
        delivery_pct[0] = 45.0
        
        futures_oi = np.zeros(n_days)
        futures_oi[0] = 1000000.0

        fii_flow = np.zeros(n_days)
        dii_flow = np.zeros(n_days)
        
        # New Institutional flows & Shareholding
        mf_flow = np.zeros(n_days)
        sip_flow = np.zeros(n_days)
        promoter_pct_daily = np.zeros(n_days)
        fii_pct_daily = np.zeros(n_days)
        dii_pct_daily = np.zeros(n_days)
        public_pct_daily = np.zeros(n_days)

        # Corporate actions & Options variables
        div_yield_daily = np.zeros(n_days)
        bonus_daily = np.zeros(n_days)
        split_daily = np.zeros(n_days)
        buyback_daily = np.zeros(n_days)
        promoter_buy_daily = np.zeros(n_days)
        promoter_sell_daily = np.zeros(n_days)
        
        max_pain_daily = np.zeros(n_days)
        iv_rank_daily = np.zeros(n_days)
        iv_pct_daily = np.zeros(n_days)
        options_pcr_daily = np.zeros(n_days)

        # Initial Values
        mf_flow[0] = 100.0
        sip_flow[0] = 50.0
        promoter_pct_daily[0] = meta["promoter_pct"]
        fii_pct_daily[0] = meta["fii_pct"]
        dii_pct_daily[0] = meta["dii_pct"]
        public_pct_daily[0] = meta["public_pct"]
        div_yield_daily[0] = 1.2
        max_pain_daily[0] = prices[0]
        iv_rank_daily[0] = 30.0
        iv_pct_daily[0] = 35.0
        options_pcr_daily[0] = 1.0

        for i in range(1, n_days):
            sec_ret = sector_prices[sec][i] / sector_prices[sec][i-1] - 1
            nifty_ret = nifty[i] / nifty[i-1] - 1
            
            stock_ret = beta * sec_ret + np.random.normal(0.0001, 0.012)
            prices[i] = prices[i-1] * (1 + stock_ret)

            vol_multiplier = 1.0 + 15.0 * abs(stock_ret) + np.random.exponential(0.5)
            volumes[i] = max(10000.0, 500000.0 * vol_multiplier)

            delivery_pct[i] = np.clip(50.0 - 100 * abs(stock_ret) + np.random.normal(0, 5.0), 15.0, 80.0)

            oi_change_pct = 2.0 * stock_ret + np.random.normal(0.002, 0.015)
            futures_oi[i] = max(100000.0, futures_oi[i-1] * (1 + oi_change_pct))

            fii_flow[i] = 2000.0 * nifty_ret + np.random.normal(0, 50.0)
            dii_flow[i] = -1000.0 * nifty_ret + np.random.normal(0, 40.0)
            
            # Institutional and Shareholding Simulation
            mf_flow[i] = 400.0 * stock_ret + np.random.normal(20.0, 15.0)
            # SIP flows grow steadily
            sip_flow[i] = sip_flow[i-1] * (1.0 + 0.0005) + np.random.normal(0, 0.2)
            
            # Shareholding changes slightly quarterly (approx 60 days)
            if i % 60 == 0:
                p_chg = np.random.normal(0.0, 0.1)
                f_chg = np.random.normal(0.1, 0.2)
                d_chg = np.random.normal(0.05, 0.15)
                
                # Constrain sum to 100%
                promoter_pct_daily[i] = np.clip(promoter_pct_daily[i-1] + p_chg, 0.0, 100.0)
                fii_pct_daily[i] = np.clip(fii_pct_daily[i-1] + f_chg, 0.0, 100.0)
                dii_pct_daily[i] = np.clip(dii_pct_daily[i-1] + d_chg, 0.0, 100.0)
                public_pct_daily[i] = 100.0 - (promoter_pct_daily[i] + fii_pct_daily[i] + dii_pct_daily[i])
            else:
                promoter_pct_daily[i] = promoter_pct_daily[i-1]
                fii_pct_daily[i] = fii_pct_daily[i-1]
                dii_pct_daily[i] = dii_pct_daily[i-1]
                public_pct_daily[i] = public_pct_daily[i-1]

            # Corporate Actions
            # Mostly 0, occasionally 1
            bonus_daily[i] = 1.0 if np.random.random() < 0.0005 else 0.0
            split_daily[i] = 1.0 if np.random.random() < 0.0002 else 0.0
            buyback_daily[i] = 1.0 if np.random.random() < 0.0006 else 0.0
            promoter_buy_daily[i] = 1.0 if np.random.random() < 0.005 else 0.0
            promoter_sell_daily[i] = 1.0 if np.random.random() < 0.005 else 0.0
            div_yield_daily[i] = np.clip(div_yield_daily[i-1] + np.random.normal(0, 0.01), 0.1, 8.0)

            # Options variables
            options_pcr_daily[i] = np.clip(1.0 + 3.0 * stock_ret + np.random.normal(0, 0.08), 0.4, 2.0)
            max_pain_daily[i] = round(prices[i] / 5.0) * 5.0  # round to nearest 5
            iv_rank_daily[i] = np.clip(iv_rank_daily[i-1] + np.random.normal(0.0, 1.5), 0.0, 100.0)
            iv_pct_daily[i] = np.clip(iv_pct_daily[i-1] + np.random.normal(0.0, 1.2), 0.0, 100.0)

        # High/Low/Open derivation from Close
        high = prices * (1 + np.abs(np.random.normal(0.008, 0.005, n_days)))
        low = prices * (1 - np.abs(np.random.normal(0.008, 0.005, n_days)))
        open_p = np.zeros(n_days)
        open_p[0] = prices[0]
        for i in range(1, n_days):
            open_p[i] = prices[i-1] * (1 + np.random.normal(0, 0.002))
            high[i] = max(high[i], open_p[i], prices[i])
            low[i] = min(low[i], open_p[i], prices[i])

        # Smart Money (17)
        block_deals_vol = np.random.normal(5.0, 50.0, n_days)
        bulk_deals_vol = np.random.normal(2.0, 20.0, n_days)
        promoter_pledging = np.clip(10.0 + np.cumsum(np.random.normal(0, 0.2, n_days)), 0.0, 60.0)
        mf_holding_change = np.random.normal(0.02, 0.04, n_days)

        # Liquidity (18)
        daily_traded_value = volumes * prices / 1e7 # in Cr
        bid_ask_spread = np.clip(0.01 + np.abs(np.random.normal(0, 0.01, n_days)), 0.002, 0.15)
        market_depth = np.clip(1.0 + np.random.normal(0, 0.1, n_days), 0.5, 2.0)
        order_book_imbalance = np.clip(np.random.normal(0, 15.0, n_days), -100.0, 100.0)

        # Intraday Activity (19)
        prices_series = pd.Series(prices)
        prev_prices = prices_series.shift(1).fillna(prices[0]).to_numpy()
        opening_gap_pct = (open_p - prev_prices) / prev_prices * 100
        first_hour_vol_pct = np.clip(30.0 + np.random.normal(0, 4.0, n_days), 15.0, 50.0)
        closing_auction_strength = np.random.normal(0.0, 5.0, n_days)

        # Alternative Data (29)
        app_downloads_growth = np.clip(20.0 + np.cumsum(np.random.normal(0, 0.5, n_days)), -10.0, 100.0)
        web_traffic_growth = np.clip(15.0 + np.cumsum(np.random.normal(0, 0.4, n_days)), -20.0, 100.0)
        search_trends = np.clip(8.0 + np.cumsum(np.random.normal(0, 0.3, n_days)), -5.0, 50.0)
        social_mentions = np.clip(12.0 + np.cumsum(np.random.normal(0, 1.2, n_days)), -30.0, 200.0)
        job_postings_growth = np.clip(5.0 + np.cumsum(np.random.normal(0, 0.2, n_days)), -15.0, 40.0)

        # Analyst Layer (31)
        analyst_buy = np.clip(25.0 + np.cumsum(np.random.randint(-1, 2, n_days)), 0.0, 60.0)
        analyst_hold = np.clip(8.0 + np.cumsum(np.random.randint(-1, 2, n_days)), 0.0, 20.0)
        analyst_sell = np.clip(3.0 + np.cumsum(np.random.randint(-1, 2, n_days)), 0.0, 15.0)
        target_price_revision = np.random.normal(0.5, 2.0, n_days)
        estimate_revision = np.random.normal(0.2, 1.5, n_days)

        # Market Structure (26)
        support_zone = prices * 0.96
        resistance_zone = prices * 1.04
        high_series = pd.Series(high)
        prev_high = high_series.shift(1).fillna(high[0]).to_numpy()
        higher_high = (high > prev_high).astype(float)
        lower_high = (high < prev_high).astype(float)
        low_series = pd.Series(low)
        prev_low = low_series.shift(1).fillna(low[0]).to_numpy()
        higher_low = (low > prev_low).astype(float)
        lower_low = (low < prev_low).astype(float)

        # ETF Flows (28) & Event risk (22)
        etf_flow = np.random.normal(50.0, 100.0, n_days)
        event_risk_days = np.array([i % 25 for i in range(n_days)])

        stock_df = pd.DataFrame({
            "Date": date_range,
            "Open": open_p,
            "High": high,
            "Low": low,
            "Close": prices,
            "Volume": volumes,
            "DeliveryPct": delivery_pct,
            "FuturesOI": futures_oi,
            "FII_Flow": fii_flow,
            "DII_Flow": dii_flow,
            "MF_Flow": mf_flow,
            "SIP_Flow": sip_flow,
            "PromoterPct": promoter_pct_daily,
            "FiiPct": fii_pct_daily,
            "DiiPct": dii_pct_daily,
            "PublicPct": public_pct_daily,
            "DividendYield": div_yield_daily,
            "BonusIssues": bonus_daily,
            "StockSplits": split_daily,
            "Buybacks": buyback_daily,
            "PromoterBuying": promoter_buy_daily,
            "PromoterSelling": promoter_sell_daily,
            "MaxPain": max_pain_daily,
            "IVRank": iv_rank_daily,
            "IVPercentile": iv_pct_daily,
            "OptionsPCR": options_pcr_daily,
            "BlockDealsVolume": block_deals_vol,
            "BulkDealsVolume": bulk_deals_vol,
            "PromoterPledging": promoter_pledging,
            "MFHoldingChange": mf_holding_change,
            "DailyTradedValue": daily_traded_value,
            "BidAskSpread": bid_ask_spread,
            "MarketDepth": market_depth,
            "OrderBookImbalance": order_book_imbalance,
            "OpeningGapPct": opening_gap_pct,
            "FirstHourVolumePct": first_hour_vol_pct,
            "ClosingAuctionStrength": closing_auction_strength,
            "AppDownloadsGrowth": app_downloads_growth,
            "WebTrafficGrowth": web_traffic_growth,
            "SearchTrends": search_trends,
            "SocialMentions": social_mentions,
            "JobPostingsGrowth": job_postings_growth,
            "AnalystBuy": analyst_buy,
            "AnalystHold": analyst_hold,
            "AnalystSell": analyst_sell,
            "TargetPriceRevision": target_price_revision,
            "EstimateRevision": estimate_revision,
            "SupportZone": support_zone,
            "ResistanceZone": resistance_zone,
            "HigherHigh": higher_high,
            "HigherLow": higher_low,
            "LowerHigh": lower_high,
            "LowerLow": lower_low,
            "ETFFlow": etf_flow,
            "EventRiskDays": event_risk_days
        })
        
        stock_df.to_csv(os.path.join(output_dir, f"{ticker}_daily.csv"), index=False)

    # 5. News feeds
    news_headlines = [
        {"title": "earnings beat estimates, margins expand", "sentiment": 0.8, "sector": "All"},
        {"title": "secures mega contract from global client", "sentiment": 0.9, "sector": "IT"},
        {"title": "launches state-of-the-art manufacturing unit", "sentiment": 0.7, "sector": "Auto"},
        {"title": "regulatory inspection clears facility with no observations", "sentiment": 0.85, "sector": "Pharma"},
        {"title": "commodity prices rally, boosting margin outlook", "sentiment": 0.65, "sector": "Metals"},
        {"title": "facing labor disputes, production temporarily halted", "sentiment": -0.75, "sector": "Auto"},
        {"title": "government hikes export duty, shares drag", "sentiment": -0.6, "sector": "Metals"},
        {"title": "receives tax demand notice from authorities", "sentiment": -0.4, "sector": "All"},
        {"title": "CEO announces resignation amid corporate strategy shift", "sentiment": -0.5, "sector": "All"},
        {"title": "analysts upgrade stock to BUY, raising target price", "sentiment": 0.75, "sector": "All"},
        {"title": "launches premium EV model, targets high-end market", "sentiment": 0.8, "sector": "Auto"},
        {"title": "central bank cuts interest rates, boosting credit growth", "sentiment": 0.7, "sector": "Banking"},
        {"title": "NPAs drop significantly, asset quality improves", "sentiment": 0.85, "sector": "Banking"},
        {"title": "crude oil prices spike, threatening margin squeeze", "sentiment": -0.5, "sector": "Energy"},
        {"title": "monsoon delay raises concerns over rural consumption demand", "sentiment": -0.45, "sector": "FMCG"},
        {"title": "government clears infrastructure package, big positive", "sentiment": 0.8, "sector": "Realty"},
        
        # Macro Economic Headlines
        {"title": "RBI keeps repo rate unchanged, shifts to neutral stance", "sentiment": 0.5, "sector": "Macro"},
        {"title": "US Fed hints at rate cuts as inflation cools to 2.1%", "sentiment": 0.75, "sector": "Macro"},
        {"title": "Geopolitical tensions escalate in the Middle East, crude spikes", "sentiment": -0.6, "sector": "Macro"},
        {"title": "India CPI Inflation cools to 4.2%, matching central bank targets", "sentiment": 0.8, "sector": "Macro"},
        {"title": "US jobs report shows strong labor market, easing recession fears", "sentiment": 0.7, "sector": "Macro"},
        {"title": "Retail inflation surges globally, raising rate hike fears", "sentiment": -0.65, "sector": "Macro"}
    ]

    news_data = []
    current_time = datetime.now()
    for d in range(60): 
        date_item = current_time - timedelta(days=d)
        if date_item.weekday() >= 5: 
            continue
        n_articles = np.random.randint(2, 5)
        for _ in range(n_articles):
            hl = np.random.choice(news_headlines)
            if hl["sector"] == "Macro":
                target_stock = "MACRO"
                formatted_title = f"MACRO: {hl['title']}"
            else:
                matching_stocks = [t for t, m in STOCKS_METADATA.items() if m["sector"] == hl["sector"] or hl["sector"] == "All"]
                target_stock = np.random.choice(matching_stocks)
                formatted_title = f"{target_stock}: {hl['title'].capitalize()}"
            
            sentiment_noise = np.random.normal(0, 0.15)
            sentiment_score = np.clip(hl["sentiment"] + sentiment_noise, -1.0, 1.0)
            
            news_data.append({
                "Date": date_item.strftime("%Y-%m-%d"),
                "Ticker": target_stock,
                "Headline": formatted_title,
                "SentimentScore": sentiment_score,
                "URL": f"https://finance.yahoo.com/quote/{target_stock}" if target_stock != "MACRO" else "https://finance.yahoo.com/news"
            })
            
    news_df = pd.DataFrame(news_data)
    news_df.to_csv(os.path.join(output_dir, "news_feed.csv"), index=False)
    print("Data generation complete.")

def generate_intraday_data(ticker, interval='1h', days=30):
    daily_file = f"data/{ticker}_daily.csv"
    if not os.path.exists(daily_file):
        raise ValueError(f"Daily data for {ticker} does not exist. Generate daily first.")
    
    daily_df = pd.read_csv(daily_file)
    daily_df["Date"] = pd.to_datetime(daily_df["Date"])
    daily_df = daily_df.sort_values("Date").tail(days)
    
    if interval == '1h':
        ticks_per_day = 6 
        noise_std = 0.003
    elif interval == '15m':
        ticks_per_day = 25 
        noise_std = 0.0015
    else:
        raise ValueError("Unsupported interval. Use '1h' or '15m'")
        
    intraday_rows = []
    
    for idx, row in daily_df.iterrows():
        day_date = row["Date"]
        day_open = row["Open"]
        day_close = row["Close"]
        day_high = row["High"]
        day_low = row["Low"]
        day_vol = row["Volume"]
        
        seed_val = int(day_date.timestamp()) + sum(ord(c) for c in ticker)
        np.random.seed(seed_val)
        
        walk = np.zeros(ticks_per_day)
        walk[0] = day_open
        walk[-1] = day_close
        
        for t in range(1, ticks_per_day - 1):
            fraction = t / (ticks_per_day - 1)
            target = day_open + fraction * (day_close - day_open)
            walk[t] = target + np.random.normal(0, noise_std * day_open)
            
        walk = np.clip(walk, day_low, day_high)
        high_idx = np.random.randint(0, ticks_per_day)
        low_idx = np.random.randint(0, ticks_per_day)
        walk[high_idx] = day_high
        walk[low_idx] = day_low
        
        for t in range(ticks_per_day):
            t_close = walk[t]
            t_open = walk[t-1] if t > 0 else day_open
            
            t_high = max(t_open, t_close) * (1 + np.abs(np.random.normal(0, noise_std/2)))
            t_low = min(t_open, t_close) * (1 - np.abs(np.random.normal(0, noise_std/2)))
            
            t_high = min(t_high, day_high)
            t_low = max(t_low, day_low)
            
            tick_time = day_date + timedelta(hours=9, minutes=15) + timedelta(minutes=int(t * (375 / ticks_per_day)))
            
            intraday_rows.append({
                "DateTime": tick_time.strftime("%Y-%m-%d %H:%M:%S"),
                "Open": t_open,
                "High": t_high,
                "Low": t_low,
                "Close": t_close,
                "Volume": day_vol / ticks_per_day
            })
            
    return pd.DataFrame(intraday_rows)

if __name__ == "__main__":
    generate_market_data()
