import numpy as np
import pandas as pd

def calculate_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """
    Calculates technical indicators for a given stock dataframe.
    Requires columns: Open, High, Low, Close, Volume
    """
    df = df.copy()
    close = df['Close']
    high = df['High']
    low = df['Low']
    volume = df['Volume']

    # --- TREND INDICATORS ---
    df['EMA_20'] = close.ewm(span=20, adjust=False).mean()
    df['EMA_50'] = close.ewm(span=50, adjust=False).mean()
    df['EMA_100'] = close.ewm(span=100, adjust=False).mean()
    df['EMA_200'] = close.ewm(span=200, adjust=False).mean()
    
    df['SMA_50'] = close.rolling(window=50).mean().bfill()
    df['SMA_200'] = close.rolling(window=200).mean().bfill()

    # Average True Range (ATR) - Needed for SuperTrend, ADX, and Volatility
    high_low = high - low
    high_close = (high - close.shift()).abs()
    low_close = (low - close.shift()).abs()
    tr = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
    df['ATR_14'] = tr.rolling(window=14).mean().bfill()

    # SuperTrend (7, 3)
    factor = 3
    period = 7
    hl2 = (high + low) / 2
    atr_s = tr.rolling(window=period).mean().bfill()
    
    basic_ub = hl2 + (factor * atr_s)
    basic_lb = hl2 - (factor * atr_s)
    
    final_ub = basic_ub.copy()
    final_lb = basic_lb.copy()
    
    supertrend = np.zeros(len(df))
    direction = np.zeros(len(df)) # 1 for up, -1 for down
    
    for i in range(1, len(df)):
        # Upper band
        if basic_ub[i] < final_ub[i-1] or close[i-1] > final_ub[i-1]:
            final_ub[i] = basic_ub[i]
        else:
            final_ub[i] = final_ub[i-1]
            
        # Lower band
        if basic_lb[i] > final_lb[i-1] or close[i-1] < final_lb[i-1]:
            final_lb[i] = basic_lb[i]
        else:
            final_lb[i] = final_lb[i-1]
            
        # Direction
        if i == 1:
            direction[i] = 1 if close[i] > final_ub[i] else -1
        else:
            if direction[i-1] == 1:
                direction[i] = 1 if close[i] > final_lb[i] else -1
            else:
                direction[i] = -1 if close[i] < final_ub[i] else 1
                
        supertrend[i] = final_lb[i] if direction[i] == 1 else final_ub[i]
        
    df['SuperTrend'] = supertrend
    df['SuperTrend_Direction'] = direction

    # ADX (14)
    up_move = high.diff()
    down_move = low.shift() - low
    plus_dm = np.where((up_move > down_move) & (up_move > 0), up_move, 0)
    minus_dm = np.where((down_move > up_move) & (down_move > 0), down_move, 0)
    
    plus_di = 100 * (pd.Series(plus_dm).rolling(14).mean().bfill() / df['ATR_14'])
    minus_di = 100 * (pd.Series(minus_dm).rolling(14).mean().bfill() / df['ATR_14'])
    dx = 100 * (plus_di - minus_di).abs() / (plus_di + minus_di + 1e-10)
    df['ADX_14'] = dx.rolling(14).mean().bfill()
    df['Plus_DI'] = plus_di
    df['Minus_DI'] = minus_di

    # --- MOMENTUM INDICATORS ---
    # RSI (14)
    delta = close.diff()
    gain = delta.where(delta > 0, 0.0)
    loss = -delta.where(delta < 0, 0.0)
    avg_gain = gain.rolling(window=14).mean().bfill()
    avg_loss = loss.rolling(window=14).mean().bfill()
    rs = avg_gain / (avg_loss + 1e-10)
    df['RSI_14'] = 100 - (100 / (1 + rs))

    # MACD (12, 26, 9)
    ema12 = close.ewm(span=12, adjust=False).mean()
    ema26 = close.ewm(span=26, adjust=False).mean()
    df['MACD'] = ema12 - ema26
    df['MACD_Signal'] = df['MACD'].ewm(span=9, adjust=False).mean()
    df['MACD_Hist'] = df['MACD'] - df['MACD_Signal']

    # Stochastic RSI (14)
    rsi = df['RSI_14']
    min_rsi = rsi.rolling(window=14).min()
    max_rsi = rsi.rolling(window=14).max()
    df['StochRSI'] = ((rsi - min_rsi) / (max_rsi - min_rsi + 1e-10)).fillna(0.5)

    # ROC (10) and Momentum
    df['ROC_10'] = (((close - close.shift(10)) / (close.shift(10) + 1e-10)) * 100).fillna(0.0)
    df['Momentum'] = (close - close.shift(10)).fillna(0.0)

    # --- VOLATILITY INDICATORS ---
    # Bollinger Bands (20, 2) & BB Width
    df['BB_Mid'] = close.rolling(window=20).mean().bfill()
    std20 = close.rolling(window=20).std().bfill()
    df['BB_Upper'] = df['BB_Mid'] + 2 * std20
    df['BB_Lower'] = df['BB_Mid'] - 2 * std20
    df['BB_Width'] = ((df['BB_Upper'] - df['BB_Lower']) / (df['BB_Mid'] + 1e-10)).fillna(0.05)

    # Historical Volatility (20-day annualized std of returns)
    log_returns = np.log(close / close.shift(1)).fillna(0.0)
    df['HistVol_20'] = (log_returns.rolling(window=20).std() * np.sqrt(252) * 100).fillna(15.0)

    # --- RELATIVE RETURNS ---
    df['Return_1W'] = (((close - close.shift(5)) / (close.shift(5) + 1e-10)) * 100).fillna(0.0)
    df['Return_1M'] = (((close - close.shift(21)) / (close.shift(21) + 1e-10)) * 100).fillna(0.0)
    df['Return_3M'] = (((close - close.shift(63)) / (close.shift(63) + 1e-10)) * 100).fillna(0.0)
    df['Return_6M'] = (((close - close.shift(126)) / (close.shift(126) + 1e-10)) * 100).fillna(0.0)
    df['Return_1Y'] = (((close - close.shift(252)) / (close.shift(252) + 1e-10)) * 100).fillna(0.0)

    # --- VOLUME INTELLIGENCE ---
    df['OBV'] = (np.sign(close.diff().fillna(0)) * volume).cumsum()
    
    typical_price = (high + low + close) / 3
    df['VWAP'] = (typical_price * volume).cumsum() / (volume.cumsum() + 1e-10)

    raw_money_flow = typical_price * volume
    diff = typical_price.diff()
    pos_flow = raw_money_flow.where(diff > 0, 0.0).rolling(window=14).sum().bfill()
    neg_flow = raw_money_flow.where(diff < 0, 0.0).rolling(window=14).sum().bfill()
    mfr = pos_flow / (neg_flow + 1e-10)
    df['MFI_14'] = 100 - (100 / (1 + mfr))

    # Volume relative indicators
    vol_mean_20 = volume.rolling(window=20).mean().bfill()
    df['RelativeVolume'] = (volume / (vol_mean_20 + 1e-10)).fillna(1.0)
    df['VolumeBreakout'] = (df['RelativeVolume'] > 2.0).astype(float)
    
    vol_ema_5 = volume.ewm(span=5, adjust=False).mean()
    vol_ema_20 = volume.ewm(span=20, adjust=False).mean()
    df['VolumeTrend'] = (vol_ema_5 > vol_ema_20).astype(float)

    # Fill remaining NaNs if any
    df = df.ffill().bfill()
    return df
