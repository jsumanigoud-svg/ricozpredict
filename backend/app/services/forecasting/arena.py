import pandas as pd
import numpy as np
from typing import List, Dict, Any, Tuple
from .base import BaseForecaster, ForecastResult, ModelMetrics, calc_mae, calc_rmse, calc_mape, calc_smape
from .naive import NaiveForecaster
from .moving_average import MovingAverageForecaster
from .ets import ETSForecaster
from .arima import ARIMAForecaster
from .regression import LagRegressionForecaster

def run_model_arena(
    df: pd.DataFrame, 
    date_col: str, 
    target_col: str, 
    horizon: int = 30
) -> Tuple[List[Dict[str, Any]], str, Dict[str, ForecastResult]]:
    """
    Executes time-series walk-forward cross-validation backtest across candidate models.
    Returns: (leaderboard_list, champion_model_key, forecast_results_by_key).
    """
    total_len = len(df)
    # Determine backtest split fold (80% train, 20% test, minimum test 5 steps)
    test_len = max(5, int(total_len * 0.20))
    train_len = total_len - test_len

    df_train = df.iloc[:train_len].copy().reset_index(drop=True)
    df_test = df.iloc[train_len:].copy().reset_index(drop=True)
    actuals = df_test[target_col].values.astype(float)

    candidate_models: List[BaseForecaster] = [
        NaiveForecaster(),
        MovingAverageForecaster(window_size=7),
        ETSForecaster(),
        ARIMAForecaster(),
        LagRegressionForecaster(alpha=1.0)
    ]

    leaderboard = []
    forecast_results: Dict[str, ForecastResult] = {}

    for model in candidate_models:
        try:
            # 1. Backtest fit on train set
            model.fit(df_train, date_col, target_col)
            backtest_res = model.predict(len(actuals))
            backtest_preds = np.array([p.predicted for p in backtest_res.predictions])

            mae = round(calc_mae(actuals, backtest_preds), 2)
            rmse = round(calc_rmse(actuals, backtest_preds), 2)
            mape = round(calc_mape(actuals, backtest_preds), 2)
            smape = round(calc_smape(actuals, backtest_preds), 2)

            # 2. Refit on full dataset for final future horizon predictions
            model_full = model.__class__()
            model_full.fit(df, date_col, target_col)
            final_result = model_full.predict(horizon)
            
            # Override metrics with true out-of-sample backtest metrics
            final_result.metrics = ModelMetrics(mae=mae, rmse=rmse, mape=mape, smape=smape)

            forecast_results[model.model_key] = final_result

            leaderboard.append({
                "model_key": model.model_key,
                "model_name": model.model_name,
                "mae": mae,
                "rmse": rmse,
                "mape": mape,
                "smape": smape,
                "residual_std": final_result.residuals_std,
                "params_summary": final_result.params_summary,
                "rank": 0,
                "is_champion": False
            })
        except Exception as e:
            # If a model fails backtest, record high penalty metrics
            leaderboard.append({
                "model_key": model.model_key,
                "model_name": model.model_name,
                "mae": 9999.0,
                "rmse": 9999.0,
                "mape": 999.0,
                "smape": 100.0,
                "residual_std": 9999.0,
                "params_summary": {"error": str(e)},
                "rank": 99,
                "is_champion": False
            })

    # Sort leaderboard by RMSE ascending (primary) and MAE ascending (secondary)
    leaderboard.sort(key=lambda x: (x["rmse"], x["mae"]))

    # Assign rank and tag Champion Model
    champion_key = "naive"
    if len(leaderboard) > 0:
        champion_key = leaderboard[0]["model_key"]
        for idx, item in enumerate(leaderboard):
            item["rank"] = idx + 1
            if idx == 0:
                item["is_champion"] = True

    return leaderboard, champion_key, forecast_results
