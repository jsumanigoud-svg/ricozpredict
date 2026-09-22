import pandas as pd
import numpy as np
from typing import Dict, Any

def generate_model_explainability(
    df: pd.DataFrame, 
    date_col: str, 
    target_col: str, 
    model_name: str, 
    forecast_result: Any
) -> Dict[str, Any]:
    """
    Produces transparent, plain-language explainability diagnostic breakdown for a forecast run.
    Explicitly enforces non-causal statistical interpretation.
    """
    series = df[target_col].values.astype(float)
    n = len(series)
    
    recent_val = float(series[-1]) if n > 0 else 0.0
    mean_val = float(np.mean(series)) if n > 0 else 1.0
    std_val = float(np.std(series)) if n > 0 else 0.0
    
    # Estimate simple linear trend slope
    x = np.arange(n)
    if n > 1:
        slope, intercept = np.polyfit(x, series, 1)
        slope_pct = float((slope / max(1.0, mean_val)) * 100.0)
    else:
        slope = 0.0
        slope_pct = 0.0

    trend_direction = "Upward" if slope_pct > 0.5 else ("Downward" if slope_pct < -0.5 else "Flat / Stable")

    # Detect day-of-week seasonality strength if dates are available
    seasonality_summary = "No obvious sub-monthly seasonal cycle detected."
    if date_col in df.columns:
        try:
            dates = pd.to_datetime(df[date_col])
            dow_means = df.groupby(dates.dt.dayofweek)[target_col].mean()
            if len(dow_means) == 7:
                max_day = int(dow_means.idxmax())
                min_day = int(dow_means.idxmin())
                day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
                var_ratio = (dow_means.max() - dow_means.min()) / max(1.0, mean_val)
                if var_ratio > 0.15:
                    seasonality_summary = (
                        f"Weekly pattern identified: Peaks on {day_names[max_day]}s "
                        f"(~{round(float(dow_means.max()), 2)}) and troughs on {day_names[min_day]}s."
                    )
        except Exception:
            pass

    driver_components = [
        {
            "name": "Historical Baseline Level",
            "contribution_pct": round(min(100.0, max(50.0, 100.0 - abs(slope_pct))), 1),
            "description": f"Recent historical average level around {round(recent_val, 2)}."
        },
        {
            "name": "Linear Trend Momentum",
            "contribution_pct": round(min(40.0, abs(slope_pct)), 1),
            "description": f"{trend_direction} trajectory moving at approximately {round(slope_pct, 2)}% per time step."
        },
        {
            "name": "Unexplained Volatility / Noise",
            "contribution_pct": round(min(30.0, (std_val / max(1.0, mean_val)) * 50.0), 1),
            "description": f"Standard deviation noise band of ±{round(std_val, 2)}."
        }
    ]

    causal_disclaimer = (
        "CAUTION: RicozPredict models historical statistical associations, auto-correlations, and trend momentum. "
        "Feature weights and model contributions reflect empirical correlations within the provided dataset and MUST NOT be interpreted as direct causal business drivers."
    )

    summary_text = (
        f"The {model_name} model projects a {trend_direction.lower()} trajectory. "
        f"Forecast level is grounded at baseline {round(recent_val, 2)} with trend slope of {round(slope_pct, 2)}%. "
        f"{seasonality_summary}"
    )

    return {
        "model_name": model_name,
        "baseline_level": round(recent_val, 2),
        "trend_direction": trend_direction,
        "trend_slope_pct": round(slope_pct, 2),
        "seasonality_summary": seasonality_summary,
        "volatility_std": round(std_val, 2),
        "driver_components": driver_components,
        "causal_disclaimer": causal_disclaimer,
        "summary": summary_text
    }
