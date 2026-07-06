from abc import ABC, abstractmethod
import pandas as pd
from typing import Dict, Any, List

class BaseAgent(ABC):
    def __init__(self, name: str, weight: float):
        self.name = name
        self.weight = weight

    @abstractmethod
    def analyze(self, ticker: str, data: Dict[str, pd.DataFrame], context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Runs the analysis for the specific stock.
        
        Args:
            ticker: The stock ticker (e.g. RELIANCE)
            data: Dictionary of dataframes, e.g.
                {
                    "stock_daily": DataFrame,
                    "macro_indices": DataFrame,
                    "nifty_sectors": DataFrame,
                    "news_feed": DataFrame
                }
            context: Shared state, including the detected Market Regime
            
        Returns:
            Dict containing:
                "score": float (0 to 100)
                "confidence": float (0 to 1)
                "reasoning": List[str]
                "metrics": Dict[str, Any]
        """
        pass
