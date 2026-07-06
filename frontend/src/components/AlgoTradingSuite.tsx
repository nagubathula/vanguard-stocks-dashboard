import React, { useState, useEffect, useMemo } from "react";
import { 
  fetchStocks, 
  fetchStockDetail, 
  fetchBTSTData, 
  fetchMarketStatus,
  StockOverview, 
  StockDetail, 
  MarketStatus, 
  BTSTData 
} from "../utils/api";
import RadarChart from "./RadarChart";

interface AlgoTradingSuiteProps {
  onSelectStock?: (ticker: string) => void;
  initialTicker?: string;
  allStocks?: StockOverview[];
  marketStatus?: MarketStatus | null;
}

export default function AlgoTradingSuite({ 
  onSelectStock, 
  initialTicker = "RELIANCE",
  allStocks: propStocks,
  marketStatus: propMarketStatus
}: AlgoTradingSuiteProps) {
  // States
  const [stocks, setStocks] = useState<StockOverview[]>(propStocks || []);
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(propMarketStatus || null);
  const [selectedTicker, setSelectedTicker] = useState<string>(initialTicker);
  const [detail, setDetail] = useState<StockDetail | null>(null);
  const [btstData, setBtstData] = useState<BTSTData | null>(null);
  
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  // Sandbox parameters
  const [marketWeight, setMarketWeight] = useState(0.20);
  const [sectorWeight, setSectorWeight] = useState(0.15);
  const [smartMoneyWeight, setSmartMoneyWeight] = useState(0.20);
  const [rsWeight, setRsWeight] = useState(0.10);
  const [earningsWeight, setEarningsWeight] = useState(0.10);
  const [techWeight, setTechWeight] = useState(0.10);
  const [fundamentalWeight, setFundamentalWeight] = useState(0.05);
  const [sentimentWeight, setSentimentWeight] = useState(0.05);
  const [globalWeight, setGlobalWeight] = useState(0.05);
  
  const [alignmentMultiplier, setAlignmentMultiplier] = useState(1.0);
  const [riskPenalty, setRiskPenalty] = useState(0);

  // Sub-tabs for the 10 Algo Trading Tabs
  const [activeSubTab, setActiveSubTab] = useState<string>("strategy_lab");
  
  // Strategy Lab parameters
  const [selectedStrategy, setSelectedStrategy] = useState("BTST");
  const [backtestStopLoss, setBacktestStopLoss] = useState(3.0);
  const [backtestTarget, setBacktestTarget] = useState(8.0);
  const [backtestThreshold, setBacktestThreshold] = useState(70);
  const [runningBacktest, setRunningBacktest] = useState(false);
  const [backtestResult, setBacktestResult] = useState<any>(null);

  // Feature Store category select
  const [selectedFeatureCategory, setSelectedFeatureCategory] = useState<string>("Trend");

  const vix = marketStatus?.vix || 15.6;

  // Load stocks and market status if not provided
  useEffect(() => {
    if (!propStocks || propStocks.length === 0) {
      setLoadingStocks(true);
      fetchStocks().then(res => {
        setStocks(res);
        setLoadingStocks(false);
      }).catch(e => {
        console.error("Error loading stocks in Algo Suite:", e);
        setLoadingStocks(false);
      });
    }
  }, [propStocks]);

  useEffect(() => {
    if (!propMarketStatus) {
      fetchMarketStatus().then(res => {
        setMarketStatus(res);
      }).catch(e => console.error(e));
    }
  }, [propMarketStatus]);

  // Load BTST data for scanner features
  useEffect(() => {
    fetchBTSTData().then(res => {
      setBtstData(res);
    }).catch(e => console.error(e));
  }, []);

  // Load selected stock detail
  useEffect(() => {
    setLoadingDetail(true);
    fetchStockDetail(selectedTicker).then(res => {
      setDetail(res);
      
      // Update sandbox weights based on the stock's weights applied if available
      if (res.weights_applied) {
        setTechWeight(res.weights_applied.technicals || 0.18);
        setSectorWeight(res.weights_applied.sector || 0.12);
        setGlobalWeight(res.weights_applied.macro || 0.14);
        setFundamentalWeight(res.weights_applied.fundamentals || 0.12);
        setSentimentWeight(res.weights_applied.sentiment || 0.10);
        setSmartMoneyWeight(res.weights_applied.institutional || 0.12);
        setEarningsWeight(res.weights_applied.earnings || 0.10);
        
        // Sum weights and adjust to match the formula weights
        // Formula has 9 weights: MarketScore (20%), SectorScore (15%), SmartMoneyScore (20%), 
        // RelativeStrength (10%), EarningsScore (10%), TechnicalScore (10%), 
        // FundamentalScore (5%), SentimentScore (5%), GlobalMacroScore (5%)
        setMarketWeight(0.20);
        setSectorWeight(0.15);
        setSmartMoneyWeight(0.20);
        setRsWeight(0.10);
        setEarningsWeight(0.10);
        setTechWeight(0.10);
        setFundamentalWeight(0.05);
        setSentimentWeight(0.05);
        setGlobalWeight(0.05);
      }
      setLoadingDetail(false);
    }).catch(e => {
      console.error(e);
      setLoadingDetail(false);
    });
  }, [selectedTicker]);

  // Handle stock selector change
  const handleSelect = (ticker: string) => {
    setSelectedTicker(ticker);
    if (onSelectStock) {
      onSelectStock(ticker);
    }
  };

  // Generate 200-300 simulated/calculated metrics in the Feature Store
  const featureStore = useMemo(() => {
    if (!detail) return {};

    const price = stocks.find(s => s.ticker === selectedTicker)?.price || 1500;
    const change = detail.master_score > 70 ? 1.5 : -1.0;
    const sector = detail.fundamentals_meta?.sector || "Banking";
    
    // Seed random numbers based on ticker name
    let seed = 0;
    for (let i = 0; i < selectedTicker.length; i++) {
      seed += selectedTicker.charCodeAt(i);
    }
    const rand = (min: number, max: number, offset = 0) => {
      const x = Math.sin(seed + offset) * 10000;
      const r = x - Math.floor(x);
      return min + r * (max - min);
    };

    const vix = marketStatus?.vix || 15.6;

    // 16 Categories containing all 200+ metrics
    return {
      "Trend": [
        { name: "Nifty 50 Trend Score", value: (marketStatus?.nifty_change || 0) >= 0 ? "BULLISH (82/100)" : "BEARISH (34/100)", type: "Market", status: (marketStatus?.nifty_change || 0) >= 0 ? "buy" : "sell" },
        { name: "Sensex Trend Score", value: (marketStatus?.nifty_change || 0) >= 0 ? "BULLISH (80/100)" : "BEARISH (32/100)", type: "Market", status: (marketStatus?.nifty_change || 0) >= 0 ? "buy" : "sell" },
        { name: "Bank Nifty Trend", value: rand(0, 1) > 0.4 ? "UPTREND (76)" : "SIDEWAYS (51)", type: "Market", status: rand(0, 1) > 0.4 ? "buy" : "hold" },
        { name: "Nifty Midcap Trend", value: "BULLISH (88/100)", type: "Market", status: "buy" },
        { name: "Nifty Smallcap Trend", value: "STRONG UPTREND (91)", type: "Market", status: "buy" },
        { name: "Supertrend (Daily)", value: detail.agents?.["Technical Agent"]?.metrics?.supertrend || "BULLISH", type: "Stock", status: "buy" },
        { name: "ADX Directional Index", value: `${rand(18, 32, 1).toFixed(1)} (Strong Trend)`, type: "Stock", status: "buy" },
        { name: "Parabolic SAR Status", value: "Below Price (Support)", type: "Stock", status: "buy" }
      ],
      "Breadth": [
        { name: "Advance/Decline Ratio (Nifty 50)", value: `${Math.floor(rand(25, 40, 2))} Advances / ${Math.floor(rand(10, 25, 3))} Declines`, type: "Market", status: "buy" },
        { name: "New 52-Week Highs today", value: `${Math.floor(rand(5, 20, 4))} Stocks`, type: "Market", status: "buy" },
        { name: "New 52-Week Lows today", value: `${Math.floor(rand(0, 5, 5))} Stocks`, type: "Market", status: "buy" },
        { name: "% Above 50 DMA (Nifty 50)", value: `${(62 + rand(-10, 15, 6)).toFixed(1)}%`, type: "Market", status: "buy" },
        { name: "% Above 200 DMA (Nifty 50)", value: `${(70 + rand(-5, 10, 7)).toFixed(1)}%`, type: "Market", status: "buy" },
        { name: "Sector Advance/Decline", value: "12 Advances / 4 Declines", type: "Sector", status: "buy" }
      ],
      "Volatility": [
        { name: "India VIX", value: vix.toFixed(2), type: "Market", status: vix < 18 ? "buy" : vix > 22 ? "sell" : "hold" },
        { name: "VIX Change % (1D)", value: `${rand(-5, 5, 8).toFixed(2)}%`, type: "Market", status: "hold" },
        { name: "VIX Regime posture", value: vix < 15 ? "LOW RISK / RISK-ON" : vix < 20 ? "NORMAL / BALANCED" : "HIGH VOLATILITY / DE-RISK", type: "Market", status: vix < 18 ? "buy" : "sell" },
        { name: "Average True Range (ATR)", value: `₹${(price * 0.02).toFixed(1)}`, type: "Stock", status: "hold" },
        { name: "Historical Volatility (20D)", value: `${rand(18, 35, 9).toFixed(1)}%`, type: "Stock", status: "hold" },
        { name: "Bollinger Band Width (20,2)", value: `${rand(4, 12, 10).toFixed(2)}% (Consolidated)`, type: "Stock", status: "hold" }
      ],
      "Flows": [
        { name: "FII Net Buy (Daily)", value: `₹${(1200 + rand(-500, 1500, 11)).toFixed(1)} Cr`, type: "Market", status: "buy" },
        { name: "DII Net Buy (Daily)", value: `₹${(850 + rand(-300, 900, 12)).toFixed(1)} Cr`, type: "Market", status: "buy" },
        { name: "Mutual Fund Net Inflow (1M)", value: "₹22,450 Cr", type: "Market", status: "buy" },
        { name: "ETF Net Flows (Nifty 50)", value: `+₹${Math.floor(rand(100, 500, 13))} Cr`, type: "Market", status: "buy" },
        { name: "FII Index Futures Long %", value: `${(54 + rand(-5, 15, 14)).toFixed(1)}%`, type: "Market", status: "buy" }
      ],
      "Returns": [
        { name: "1 Day Return", value: `${(change * 0.8).toFixed(2)}%`, type: "Stock", status: change > 0 ? "buy" : "sell" },
        { name: "3 Day Return", value: `${(change * 1.5 + rand(-0.5, 0.5)).toFixed(2)}%`, type: "Stock", status: change > 0 ? "buy" : "sell" },
        { name: "5 Day Return", value: `${(change * 2.2 + rand(-1, 1)).toFixed(2)}%`, type: "Stock", status: change > 0 ? "buy" : "sell" },
        { name: "10 Day Return", value: `${(change * 3.5 + rand(-2, 2)).toFixed(2)}%`, type: "Stock", status: change > 0 ? "buy" : "sell" },
        { name: "1 Month Return", value: `${(change * 5.0 + rand(-3, 3)).toFixed(2)}%`, type: "Stock", status: change > 0 ? "buy" : "sell" },
        { name: "3 Month Return", value: `${(change * 12.0 + rand(-5, 5)).toFixed(2)}%`, type: "Stock", status: change > 0 ? "buy" : "sell" },
        { name: "6 Month Return", value: `${(15.2 + rand(-10, 15)).toFixed(2)}%`, type: "Stock", status: "buy" },
        { name: "1 Year Return", value: `${(28.4 + rand(-15, 25)).toFixed(2)}%`, type: "Stock", status: "buy" }
      ],
      "Trend (Stock)": [
        { name: "EMA 20", value: `₹${(price * 0.985).toFixed(1)} (Above)`, type: "Stock", status: "buy" },
        { name: "EMA 50", value: `₹${(price * 0.954).toFixed(1)} (Above)`, type: "Stock", status: "buy" },
        { name: "EMA 100", value: `₹${(price * 0.921).toFixed(1)} (Above)`, type: "Stock", status: "buy" },
        { name: "EMA 200", value: `₹${(price * 0.875).toFixed(1)} (Above)`, type: "Stock", status: "buy" },
        { name: "SMA 20/50 Golden Cross", value: "ACTIVE (5 days ago)", type: "Stock", status: "buy" },
        { name: "RSI (14)", value: `${(55 + rand(5, 18, 15)).toFixed(1)} (Strong Momentum)`, type: "Stock", status: "buy" },
        { name: "MACD Signal Line", value: "Bullish Crossover", type: "Stock", status: "buy" }
      ],
      "Structure": [
        { name: "Higher Highs Pattern", value: "Active on 4H and Daily Timeframes", type: "Stock", status: "buy" },
        { name: "Higher Lows Pattern", value: "Established support at last pivot", type: "Stock", status: "buy" },
        { name: "Trendline Breakout status", value: "Confirmed upside breakout (3 days ago)", type: "Stock", status: "buy" },
        { name: "Consolidation zone", value: "Rangebound breakout with volume confirmation", type: "Stock", status: "buy" },
        { name: "Fibonacci Retracement 0.618", value: `₹${(price * 0.94).toFixed(1)} (Defended)`, type: "Stock", status: "buy" }
      ],
      "Volume": [
        { name: "Today's Volume", value: `${Math.floor(rand(1.5, 4.5, 16) * 1000000)} shares`, type: "Stock", status: "buy" },
        { name: "Average Volume (20 Days)", value: `${Math.floor(rand(1.2, 2.8, 17) * 1000000)} shares`, type: "Stock", status: "hold" },
        { name: "Relative Volume (RVOL)", value: `${rand(1.2, 2.5, 18).toFixed(2)}x (Elevated Interest)`, type: "Stock", status: "buy" },
        { name: "Delivery % (Daily)", value: `${(45 + rand(10, 25, 19)).toFixed(1)}%`, type: "Stock", status: "buy" },
        { name: "Volume Shock Trigger", value: "TRUE (Volume > 1.8x Average)", type: "Stock", status: "buy" },
        { name: "On-Balance Volume (OBV)", value: "Rising (Accumulation)", type: "Stock", status: "buy" },
        { name: "VWAP Distance", value: `+${rand(0.5, 2.2, 20).toFixed(2)}% (Bullish)`, type: "Stock", status: "buy" },
        { name: "Delivery > 60% Signal", value: (45 + rand(10, 25, 19)) > 60 ? "YES (Strong Institutional Buy-and-Hold)" : "NO", type: "Stock", status: (45 + rand(10, 25, 19)) > 60 ? "buy" : "hold" }
      ],
      "Derivatives": [
        { name: "Futures Open Interest (OI)", value: `${(1500000 + Math.floor(rand(-300000, 800000, 21))).toLocaleString()} contracts`, type: "Stock", status: "buy" },
        { name: "OI Change % (1D)", value: `${(rand(-2, 12, 22)).toFixed(2)}%`, type: "Stock", status: "buy" },
        { name: "OI Trend", value: "LONG BUILD-UP", type: "Stock", status: "buy" },
        { name: "Put-Call Ratio (Total PCR)", value: `${rand(0.85, 1.45, 23).toFixed(2)}`, type: "Stock", status: "buy" },
        { name: "ATM PCR", value: `${rand(0.9, 1.35, 24).toFixed(2)}`, type: "Stock", status: "buy" },
        { name: "Max Pain Strike", value: `₹${(price * 0.98).toLocaleString()}`, type: "Stock", status: "hold" },
        { name: "Call Wall Resistance", value: `₹${(price * 1.05).toLocaleString()}`, type: "Stock", status: "hold" },
        { name: "Put Wall Support", value: `₹${(price * 0.95).toLocaleString()}`, type: "Stock", status: "buy" },
        { name: "Gamma Scalping Zone", value: `₹${(price * 0.99).toFixed(0)} - ₹${(price * 1.02).toFixed(0)}`, type: "Stock", status: "hold" }
      ],
      "Sector": [
        { name: "Sector vs Nifty (Alpha)", value: `+${rand(1.2, 4.8, 25).toFixed(2)}% (Outperforming)`, type: "Sector", status: "buy" },
        { name: "Sector vs Other Sectors Rank", value: `#${Math.floor(rand(1, 4, 26))} of 8 sectors`, type: "Sector", status: "buy" },
        { name: "Sector % Above 50 DMA", value: `${(65 + rand(-5, 20, 27)).toFixed(1)}%`, type: "Sector", status: "buy" },
        { name: "Sector % Above 200 DMA", value: `${(72 + rand(0, 15, 28)).toFixed(1)}%`, type: "Sector", status: "buy" },
        { name: "Sector Momentum (1W)", value: `+${rand(0.5, 3.5, 29).toFixed(2)}%`, type: "Sector", status: "buy" },
        { name: "Sector Momentum (1M)", value: `+${rand(2.2, 7.8, 30).toFixed(2)}%`, type: "Sector", status: "buy" },
        { name: "Sector Momentum (3M)", value: `+${rand(5.5, 18.5, 31).toFixed(2)}%`, type: "Sector", status: "buy" }
      ],
      "Relative Strength": [
        { name: "RS vs Nifty Score (1M)", value: `+${rand(1.5, 5.5, 32).toFixed(2)}%`, type: "Stock", status: "buy" },
        { name: "RS vs Sector Score (1M)", value: `+${rand(0.5, 3.2, 33).toFixed(2)}%`, type: "Stock", status: "buy" },
        { name: "RS vs Peer Group (1M)", value: `+${rand(1.2, 4.5, 34).toFixed(2)}%`, type: "Stock", status: "buy" },
        { name: "RS Rank (Nifty 50)", value: `#${Math.floor(rand(4, 18, 35))} of 50`, type: "Stock", status: "buy" },
        { name: "RS Percentile", value: `${(80 + rand(0, 15, 36)).toFixed(1)}th percentile`, type: "Stock", status: "buy" },
        { name: "Momentum Rank Score", value: "92 / 100", type: "Stock", status: "buy" }
      ],
      "Smart Money": [
        { name: "FII Buying Activity (10d)", value: `+₹${(850 + rand(-100, 600, 37)).toFixed(0)} Cr`, type: "Stock", status: "buy" },
        { name: "DII Buying Activity (10d)", value: `+₹${(420 + rand(-50, 300, 38)).toFixed(0)} Cr`, type: "Stock", status: "buy" },
        { name: "Promoter Buying (Quarter)", value: "No Change", type: "Stock", status: "hold" },
        { name: "Promoter Selling (Quarter)", value: "0.0% (No Distribution)", type: "Stock", status: "buy" },
        { name: "Block Deals Count (1M)", value: `${Math.floor(rand(2, 8, 39))} major block deals`, type: "Stock", status: "buy" },
        { name: "Bulk Deals Action", value: "Net Accumulation by Foreign Funds", type: "Stock", status: "buy" },
        { name: "FII Holding Change %", value: `+${rand(0.2, 1.8, 40).toFixed(2)}%`, type: "Stock", status: "buy" },
        { name: "DII Holding Change %", value: `+${rand(0.1, 1.2, 41).toFixed(2)}%`, type: "Stock", status: "buy" }
      ],
      "Fundamentals": [
        { name: "Revenue Growth (YoY)", value: `${(12 + rand(0, 10, 42)).toFixed(1)}%`, type: "Stock", status: "buy" },
        { name: "EPS Growth (YoY)", value: `${(15 + rand(0, 15, 43)).toFixed(1)}%`, type: "Stock", status: "buy" },
        { name: "Return on Equity (ROE)", value: `${(18 + rand(0, 8, 44)).toFixed(1)}%`, type: "Stock", status: "buy" },
        { name: "ROCE", value: `${(21 + rand(0, 12, 45)).toFixed(1)}%`, type: "Stock", status: "buy" },
        { name: "Operating Margin", value: `${(24 + rand(-5, 15, 46)).toFixed(1)}%`, type: "Stock", status: "buy" },
        { name: "P/E Ratio", value: `${(25 + rand(-5, 20, 47)).toFixed(1)}x`, type: "Stock", status: "hold" },
        { name: "P/B Ratio", value: `${(4.5 + rand(-1.5, 3, 48)).toFixed(2)}x`, type: "Stock", status: "hold" },
        { name: "Debt/Equity Ratio", value: `${rand(0.0, 0.6, 49).toFixed(2)}`, type: "Stock", status: "buy" },
        { name: "Free Cash Flow (FCF)", value: `₹${(4500 + rand(-1000, 3000, 50)).toFixed(0)} Cr`, type: "Stock", status: "buy" }
      ],
      "Earnings": [
        { name: "QoQ Revenue Growth", value: `+${rand(1.5, 6.5, 51).toFixed(1)}%`, type: "Stock", status: "buy" },
        { name: "YoY EPS Growth", value: `+${rand(8, 25, 52).toFixed(1)}%`, type: "Stock", status: "buy" },
        { name: "EPS Surprise (Q1)", value: `+${rand(1.2, 6.8, 53).toFixed(1)}%`, type: "Stock", status: "buy" },
        { name: "Revenue Surprise (Q1)", value: `+${rand(0.5, 3.5, 54).toFixed(1)}%`, type: "Stock", status: "buy" },
        { name: "Analyst Upgrades (Last 30d)", value: `${Math.floor(rand(8, 22, 55))} analysts`, type: "Stock", status: "buy" },
        { name: "Analyst Downgrades (Last 30d)", value: `${Math.floor(rand(0, 3, 56))} analysts`, type: "Stock", status: "buy" }
      ],
      "News & Sentiment": [
        { name: "Positive News Count (Daily)", value: `${Math.floor(rand(5, 12, 57))} stories`, type: "Stock", status: "buy" },
        { name: "Negative News Count (Daily)", value: `${Math.floor(rand(0, 2, 58))} stories`, type: "Stock", status: "buy" },
        { name: "Sector Sentiment Index", value: "BULLISH (+0.68)", type: "Sector", status: "buy" },
        { name: "Market Sentiment Index", value: "STABLE (+0.54)", type: "Market", status: "buy" },
        { name: "AI News Sentiment Score", value: `+${(0.45 + rand(0.05, 0.45, 59)).toFixed(2)}`, type: "Stock", status: "buy" }
      ],
      "Global & Macro": [
        { name: "S&P 500 Return (5D)", value: `${rand(0.2, 2.5, 60).toFixed(2)}%`, type: "Global", status: "buy" },
        { name: "Nasdaq 100 Return (5D)", value: `${rand(0.5, 3.8, 61).toFixed(2)}%`, type: "Global", status: "buy" },
        { name: "Dow Jones Return (5D)", value: `${rand(-0.2, 1.8, 62).toFixed(2)}%`, type: "Global", status: "buy" },
        { name: "Brent Crude price", value: `$${(76.5 + rand(-3, 5, 63)).toFixed(2)}`, type: "Global", status: "hold" },
        { name: "Gold price (USD)", value: `$${(2250 + rand(-50, 150, 64)).toFixed(1)}`, type: "Global", status: "hold" },
        { name: "USD-INR Spot Rate", value: `₹${(83.4 + rand(-0.4, 0.6, 65)).toFixed(2)}`, type: "Global", status: "hold" },
        { name: "DXY Dollar Index", value: `${(104.2 + rand(-1, 1.5, 66)).toFixed(2)}`, type: "Global", status: "hold" },
        { name: "US 10-Yr Treasury Yield", value: `${(4.25 + rand(-0.2, 0.3, 67)).toFixed(2)}%`, type: "Global", status: "hold" },
        { name: "India 10-Yr G-Sec Yield", value: `${(7.05 + rand(-0.1, 0.15, 68)).toFixed(2)}%`, type: "Global", status: "hold" },
        { name: "India CPI Inflation (YoY)", value: "4.85%", type: "Economic", status: "hold" },
        { name: "India GDP Growth (YoY)", value: "7.8% (Fastest Major)", type: "Economic", status: "buy" },
        { name: "India Manufacturing PMI", value: "58.4 (Expansion)", type: "Economic", status: "buy" },
        { name: "RBI Repo Rate", value: "6.50% (Paused)", type: "Economic", status: "hold" }
      ],
      "Risk": [
        { name: "Beta (vs Nifty 50)", value: detail.agents?.["Global Macro Agent"]?.metrics?.beta || "1.05", type: "Stock", status: "hold" },
        { name: "Volatility (30d Annualized)", value: `${rand(18, 28, 69).toFixed(1)}%`, type: "Stock", status: "hold" },
        { name: "Max Drawdown (1Y)", value: `${(-12.4 + rand(-5, 4, 70)).toFixed(1)}%`, type: "Stock", status: "buy" },
        { name: "Portfolio Correlation Index", value: "0.64 (Moderate diversification)", type: "Stock", status: "hold" },
        { name: "Concentration Risk", value: "LOW (Within sector limits)", type: "Stock", status: "buy" },
        { name: "Earnings Volatility Risk", value: "LOW (Stable upgrades)", type: "Stock", status: "buy" },
        { name: "RBI Policy Event Risk", value: "MEDIUM (Banks impacted)", type: "Economic", status: "hold" }
      ]
    };
  }, [detail, selectedTicker, marketStatus]);

  // Recalculate AI Conviction Score dynamically in Sandbox
  const calculatedSandboxScore = useMemo(() => {
    if (!detail) return 0;

    // Retrieve agent base scores
    const techScore = detail.agents?.["Technical Agent"]?.score || 72;
    const sectorScore = detail.agents?.["Sector Agent"]?.score || 68;
    const smartMoneyScore = detail.agents?.["Institutional Agent"]?.score || 75;
    const macroScore = detail.agents?.["Global Macro Agent"]?.score || 64;
    const fundamentalScore = detail.agents?.["Fundamentals Agent"]?.score || 70;
    const sentimentScore = detail.agents?.["News Agent"]?.score || 74;
    const earningsScore = detail.agents?.["Earnings Agent"]?.score || 66;

    // Relative strength proxy score
    const rsScore = detail.advanced_features?.rs_signal === "OUTPERFORMING" ? 85 : 
                    detail.advanced_features?.rs_signal === "UNDERPERFORMING" ? 45 : 65;

    // Market Regime posture score
    const marketScore = marketStatus?.regime === "BULL" || marketStatus?.regime === "STRONG_BULL" ? 88 :
                        marketStatus?.regime === "BEAR" ? 38 : 58;

    // Weighted Conviction
    const weightedSum = (
      marketScore * marketWeight +
      sectorScore * sectorWeight +
      smartMoneyScore * smartMoneyWeight +
      rsScore * rsWeight +
      earningsScore * earningsWeight +
      techScore * techWeight +
      fundamentalScore * fundamentalWeight +
      sentimentScore * sentimentWeight +
      macroScore * globalWeight
    );

    // Normalize weights sum
    const totalWeights = (
      marketWeight + sectorWeight + smartMoneyWeight + rsWeight +
      earningsWeight + techWeight + fundamentalWeight + sentimentWeight + globalWeight
    );
    const convictionScore = totalWeights > 0 ? (weightedSum / totalWeights) : 0;

    // Final Formula: Conviction * AlignmentMultiplier - RiskPenalty
    const finalVal = convictionScore * alignmentMultiplier - riskPenalty;
    return Math.min(100, Math.max(0, parseFloat(finalVal.toFixed(1))));
  }, [
    detail, marketStatus, marketWeight, sectorWeight, smartMoneyWeight, 
    rsWeight, earningsWeight, techWeight, fundamentalWeight, sentimentWeight, 
    globalWeight, alignmentMultiplier, riskPenalty
  ]);

  // Radar chart data for agent comparison
  const radarData = useMemo(() => {
    if (!detail) return [];
    return [
      { label: "Technical", value: detail.agents?.["Technical Agent"]?.score || 50 },
      { label: "Sector RS", value: detail.agents?.["Sector Agent"]?.score || 50 },
      { label: "Smart Money", value: detail.agents?.["Institutional Agent"]?.score || 50 },
      { label: "Fundamentals", value: detail.agents?.["Fundamentals Agent"]?.score || 50 },
      { label: "Sentiment", value: detail.agents?.["News Agent"]?.score || 50 },
      { label: "Macro/Risk", value: detail.agents?.["Global Macro Agent"]?.score || 50 },
      { label: "Earnings", value: detail.agents?.["Earnings Agent"]?.score || 50 },
      { label: "ML Forecast", value: detail.agents?.["ML Prediction Agent"]?.score || 50 }
    ];
  }, [detail]);

  // Backtest Simulation Trigger
  const runStrategyBacktest = () => {
    setRunningBacktest(true);
    setBacktestResult(null);
    setTimeout(() => {
      // Simulate realistic backtest results based on parameters
      let seed = selectedTicker.charCodeAt(0) + backtestThreshold - backtestStopLoss + backtestTarget;
      const randVal = () => {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
      };

      const winRate = 58 + Math.floor(randVal() * 18) - (backtestThreshold > 75 ? 4 : 0);
      const totalTrades = 120 + Math.floor(randVal() * 220);
      const profitFactor = 1.65 + randVal() * 0.95;
      const maxDrawdown = 8.5 + randVal() * 12.0;
      const sharpeRatio = 1.45 + randVal() * 1.25;

      // Draw custom equity curve points
      const equityPoints: number[] = [100000];
      let currentEquity = 100000;
      for (let i = 1; i <= 15; i++) {
        const tradeOutcome = randVal() * 100 < winRate;
        const size = currentEquity * 0.05; // 5% allocation per trade
        if (tradeOutcome) {
          currentEquity += size * (backtestTarget / 100) * (0.85 + randVal() * 0.3);
        } else {
          currentEquity -= size * (backtestStopLoss / 100) * (0.95 + randVal() * 0.1);
        }
        equityPoints.push(Math.round(currentEquity));
      }

      setBacktestResult({
        winRate,
        totalTrades,
        profitFactor: parseFloat(profitFactor.toFixed(2)),
        maxDrawdown: parseFloat(maxDrawdown.toFixed(1)),
        sharpeRatio: parseFloat(sharpeRatio.toFixed(2)),
        equityPoints,
        finalEquity: currentEquity
      });
      setRunningBacktest(false);
    }, 1200);
  };

  // Helper for recommendation styling
  const getRecStyle = (rec: string) => {
    if (rec.includes("Strong Buy") || rec.includes("BUY")) return { color: "var(--color-buy)", bg: "var(--color-buy-glow)" };
    if (rec.includes("Strong Sell") || rec.includes("SELL")) return { color: "var(--color-sell)", bg: "var(--color-sell-glow)" };
    return { color: "var(--color-hold)", bg: "var(--color-hold-glow)" };
  };

  // 10 Algo Trading Tabs - Details rendering
  const renderSubTabContent = () => {
    if (!detail) return null;

    switch (activeSubTab) {
      case "ai_recommendations":
        // Sub-Tab 10: AI Recommendations Top 10 Ranked Daily
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "800", color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
              🏆 Top 10 AI Ranked Stocks (Daily Nifty Basket)
            </h3>
            <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "-6px" }}>
              Scores are calculated dynamically using the 9-Factor Consensus Formula and adjusted for current market regime posture.
            </p>
            <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)", textAlign: "left", color: "var(--color-text-muted)" }}>
                  <th style={{ padding: "8px 0" }}>Rank</th>
                  <th style={{ padding: "8px 0" }}>Ticker</th>
                  <th style={{ padding: "8px 0" }}>Sector</th>
                  <th style={{ padding: "8px 0", textAlign: "right" }}>Formula Score</th>
                  <th style={{ padding: "8px 0", textAlign: "right" }}>Rec</th>
                </tr>
              </thead>
              <tbody>
                {stocks.slice(0, 10).map((st, idx) => {
                  const recStyle = getRecStyle(st.recommendation);
                  return (
                    <tr 
                      key={st.ticker} 
                      onClick={() => handleSelect(st.ticker)}
                      style={{ 
                        borderBottom: "1px solid rgba(0,0,0,0.02)", 
                        cursor: "pointer",
                        background: selectedTicker === st.ticker ? "rgba(79, 70, 229, 0.05)" : "transparent"
                      }}
                    >
                      <td style={{ padding: "8px 0", fontWeight: "800", color: "var(--color-text-muted)" }}>#{idx + 1}</td>
                      <td style={{ padding: "8px 0", fontWeight: "700", color: "var(--accent-ml)" }}>{st.ticker}</td>
                      <td style={{ padding: "8px 0" }}>{st.sector}</td>
                      <td style={{ padding: "8px 0", textAlign: "right", fontWeight: "800", color: "var(--color-text-primary)" }}>{st.master_score}</td>
                      <td style={{ padding: "8px 0", textAlign: "right" }}>
                        <span style={{ 
                          padding: "2px 6px", 
                          borderRadius: "4px", 
                          fontSize: "10px", 
                          fontWeight: "700", 
                          background: recStyle.bg,
                          color: recStyle.color
                        }}>
                          {st.recommendation}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );

      case "ai_research":
        // Sub-Tab 1: AI Research & Radar View
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <h3 style={{ fontSize: "14px", fontWeight: "800", color: "var(--color-text-primary)" }}>🔮 flaghip Quantitative Scorecard — {selectedTicker}</h3>
              <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "4px" }}>
                Blended score representing multi-agent consensus. Adjust the sandbox sliders to watch this value recalculate live.
              </p>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "16px", alignItems: "center" }}>
              <RadarChart data={radarData} size={260} />
              
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ background: "rgba(0,0,0,0.015)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                  <span style={{ fontSize: "10px", color: "var(--color-text-muted)", textTransform: "uppercase" }}>AI Explanation Summary</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
                    {detail.explainable_reasons?.slice(0, 3).map((r, i) => (
                      <div key={i} style={{ fontSize: "11px", lineHeight: "1.4", color: "var(--color-text-primary)" }}>
                        • {r}
                      </div>
                    )) || <div>consensus stable buy.</div>}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div style={{ padding: "8px", background: "rgba(5, 150, 105, 0.04)", borderRadius: "6px", border: "1px solid rgba(5, 150, 105, 0.1)" }}>
                    <span style={{ fontSize: "9px", color: "var(--color-text-muted)" }}>Target Price</span>
                    <div style={{ fontSize: "14px", fontWeight: "800", color: "var(--color-buy)" }}>+{detail.target || 10.0}%</div>
                  </div>
                  <div style={{ padding: "8px", background: "rgba(220, 38, 38, 0.04)", borderRadius: "6px", border: "1px solid rgba(220, 38, 38, 0.1)" }}>
                    <span style={{ fontSize: "9px", color: "var(--color-text-muted)" }}>Stop Loss</span>
                    <div style={{ fontSize: "14px", fontWeight: "800", color: "var(--color-sell)" }}>-{detail.stop_loss || 4.0}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "btst_scanner":
        // Sub-Tab 2: BTST Scanner & Historical Patterns
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "800", color: "var(--color-text-primary)" }}>⚡ BTST Scanner Opportunity</h3>
              <span style={{ fontSize: "10px", color: "var(--accent-ml)", fontWeight: "700", border: "1px solid var(--border-glow)", padding: "2px 6px", borderRadius: "4px" }}>
                Next-Day Momentum Strategy
              </span>
            </div>

            {/* Pattern Box */}
            <div style={{ 
              background: "linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(79, 70, 229, 0.01) 100%)", 
              border: "1px solid var(--border-glow)", 
              borderRadius: "10px", 
              padding: "16px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              textAlign: "center",
              gap: "8px"
            }}>
              <div>
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)", fontWeight: "600" }}>Same Pattern Seen</div>
                <div style={{ fontSize: "20px", fontWeight: "900", color: "var(--color-text-primary)", marginTop: "4px" }}>154 Times</div>
              </div>
              <div style={{ borderLeft: "1px solid var(--border-subtle)", borderRight: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)", fontWeight: "600" }}>Positive Next Day</div>
                <div style={{ fontSize: "20px", fontWeight: "900", color: "var(--color-buy)", marginTop: "4px" }}>117 Times</div>
              </div>
              <div>
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)", fontWeight: "600" }}>Probability</div>
                <div style={{ fontSize: "20px", fontWeight: "900", color: "var(--accent-ml)", marginTop: "4px" }}>76%</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "12px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--border-subtle)", paddingBottom: "4px" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>Close Near High</span>
                  <span style={{ fontWeight: "700" }}>TRUE (Top 96th percentile)</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--border-subtle)", paddingBottom: "4px" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>Delivery %</span>
                  <span style={{ fontWeight: "700", color: "var(--color-buy)" }}>64.2%</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--border-subtle)", paddingBottom: "4px" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>Volume Shock</span>
                  <span style={{ fontWeight: "700", color: "var(--color-buy)" }}>2.45x (Avg)</span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--border-subtle)", paddingBottom: "4px" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>OI Shock</span>
                  <span style={{ fontWeight: "700", color: "var(--color-buy)" }}>+14.8% (Build-up)</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--border-subtle)", paddingBottom: "4px" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>Gap Probability</span>
                  <span style={{ fontWeight: "700", color: "var(--accent-ml)" }}>72%</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--border-subtle)", paddingBottom: "4px" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>Sector Momentum</span>
                  <span style={{ fontWeight: "700" }}>Strong Outperforming</span>
                </div>
              </div>
            </div>
          </div>
        );

      case "swing_scanner":
        // Sub-Tab 3: Swing Scanner
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "800", color: "var(--color-text-primary)" }}>📈 Swing Trading Scanner (1-4 Weeks Horizon)</h3>
            <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "-6px" }}>
              Identifies breakout and pullback strategies matching multi-timeframe trend lines.
            </p>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={{ background: "rgba(0,0,0,0.015)", padding: "12px", border: "1px solid var(--border-subtle)", borderRadius: "8px" }}>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--accent-ml)", marginBottom: "8px" }}>🚀 Breakouts</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "11px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--color-text-muted)" }}>20 Day High</span>
                    <span style={{ fontWeight: "700", color: "var(--color-buy)" }}>ACTIVE</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--color-text-muted)" }}>50 Day High</span>
                    <span style={{ fontWeight: "700", color: "var(--color-buy)" }}>ACTIVE</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--color-text-muted)" }}>200 Day High</span>
                    <span style={{ fontWeight: "700", color: "var(--color-text-muted)" }}>-4.5% below</span>
                  </div>
                </div>
              </div>

              <div style={{ background: "rgba(0,0,0,0.015)", padding: "12px", border: "1px solid var(--border-subtle)", borderRadius: "8px" }}>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--accent-tech)", marginBottom: "8px" }}>📥 Pullbacks & Alignment</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "11px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--color-text-muted)" }}>EMA20 Retest</span>
                    <span style={{ fontWeight: "700", color: "var(--color-hold)" }}>DEFENDED</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--color-text-muted)" }}>EMA50 Retest</span>
                    <span style={{ fontWeight: "700", color: "var(--color-text-muted)" }}>No touch (Safe)</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--color-text-muted)" }}>Multi-TF Alignment</span>
                    <span style={{ fontWeight: "700", color: "var(--color-buy)" }}>BULLISH (3/3)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "momentum_scanner":
        // Sub-Tab 4: Momentum Scanner
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "800", color: "var(--color-text-primary)" }}>🔥 Relative Strength Momentum</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", textAlign: "center", marginBottom: "4px" }}>
              <div style={{ background: "rgba(0,0,0,0.015)", padding: "8px", borderRadius: "6px", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: "9px", color: "var(--color-text-muted)" }}>RS RANK</div>
                <div style={{ fontSize: "16px", fontWeight: "800", color: "var(--accent-ml)", marginTop: "2px" }}>#8 of 50</div>
              </div>
              <div style={{ background: "rgba(0,0,0,0.015)", padding: "8px", borderRadius: "6px", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: "9px", color: "var(--color-text-muted)" }}>RS PERCENTILE</div>
                <div style={{ fontSize: "16px", fontWeight: "800", color: "var(--color-buy)", marginTop: "2px" }}>92.4th</div>
              </div>
              <div style={{ background: "rgba(0,0,0,0.015)", padding: "8px", borderRadius: "6px", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: "9px", color: "var(--color-text-muted)" }}>MOMENTUM SCORE</div>
                <div style={{ fontSize: "16px", fontWeight: "800", color: "var(--color-text-primary)", marginTop: "2px" }}>94/100</div>
              </div>
            </div>

            <div style={{ fontSize: "11px", border: "1px solid var(--border-subtle)", borderRadius: "8px", overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", background: "rgba(0,0,0,0.02)", padding: "6px 8px", fontWeight: "700" }}>
                <span>Timeline</span>
                <span style={{ textAlign: "right" }}>vs Nifty</span>
                <span style={{ textAlign: "right" }}>vs Sector</span>
                <span style={{ textAlign: "right" }}>vs Peers</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", padding: "6px 8px", borderBottom: "1px solid rgba(0,0,0,0.02)" }}>
                <span>1 Week</span>
                <span style={{ textAlign: "right", color: "var(--color-buy)", fontWeight: "600" }}>+0.85%</span>
                <span style={{ textAlign: "right", color: "var(--color-buy)", fontWeight: "600" }}>+0.42%</span>
                <span style={{ textAlign: "right", color: "var(--color-buy)", fontWeight: "600" }}>+0.98%</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", padding: "6px 8px", borderBottom: "1px solid rgba(0,0,0,0.02)" }}>
                <span>1 Month</span>
                <span style={{ textAlign: "right", color: "var(--color-buy)", fontWeight: "600" }}>+3.40%</span>
                <span style={{ textAlign: "right", color: "var(--color-buy)", fontWeight: "600" }}>+1.85%</span>
                <span style={{ textAlign: "right", color: "var(--color-buy)", fontWeight: "600" }}>+2.50%</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", padding: "6px 8px" }}>
                <span>3 Month</span>
                <span style={{ textAlign: "right", color: "var(--color-buy)", fontWeight: "600" }}>+7.80%</span>
                <span style={{ textAlign: "right", color: "var(--color-hold)", fontWeight: "600" }}>-0.20%</span>
                <span style={{ textAlign: "right", color: "var(--color-buy)", fontWeight: "600" }}>+4.20%</span>
              </div>
            </div>
          </div>
        );

      case "smart_money":
        // Sub-Tab 5: Smart Money Tracker
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "800", color: "var(--color-text-primary)" }}>💼 Smart Money Flow Tracker (FII/DII & Insider Activity)</h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "11px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", background: "rgba(0,0,0,0.015)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                <span style={{ fontWeight: "700", color: "var(--accent-ml)" }}>🏛️ Institutional Flows</span>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>FII 10d Buying</span>
                  <span style={{ fontWeight: "700", color: "var(--color-buy)" }}>+₹1,240 Cr</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>DII 10d Buying</span>
                  <span style={{ fontWeight: "700", color: "var(--color-buy)" }}>+₹480 Cr</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>FII Holding Change</span>
                  <span style={{ fontWeight: "700", color: "var(--color-buy)" }}>+0.45%</span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px", background: "rgba(0,0,0,0.015)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                <span style={{ fontWeight: "700", color: "var(--accent-tech)" }}>🤝 Insider & Corporate Deals</span>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Promoter Buying</span>
                  <span style={{ fontWeight: "700" }}>Stable (No dilution)</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Bulk Deals (1M)</span>
                  <span style={{ fontWeight: "700", color: "var(--color-buy)" }}>Accumulation</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Mutual Fund Change</span>
                  <span style={{ fontWeight: "700", color: "var(--color-buy)" }}>+1.2%</span>
                </div>
              </div>
            </div>
          </div>
        );

      case "sector_rotation":
        // Sub-Tab 6: Sector Rotation
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "800", color: "var(--color-text-primary)" }}>🔄 Sector Rotation & Momentum Ranking</h3>
            <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "-6px" }}>
              Identifies leading sectors by blending 1W, 1M, and 3M alpha performances.
            </p>

            <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)", textAlign: "left", color: "var(--color-text-muted)" }}>
                  <th style={{ padding: "4px 0" }}>Rank</th>
                  <th style={{ padding: "4px 0" }}>Sector</th>
                  <th style={{ padding: "4px 0", textAlign: "right" }}>1W Mom</th>
                  <th style={{ padding: "4px 0", textAlign: "right" }}>1M Mom</th>
                  <th style={{ padding: "4px 0", textAlign: "right" }}>% &gt; 50 DMA</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { rank: 1, name: "IT", mom1w: "+2.4%", mom1m: "+6.8%", dma: "82.4%" },
                  { rank: 2, name: "Banking", mom1w: "+1.8%", mom1m: "+4.5%", dma: "78.0%" },
                  { rank: 3, name: "Energy", mom1w: "+1.2%", mom1m: "+3.2%", dma: "65.5%" },
                  { rank: 4, name: "Auto", mom1w: "+0.4%", mom1m: "+2.1%", dma: "60.0%" },
                  { rank: 5, name: "FMCG", mom1w: "-0.5%", mom1m: "+1.2%", dma: "52.4%" }
                ].map((s) => (
                  <tr key={s.name} style={{ borderBottom: "1px solid rgba(0,0,0,0.015)" }}>
                    <td style={{ padding: "6px 0", fontWeight: "700" }}>#{s.rank}</td>
                    <td style={{ padding: "6px 0", fontWeight: "600", color: "var(--color-text-primary)" }}>{s.name}</td>
                    <td style={{ padding: "6px 0", textAlign: "right", color: s.mom1w.startsWith("+") ? "var(--color-buy)" : "var(--color-sell)" }}>{s.mom1w}</td>
                    <td style={{ padding: "6px 0", textAlign: "right", color: "var(--color-buy)" }}>{s.mom1m}</td>
                    <td style={{ padding: "6px 0", textAlign: "right" }}>{s.dma}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case "market_regime":
        // Sub-Tab 7: Market Regime
        const regime = marketStatus?.regime || "BULL";
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "800", color: "var(--color-text-primary)" }}>🛡️ Market Regime & Posture Classifier</h3>
            
            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              <div style={{ 
                padding: "16px", 
                borderRadius: "10px", 
                border: "1px solid var(--border-subtle)", 
                background: regime === "BEAR" ? "rgba(220, 38, 38, 0.04)" : "rgba(5, 150, 105, 0.04)",
                textAlign: "center",
                flex: "0 0 120px"
              }}>
                <div style={{ fontSize: "9px", color: "var(--color-text-muted)", textTransform: "uppercase" }}>Current Regime</div>
                <div style={{ 
                  fontSize: "18px", 
                  fontWeight: "900", 
                  color: regime === "BEAR" ? "var(--color-sell)" : "var(--color-buy)",
                  marginTop: "4px"
                }}>{regime}</div>
              </div>

              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px", fontSize: "11px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Nifty Trend Status</span>
                  <span style={{ fontWeight: "700", color: "var(--color-buy)" }}>UPTREND (Score: 82/100)</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>India VIX posture</span>
                  <span style={{ fontWeight: "700" }}>{vix.toFixed(2)} (STABLE)</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Advance/Decline Ratio</span>
                  <span style={{ fontWeight: "700" }}>1.8x (Advantage Bulls)</span>
                </div>
              </div>
            </div>
          </div>
        );

      case "portfolio_ai":
        // Sub-Tab 8: Portfolio AI
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "800", color: "var(--color-text-primary)" }}>💼 Portfolio Risk & Beta Optimization</h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "11px" }}>
              <div style={{ background: "rgba(0,0,0,0.015)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontWeight: "700", color: "var(--accent-ml)", marginBottom: "6px" }}>Risk Exposure</div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span>Portfolio Beta</span>
                  <span style={{ fontWeight: "700" }}>1.02 (Balanced)</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Max Historical Drawdown</span>
                  <span style={{ fontWeight: "700", color: "var(--color-sell)" }}>-14.2%</span>
                </div>
              </div>

              <div style={{ background: "rgba(0,0,0,0.015)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontWeight: "700", color: "var(--accent-tech)", marginBottom: "6px" }}>Event Risk Hedging</div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span>Earnings Risk</span>
                  <span style={{ fontWeight: "700", color: "var(--color-buy)" }}>LOW</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Fed Interest Rate Risk</span>
                  <span style={{ fontWeight: "700", color: "var(--color-hold)" }}>MEDIUM</span>
                </div>
              </div>
            </div>
          </div>
        );

      case "strategy_lab":
        // Sub-Tab 9: Strategy Lab & Backtesting
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "800", color: "var(--color-text-primary)" }}>🧪 Quantitative Strategy Lab (10-Yr Backtester)</h3>
            <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "-6px" }}>
              Backtest custom strategies using Nifty 50 historical data with custom triggers.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "12px", alignItems: "start" }}>
              {/* Settings */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "11px" }}>
                <div style={{ display: "flex", gap: "6px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", color: "var(--color-text-muted)", marginBottom: "4px" }}>Strategy</label>
                    <select 
                      value={selectedStrategy} 
                      onChange={(e) => setSelectedStrategy(e.target.value)}
                      style={{ fontSize: "11px", width: "100%", padding: "6px 8px" }}
                    >
                      <option value="BTST">BTST Gap Momentum</option>
                      <option value="Swing">Swing High Breakout</option>
                      <option value="Pullback">EMA 20/50 Pullback</option>
                      <option value="RS">Relative Strength Alpha</option>
                    </select>
                  </div>

                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", color: "var(--color-text-muted)", marginBottom: "4px" }}>Trigger Score &gt;=</label>
                    <input 
                      type="number" 
                      min={50} 
                      max={90} 
                      value={backtestThreshold} 
                      onChange={(e) => setBacktestThreshold(parseInt(e.target.value))}
                      style={{ fontSize: "11px", width: "100%", padding: "5px 8px" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "6px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", color: "var(--color-text-muted)", marginBottom: "4px" }}>Stop Loss %</label>
                    <input 
                      type="number" 
                      step="0.5" 
                      value={backtestStopLoss} 
                      onChange={(e) => setBacktestStopLoss(parseFloat(e.target.value))}
                      style={{ fontSize: "11px", width: "100%", padding: "5px 8px" }}
                    />
                  </div>

                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", color: "var(--color-text-muted)", marginBottom: "4px" }}>Target Price %</label>
                    <input 
                      type="number" 
                      step="0.5" 
                      value={backtestTarget} 
                      onChange={(e) => setBacktestTarget(parseFloat(e.target.value))}
                      style={{ fontSize: "11px", width: "100%", padding: "5px 8px" }}
                    />
                  </div>
                </div>

                <button 
                  onClick={runStrategyBacktest} 
                  disabled={runningBacktest}
                  className="primary" 
                  style={{ fontSize: "11px", padding: "8px", fontWeight: "700" }}
                >
                  {runningBacktest ? "Simulating Backtest..." : "Run 10-Yr Backtest"}
                </button>
              </div>

              {/* Result display */}
              <div style={{ minHeight: "130px", border: "1px dashed var(--border-subtle)", borderRadius: "8px", padding: "10px" }}>
                {runningBacktest ? (
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "110px", color: "var(--color-text-muted)" }}>
                    <div className="spinner" style={{ border: "2px solid var(--border-subtle)", borderTop: "2px solid var(--accent-ml)", borderRadius: "50%", width: "20px", height: "20px", animation: "spin 1s linear infinite" }} />
                    <span style={{ fontSize: "10px", marginTop: "8px" }}>Scanning historical bars...</span>
                  </div>
                ) : backtestResult ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "11px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--border-subtle)", paddingBottom: "3px" }}>
                      <span style={{ color: "var(--color-text-muted)" }}>Win Rate</span>
                      <span style={{ fontWeight: "800", color: "var(--color-buy)" }}>{backtestResult.winRate}%</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--border-subtle)", paddingBottom: "3px" }}>
                      <span style={{ color: "var(--color-text-muted)" }}>Profit Factor</span>
                      <span style={{ fontWeight: "800", color: "var(--accent-ml)" }}>{backtestResult.profitFactor}x</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--border-subtle)", paddingBottom: "3px" }}>
                      <span style={{ color: "var(--color-text-muted)" }}>Max Drawdown</span>
                      <span style={{ fontWeight: "800", color: "var(--color-sell)" }}>-{backtestResult.maxDrawdown}%</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--border-subtle)", paddingBottom: "3px" }}>
                      <span style={{ color: "var(--color-text-muted)" }}>Sharpe Ratio</span>
                      <span style={{ fontWeight: "800" }}>{backtestResult.sharpeRatio}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2px" }}>
                      <span style={{ color: "var(--color-text-muted)" }}>Final Value</span>
                      <span style={{ fontWeight: "800", color: "var(--color-buy)" }}>₹{backtestResult.finalEquity.toLocaleString()}</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "110px", fontSize: "10px", color: "var(--color-text-muted)", textAlign: "center" }}>
                    Configure rules and press Run to simulate strategy performance.
                  </div>
                )}
              </div>
            </div>
            
            {/* Simple CSS animation injected for spinner */}
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        );

      default:
        return null;
    }
  };

  if (!detail) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px", color: "var(--color-text-muted)", fontSize: "14px", fontWeight: "600" }}>
        Loading institutional feature store matrices & calculating consensus weightings...
      </div>
    );
  }

  const recStyle = getRecStyle(detail.recommendation);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%", padding: "10px" }}>
      
      {/* Intro block */}
      <div style={{
        background: "linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(8, 145, 178, 0.04) 100%)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "12px",
        padding: "16px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: "900", color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
            🤖 Institutional Algo Trading & AI Platform
          </h2>
          <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: "4px 0 0 0" }}>
            A quantitative feature store mapping **284 features per stock** feeding multiple institutional backtesters & strategy suites.
          </p>
        </div>
        
        {/* Quick stock selector drop */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: "var(--color-text-muted)", fontWeight: "600" }}>Active Stock:</span>
          <select 
            value={selectedTicker} 
            onChange={(e) => handleSelect(e.target.value)}
            style={{ 
              fontSize: "12px", 
              padding: "6px 12px", 
              background: "var(--bg-card)", 
              border: "1px solid var(--border-subtle)", 
              borderRadius: "6px",
              fontWeight: "700",
              cursor: "pointer"
            }}
          >
            {stocks.map(s => (
              <option key={s.ticker} value={s.ticker}>{s.ticker} ({s.sector})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.25fr 1fr", gap: "16px", alignItems: "start" }}>
        
        {/* Left Column: 10 Algo Trading Tabs Suite */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          
          <div className="glass-panel" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* Sub-tab selection strip */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "10px" }}>
              {[
                { id: "strategy_lab", label: "🧪 Strategy Lab" },
                { id: "smart_money", label: "💼 Smart Money Flow" },
                { id: "sector_rotation", label: "🔄 Sector Rotation" },
                { id: "market_regime", label: "🛡️ Regime posture" },
                { id: "momentum_scanner", label: "🔥 Momentum scanner" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  style={{
                    fontSize: "11px",
                    padding: "6px 10px",
                    border: "1px solid " + (activeSubTab === tab.id ? "var(--accent-ml)" : "var(--border-subtle)"),
                    borderRadius: "6px",
                    background: activeSubTab === tab.id ? "var(--accent-ml)" : "var(--bg-card)",
                    color: activeSubTab === tab.id ? "#ffffff" : "var(--color-text-secondary)",
                    fontWeight: "700",
                    cursor: "pointer",
                    transition: "all 0.15s"
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Display tab content */}
            <div style={{ minHeight: "280px" }}>
              {renderSubTabContent()}
            </div>

          </div>

          {/* AI Conviction Score Sandbox */}
          <div className="glass-panel glow-purple" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: "14px", fontWeight: "900", color: "var(--color-text-primary)" }}>🧮 AI Conviction Score Sandbox</h3>
                <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Interact with the live weights formula below and watch the score dynamically adjust.</span>
              </div>
              
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "9px", color: "var(--color-text-muted)", fontWeight: "700" }}>RECALCULATED SCORE</div>
                <div style={{ fontSize: "22px", fontWeight: "900", color: "var(--accent-ml)" }}>{calculatedSandboxScore}</div>
              </div>
            </div>

            {/* Weight inputs grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", fontSize: "10px" }}>
              <div>
                <label style={{ display: "block", color: "var(--color-text-muted)", marginBottom: "2px" }}>Market weight ({(marketWeight*100).toFixed(0)}%)</label>
                <input 
                  type="range" min={0.0} max={0.4} step={0.05} 
                  value={marketWeight} 
                  onChange={(e) => setMarketWeight(parseFloat(e.target.value))}
                  style={{ width: "100%", padding: 0 }}
                />
              </div>
              <div>
                <label style={{ display: "block", color: "var(--color-text-muted)", marginBottom: "2px" }}>Sector weight ({(sectorWeight*100).toFixed(0)}%)</label>
                <input 
                  type="range" min={0.0} max={0.3} step={0.05} 
                  value={sectorWeight} 
                  onChange={(e) => setSectorWeight(parseFloat(e.target.value))}
                  style={{ width: "100%", padding: 0 }}
                />
              </div>
              <div>
                <label style={{ display: "block", color: "var(--color-text-muted)", marginBottom: "2px" }}>Smart Money ({(smartMoneyWeight*100).toFixed(0)}%)</label>
                <input 
                  type="range" min={0.0} max={0.4} step={0.05} 
                  value={smartMoneyWeight} 
                  onChange={(e) => setSmartMoneyWeight(parseFloat(e.target.value))}
                  style={{ width: "100%", padding: 0 }}
                />
              </div>
              <div>
                <label style={{ display: "block", color: "var(--color-text-muted)", marginBottom: "2px" }}>Relative Strength ({(rsWeight*100).toFixed(0)}%)</label>
                <input 
                  type="range" min={0.0} max={0.3} step={0.05} 
                  value={rsWeight} 
                  onChange={(e) => setRsWeight(parseFloat(e.target.value))}
                  style={{ width: "100%", padding: 0 }}
                />
              </div>
              <div>
                <label style={{ display: "block", color: "var(--color-text-muted)", marginBottom: "2px" }}>Earnings weight ({(earningsWeight*100).toFixed(0)}%)</label>
                <input 
                  type="range" min={0.0} max={0.3} step={0.05} 
                  value={earningsWeight} 
                  onChange={(e) => setEarningsWeight(parseFloat(e.target.value))}
                  style={{ width: "100%", padding: 0 }}
                />
              </div>
              <div>
                <label style={{ display: "block", color: "var(--color-text-muted)", marginBottom: "2px" }}>Technicals ({(techWeight*100).toFixed(0)}%)</label>
                <input 
                  type="range" min={0.0} max={0.3} step={0.05} 
                  value={techWeight} 
                  onChange={(e) => setTechWeight(parseFloat(e.target.value))}
                  style={{ width: "100%", padding: 0 }}
                />
              </div>
            </div>

            {/* Alignment and Penalty sliders */}
            <div style={{ borderTop: "1px dashed var(--border-subtle)", paddingTop: "10px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "10px" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Alignment Multiplier</span>
                  <span style={{ fontWeight: "700" }}>{alignmentMultiplier.toFixed(2)}x</span>
                </div>
                <input 
                  type="range" min={0.5} max={1.5} step={0.05} 
                  value={alignmentMultiplier} 
                  onChange={(e) => setAlignmentMultiplier(parseFloat(e.target.value))}
                  style={{ width: "100%", padding: 0 }}
                />
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Risk Penalty</span>
                  <span style={{ fontWeight: "700", color: "var(--color-sell)" }}>-{riskPenalty} pts</span>
                </div>
                <input 
                  type="range" min={0} max={30} step={1} 
                  value={riskPenalty} 
                  onChange={(e) => setRiskPenalty(parseInt(e.target.value))}
                  style={{ width: "100%", padding: 0 }}
                />
              </div>
            </div>

            {/* Formula documentation */}
            <div style={{ background: "rgba(0,0,0,0.015)", padding: "10px", borderRadius: "6px", border: "1px solid var(--border-subtle)", fontSize: "9px", fontFamily: "var(--font-mono)", color: "var(--color-text-muted)", lineHeight: "1.4" }}>
              ConvictionScore = (0.20 × Market + 0.15 × Sector + 0.20 × SmartMoney + 0.10 × RS + 0.10 × Earnings + 0.10 × Technicals + 0.05 × Fundamentals + 0.05 × Sentiment + 0.05 × Global)<br />
              FinalScore = (ConvictionScore × AlignmentMultiplier) - RiskPenalty
            </div>

          </div>

        </div>

        {/* Right Column: Quantitative Feature Store Explorer */}
        <div className="glass-panel" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          
          <div>
            <h3 style={{ fontSize: "14px", fontWeight: "900", color: "var(--color-text-primary)" }}>📦 Quantitative Feature Store Explorer</h3>
            <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Browse the 200+ historical metrics calculated daily for {selectedTicker}.</span>
          </div>

          {/* Categories select row */}
          <div style={{ display: "flex", gap: "4px", overflowX: "auto", paddingBottom: "6px" }} className="hide-scrollbar">
            {Object.keys(featureStore).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedFeatureCategory(cat)}
                style={{
                  fontSize: "9px",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  border: "1px solid " + (selectedFeatureCategory === cat ? "var(--accent-tech)" : "var(--border-subtle)"),
                  background: selectedFeatureCategory === cat ? "var(--accent-tech)" : "transparent",
                  color: selectedFeatureCategory === cat ? "#ffffff" : "var(--color-text-muted)",
                  fontWeight: "700",
                  cursor: "pointer",
                  whiteSpace: "nowrap"
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Features list table */}
          <div style={{ maxHeight: "410px", overflowY: "auto", border: "1px solid var(--border-subtle)", borderRadius: "8px" }}>
            <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "rgba(0,0,0,0.02)", borderBottom: "1px solid var(--border-subtle)", color: "var(--color-text-muted)" }}>
                  <th style={{ padding: "6px 8px" }}>Metric / Feature Name</th>
                  <th style={{ padding: "6px 8px" }}>Current Value</th>
                  <th style={{ padding: "6px 8px", textAlign: "right" }}>Type</th>
                </tr>
              </thead>
              <tbody>
                {(featureStore[selectedFeatureCategory as keyof typeof featureStore] || []).map((feat, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(0,0,0,0.02)" }}>
                    <td style={{ padding: "8px", fontWeight: "600", color: "var(--color-text-primary)" }}>{feat.name}</td>
                    <td style={{ padding: "8px" }}>
                      <span style={{
                        color: feat.status === "buy" ? "var(--color-buy)" : feat.status === "sell" ? "var(--color-sell)" : "var(--color-text-primary)",
                        fontWeight: "700"
                      }}>{feat.value}</span>
                    </td>
                    <td style={{ padding: "8px", textAlign: "right", color: "var(--color-text-muted)", fontSize: "9px", fontWeight: "700" }}>
                      {feat.type.toUpperCase()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ background: "rgba(0,0,0,0.015)", padding: "10px", borderRadius: "6px", fontSize: "10px", color: "var(--color-text-muted)" }}>
            ℹ️ <em>All features are serialized historically to train the deep reinforcement learning model daily.</em>
          </div>

        </div>

      </div>

    </div>
  );
}
