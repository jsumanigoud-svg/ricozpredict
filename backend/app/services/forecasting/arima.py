import pandas as pd
import numpy as np
from statsmodels.tsa.arima.model import ARIMA
from .base import BaseForecaster, ForecastResult, PredictionPoint, ModelMetrics, calc_mae, calc_rmse, calc_mape, calc_smape
from .ets import ETSForecaster

class ARIMAForecaster(BaseForecaster):
    def __init__(self):
        super().__init__(model_key="arima", model_name="Auto-ARIMA")
        self.best_order = (1, 1, 1)
        self.fitted_model = None
        self.fallback_ets = None

    def fit(self, df: pd.DataFrame, date_col: str, target_col: str) -> None:
        self.df_train = df.copy()
        self.date_col = date_col
        self.target_col = target_col

        series = df[target_col].values.astype(float)
        n = len(series)

        if n < 8:
            # Series too short for stable ARIMA, fallback to ETS
            self.fallback_ets = ETSForecaster()
            self.fallback_ets.fit(df, date_col, target_col)
            self.residual_std = self.fallback_ets.residual_std
            self.fitted = True
            return

        # Bounded Grid Search over (p, d, q)
        best_aic = float('inf')
        best_model = None
        best_order = (1, 1, 1)

        p_range = [0, 1, 2]
        d_range = [0, 1]
        q_range = [0, 1, 2]

        for d in d_range:
            for p in p_range:
                for q in q_range:
                    if p == 0 and q == 0:
                        continue
                    try:
                        model = ARIMA(series, order=(p, d, q), enforce_stationarity=False, enforce_invertibility=False)
                        res = model.fit()
                        if res.aic < best_aic:
                            best_aic = res.aic
                            best_model = res
                            best_order = (p, d, q)
                    except Exception:
                        continue

        if best_model is not None:
            self.fitted_model = best_model
            self.best_order = best_order
            fitted_values = best_model.fittedvalues
            self.residuals = series - fitted_values
            self.residual_std = float(np.std(self.residuals)) if len(self.residuals) > 1 else 1.0
        else:
            # Fallback to ETS
            self.fallback_ets = ETSForecaster()
            self.fallback_ets.fit(df, date_col, target_col)
            self.residual_std = self.fallback_ets.residual_std

        self.fitted = True

    def predict(self, horizon: int) -> ForecastResult:
        if not self.fitted:
            raise ValueError("ARIMA model is not fitted.")

        if self.fallback_ets is not None:
            res = self.fallback_ets.predict(horizon)
            res.model_name = "Auto-ARIMA (ETS Fallback)"
            res.model_key = self.model_key
            res.params_summary["fallback_reason"] = "ARIMA search did not converge on short or irregular series; reverted to ETS."
            return res

        try:
            forecast_res = self.fitted_model.get_forecast(steps=horizon)
            point_preds = forecast_res.predicted_mean
            
            # Confidence intervals from ARIMA
            ci_80 = forecast_res.conf_int(alpha=0.20)
            ci_95 = forecast_res.conf_int(alpha=0.05)
            
            lower_80 = ci_80[:, 0]
            upper_80 = ci_80[:, 1]
            lower_95 = ci_95[:, 0]
            upper_95 = ci_95[:, 1]
        except Exception:
            # Residual fallback
            point_preds = self.fitted_model.forecast(horizon)
            lower_80, upper_80 = self.compute_residual_bands(point_preds, 1.282)
            lower_95, upper_95 = self.compute_residual_bands(point_preds, 1.960)

        hist_min = self.df_train[self.target_col].min()
        if hist_min >= 0:
            point_preds = np.maximum(0.0, point_preds)

        last_date = pd.to_datetime(self.df_train[self.date_col].iloc[-1])
        if len(self.df_train) > 1:
            step = pd.to_datetime(self.df_train[self.date_col].iloc[-1]) - pd.to_datetime(self.df_train[self.date_col].iloc[-2])
        else:
            step = pd.Timedelta(days=1)

        future_dates = [last_date + (i + 1) * step for i in range(horizon)]

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

        p, d, q = self.best_order
        return ForecastResult(
            model_name=self.model_name,
            model_key=self.model_key,
            metrics=metrics,
            predictions=predictions,
            residuals_std=round(self.residual_std, 2),
            params_summary={
                "order": f"ARIMA({p},{d},{q})",
                "p_ar": p,
                "d_diff": d,
                "q_ma": q,
                "aic": round(float(self.fitted_model.aic), 2)
            },
            explainability={
                "baseline_level": round(float(series[-1]), 2),
                "trend_slope_pct": 0.0,
                "seasonality_detected": False,
                "summary": f"Autoregressive Integrated Moving Average ARIMA({p},{d},{q}) modeling serial auto-correlation and differenced trend dynamics."
            }
        )
