from abc import ABC, abstractmethod
import pandas as pd
import numpy as np
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Tuple

@dataclass
class PredictionPoint:
    date: str
    predicted: float
    lower_80: float
    upper_80: float
    lower_95: float
    upper_95: float

@dataclass
class ModelMetrics:
    mae: float
    rmse: float
    mape: float
    smape: float

@dataclass
class ForecastResult:
    model_name: str
    model_key: str
    metrics: ModelMetrics
    predictions: List[PredictionPoint]
    residuals_std: float
    params_summary: Dict[str, Any]
    explainability: Dict[str, Any]

def calc_mae(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    return float(np.mean(np.abs(y_true - y_pred)))

def calc_rmse(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    return float(np.sqrt(np.mean((y_true - y_pred) ** 2)))

def calc_mape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Zero-safe Mean Absolute Percentage Error (%)"""
    denom = np.abs(y_true)
    # Avoid division by zero
    mask = denom < 1e-5
    if np.all(mask):
        return calc_smape(y_true, y_pred)
    
    # Epsilon replacement for near-zero values
    denom_safe = np.where(mask, np.mean(denom[~mask]) if np.any(~mask) else 1.0, denom)
    mape = np.mean(np.abs((y_true - y_pred) / denom_safe)) * 100.0
    return float(min(1000.0, mape))

def calc_smape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Symmetric Mean Absolute Percentage Error (%)"""
    denom = (np.abs(y_true) + np.abs(y_pred)) / 2.0
    denom_safe = np.where(denom < 1e-5, 1e-5, denom)
    smape = np.mean(np.abs(y_true - y_pred) / denom_safe) * 100.0
    return float(min(100.0, smape))

class BaseForecaster(ABC):
    def __init__(self, model_key: str, model_name: str):
        self.model_key = model_key
        self.model_name = model_name
        self.fitted = False
        self.df_train: Optional[pd.DataFrame] = None
        self.date_col: str = ""
        self.target_col: str = ""
        self.residuals: np.ndarray = np.array([])
        self.residual_std: float = 0.0

    @abstractmethod
    def fit(self, df: pd.DataFrame, date_col: str, target_col: str) -> None:
        pass

    @abstractmethod
    def predict(self, horizon: int) -> ForecastResult:
        pass

    def compute_residual_bands(self, point_preds: np.ndarray, z_score: float) -> Tuple[np.ndarray, np.ndarray]:
        """Calculates prediction upper and lower confidence bounds based on residual variance."""
        std = max(1e-4, self.residual_std)
        # Expanding horizon variance scaling
        step_scaling = np.sqrt(np.arange(1, len(point_preds) + 1))
        margin = z_score * std * step_scaling
        lower = point_preds - margin
        upper = point_preds + margin
        return lower, upper
