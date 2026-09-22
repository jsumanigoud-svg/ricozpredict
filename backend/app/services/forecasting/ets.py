import pandas as pd
import numpy as np
from statsmodels.tsa.holtwinters import ExponentialSmoothing, SimpleExpSmoothing
from .base import BaseForecaster, ForecastResult, PredictionPoint, ModelMetrics, calc_mae, calc_rmse, calc_mape, calc_smape

class ETSForecaster(BaseForecaster):
    def __init__(self):
        super().__init__(model_key="ets", model_name="Exponential Smoothing (ETS)")
        self.fitted_model = None

    def fit(self, df: pd.DataFrame, date_col: str, target_col: str) -> None:
        self.df_train = df.copy()
        self.date_col = date_col
        self.target_col = target_col

        series = df[target_col].values.astype(float)
        n = len(series)

        # Determine trend & seasonal parameters based on series length
        seasonal_periods = 7 if n >= 21 else (12 if n >= 24 else None)
        trend_type = "add" if n >= 10 else None
        seasonal_type = "add" if (seasonal_periods and n >= 2 * seasonal_periods) else None

        try:
            if trend_type or seasonal_type:
                model = ExponentialSmoothing(
                    series,
                    trend=trend_type,
                    seasonal=seasonal_type,
                    seasonal_periods=seasonal_periods,
                    initialization_method="estimated"
                )
            else:
                model = SimpleExpSmoothing(series, initialization_method="estimated")
            
            self.fitted_model = model.fit(optimized=True)
            fitted_values = self.fitted_model.fittedvalues
            self.residuals = series - fitted_values
            self.residual_std = float(np.std(self.residuals)) if len(self.residuals) > 1 else 1.0
        except Exception:
            # Fallback to Simple Exponential Smoothing
            model = SimpleExpSmoothing(series, initialization_method="estimated")
            self.fitted_model = model.fit(optimized=True)
            fitted_values = self.fitted_model.fittedvalues
            self.residuals = series - fitted_values
            self.residual_std = float(np.std(self.residuals)) if len(self.residuals) > 1 else 1.0

        self.fitted = True

    def predict(self, horizon: int) -> ForecastResult:
        if not self.fitted or self.fitted_model is None or self.df_train is None:
            raise ValueError("ETS model is not fitted.")

        point_preds = self.fitted_model.forecast(horizon)
        # Ensure non-negative predictions if historical minimum was non-negative
        hist_min = self.df_train[self.target_col].min()
        if hist_min >= 0:
            point_preds = np.maximum(0.0, point_preds)

        last_date = pd.to_datetime(self.df_train[self.date_col].iloc[-1])
        if len(self.df_train) > 1:
            step = pd.to_datetime(self.df_train[self.date_col].iloc[-1]) - pd.to_datetime(self.df_train[self.date_col].iloc[-2])
        else:
            step = pd.Timedelta(days=1)

        future_dates = [last_date + (i + 1) * step for i in range(horizon)]

        lower_80, upper_80 = self.compute_residual_bands(point_preds, z_score=1.282)
        lower_95, upper_95 = self.compute_residual_bands(point_preds, z_score=1.960)

        predictions = []
        for i in range(horizon):
            predictions.append(PredictionPoint(
                date=future_dates[i].strftime("%Y-%m-%d"),
                predicted=float(round(point_preds[i], 2)),
                lower_80=float(round(max(0.0 if hist_min >= 0 else -1e9, lower_80[i]), 2)),
                upper_80=float(round(upper_80[i], 2)),
                lower_95=float(round(max(0.0 if hist_min >= 0 else -1e9, lower_95[i]), 2)),
                upper_95=float(round(upper_95[i], 2)),
            ))

        series = self.df_train[self.target_col].values
        fitted_vals = self.fitted_model.fittedvalues

        metrics = ModelMetrics(
            mae=round(calc_mae(series[1:], fitted_vals[1:]), 2),
            rmse=round(calc_rmse(series[1:], fitted_vals[1:]), 2),
            mape=round(calc_mape(series[1:], fitted_vals[1:]), 2),
            smape=round(calc_smape(series[1:], fitted_vals[1:]), 2)
        )

        params = {
            "alpha": round(float(getattr(self.fitted_model.params, 'get', lambda k, v: v)('smoothing_level', 0.5)), 4),
            "trend": getattr(self.fitted_model.model, 'trend', 'None'),
            "seasonal": getattr(self.fitted_model.model, 'seasonal', 'None')
        }

        # Trend slope calculation
        slope = 0.0
        if len(point_preds) > 1:
            slope = (point_preds[-1] - point_preds[0]) / len(point_preds)
            slope_pct = (slope / max(1.0, float(np.mean(series)))) * 100.0
        else:
            slope_pct = 0.0

        return ForecastResult(
            model_name=self.model_name,
            model_key=self.model_key,
            metrics=metrics,
            predictions=predictions,
            residuals_std=round(self.residual_std, 2),
            params_summary=params,
            explainability={
                "baseline_level": round(float(series[-1]), 2),
                "trend_slope_pct": round(slope_pct, 2),
                "seasonality_detected": params["seasonal"] != 'None' and params["seasonal"] is not None,
                "summary": f"Fits exponential weighting for recency with Holt-Winters level, trend ({params['trend']}), and seasonality ({params['seasonal']})."
            }
        )
