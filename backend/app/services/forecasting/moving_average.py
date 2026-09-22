import pandas as pd
import numpy as np
from .base import BaseForecaster, ForecastResult, PredictionPoint, ModelMetrics, calc_mae, calc_rmse, calc_mape, calc_smape

class MovingAverageForecaster(BaseForecaster):
    def __init__(self, window_size: int = 7):
        super().__init__(model_key="moving_average", model_name="Moving Average (SMA)")
        self.window_size = window_size
        self.ma_val = 0.0

    def fit(self, df: pd.DataFrame, date_col: str, target_col: str) -> None:
        self.df_train = df.copy()
        self.date_col = date_col
        self.target_col = target_col

        series = df[target_col].values
        n = len(series)
        win = min(self.window_size, max(1, n))
        self.ma_val = float(np.mean(series[-win:]))

        # In-sample rolling MA evaluation
        in_sample_preds = pd.Series(series).rolling(window=win, min_periods=1).mean().shift(1).bfill().values
        self.residuals = series - in_sample_preds
        self.residual_std = float(np.std(self.residuals)) if len(self.residuals) > 1 else 1.0
        self.fitted = True

    def predict(self, horizon: int) -> ForecastResult:
        if not self.fitted or self.df_train is None:
            raise ValueError("Model is not fitted yet.")

        last_date = pd.to_datetime(self.df_train[self.date_col].iloc[-1])
        if len(self.df_train) > 1:
            step = pd.to_datetime(self.df_train[self.date_col].iloc[-1]) - pd.to_datetime(self.df_train[self.date_col].iloc[-2])
        else:
            step = pd.Timedelta(days=1)

        future_dates = [last_date + (i + 1) * step for i in range(horizon)]
        point_preds = np.full(horizon, self.ma_val)

        lower_80, upper_80 = self.compute_residual_bands(point_preds, z_score=1.282)
        lower_95, upper_95 = self.compute_residual_bands(point_preds, z_score=1.960)

        predictions = []
        for i in range(horizon):
            predictions.append(PredictionPoint(
                date=future_dates[i].strftime("%Y-%m-%d"),
                predicted=float(round(point_preds[i], 2)),
                lower_80=float(round(lower_80[i], 2)),
                upper_80=float(round(upper_80[i], 2)),
                lower_95=float(round(lower_95[i], 2)),
                upper_95=float(round(upper_95[i], 2)),
            ))

        series = self.df_train[self.target_col].values
        win = min(self.window_size, max(1, len(series)))
        in_sample = pd.Series(series).rolling(window=win, min_periods=1).mean().shift(1).bfill().values

        metrics = ModelMetrics(
            mae=round(calc_mae(series[1:], in_sample[1:]), 2),
            rmse=round(calc_rmse(series[1:], in_sample[1:]), 2),
            mape=round(calc_mape(series[1:], in_sample[1:]), 2),
            smape=round(calc_smape(series[1:], in_sample[1:]), 2)
        )

        return ForecastResult(
            model_name=self.model_name,
            model_key=self.model_key,
            metrics=metrics,
            predictions=predictions,
            residuals_std=round(self.residual_std, 2),
            params_summary={"window_size": win, "moving_average_value": round(self.ma_val, 2)},
            explainability={
                "baseline_level": round(self.ma_val, 2),
                "trend_slope_pct": 0.0,
                "seasonality_detected": False,
                "summary": f"Smooths recent variance by averaging the last {win} observations to generate a stable forecast baseline."
            }
        )
