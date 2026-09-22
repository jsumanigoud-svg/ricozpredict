import pandas as pd
import numpy as np
from .base import BaseForecaster, ForecastResult, PredictionPoint, ModelMetrics, calc_mae, calc_rmse, calc_mape, calc_smape

class NaiveForecaster(BaseForecaster):
    def __init__(self):
        super().__init__(model_key="naive", model_name="Naive Baseline")
        self.last_value = 0.0

    def fit(self, df: pd.DataFrame, date_col: str, target_col: str) -> None:
        self.df_train = df.copy()
        self.date_col = date_col
        self.target_col = target_col
        
        series = df[target_col].values
        self.last_value = float(series[-1]) if len(series) > 0 else 0.0
        
        # Calculate residuals against 1-step naive (lag-1)
        in_sample_preds = np.roll(series, 1)
        in_sample_preds[0] = series[0]
        self.residuals = series - in_sample_preds
        self.residual_std = float(np.std(self.residuals)) if len(self.residuals) > 1 else 1.0
        self.fitted = True

    def predict(self, horizon: int) -> ForecastResult:
        if not self.fitted or self.df_train is None:
            raise ValueError("Model is not fitted yet.")

        last_date = pd.to_datetime(self.df_train[self.date_col].iloc[-1])
        # Infer frequency
        if len(self.df_train) > 1:
            step = pd.to_datetime(self.df_train[self.date_col].iloc[-1]) - pd.to_datetime(self.df_train[self.date_col].iloc[-2])
        else:
            step = pd.Timedelta(days=1)

        future_dates = [last_date + (i + 1) * step for i in range(horizon)]
        point_preds = np.full(horizon, self.last_value)

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
        in_sample = np.roll(series, 1)
        in_sample[0] = series[0]

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
            params_summary={"strategy": "Last Observed Value", "last_value": round(self.last_value, 2)},
            explainability={
                "baseline_level": round(self.last_value, 2),
                "trend_slope_pct": 0.0,
                "seasonality_detected": False,
                "summary": f"Projects constant baseline of {round(self.last_value, 2)} based on the most recent observation."
            }
        )
