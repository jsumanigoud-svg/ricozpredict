import time
import datetime
import io
import os
import pandas as pd
import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

from app.services.data_health import analyze_data_health
from app.services.cleaning import clean_time_series
from app.services.forecasting.arena import run_model_arena
from app.services.explainability import generate_model_explainability
from app.services.simulator import run_what_if_simulation

app = FastAPI(
    title="RicozPredict API",
    description="Explainable Time-Series Analytics & Forecasting Platform API",
    version="1.0.0"
)

# Enable CORS for frontend Vite app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SAMPLES_DIR = os.path.join(os.path.dirname(__file__), "samples")

# Pydantic Schemas
class HealthCheckRequest(BaseModel):
    data: List[Dict[str, Any]]
    date_col: str
    target_col: str

class ForecastRunRequest(BaseModel):
    data: List[Dict[str, Any]]
    date_col: str
    target_col: str
    imputation_strategy: str = "interpolate"
    horizon: int = 30
    selected_model_key: Optional[str] = "champion"

class SimulationRequest(BaseModel):
    predictions: List[Dict[str, Any]]
    baseline_shift_pct: float = 0.0
    trend_multiplier: float = 1.0
    shock_step: int = 0
    shock_magnitude_pct: float = 0.0

@app.get("/")
def read_root():
    return {"status": "ok", "app": "RicozPredict API", "version": "1.0.0"}

@app.get("/api/samples")
def get_sample_datasets():
    """Lists available sample CSV datasets."""
    samples = [
        {
            "id": "ecommerce_daily_sales",
            "name": "E-Commerce Daily Sales",
            "description": "180 days of daily e-commerce order revenue, order volume, and marketing spend.",
            "date_col": "Date",
            "target_col": "Revenue",
            "recommended_horizon": 30
        },
        {
            "id": "saas_mrr_growth",
            "name": "SaaS Monthly MRR Growth",
            "description": "36 months of SaaS Monthly Recurring Revenue (MRR) and active subscriber counts.",
            "date_col": "Month",
            "target_col": "MRR",
            "recommended_horizon": 7
        },
        {
            "id": "retail_store_footfall",
            "name": "Retail Store Footfall",
            "description": "120 days of physical retail store visitor traffic and transaction counts.",
            "date_col": "Timestamp",
            "target_col": "Footfall",
            "recommended_horizon": 30
        }
    ]
    return {"samples": samples}

def sanitize_records(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    cleaned = []
    for row in records:
        cleaned_row = {}
        for k, v in row.items():
            if v is None or (isinstance(v, float) and (np.isnan(v) or np.isinf(v))):
                cleaned_row[k] = None
            else:
                cleaned_row[k] = v
        cleaned.append(cleaned_row)
    return cleaned

@app.get("/api/samples/{sample_id}")
def load_sample_dataset(sample_id: str):
    """Loads specified sample dataset."""
    file_path = os.path.join(SAMPLES_DIR, f"{sample_id}.csv")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Sample dataset not found.")
    
    df = pd.read_csv(file_path)
    # Infer date and target
    cols = list(df.columns)
    date_col = cols[0]
    target_col = cols[1] if len(cols) > 1 else cols[0]

    raw_records = df.to_dict(orient="records")
    clean_recs = sanitize_records(raw_records)
    return {
        "id": sample_id,
        "columns": cols,
        "date_col": date_col,
        "target_col": target_col,
        "total_rows": len(df),
        "data": clean_recs
    }

@app.post("/api/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    """Parses uploaded CSV file and detects columns/data types."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")
    
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        if df.empty:
            raise HTTPException(status_code=400, detail="Uploaded CSV file is empty.")

        columns = list(df.columns)
        column_types = {}
        suggested_date_col = ""
        suggested_target_col = ""

        for col in columns:
            dtype_str = str(df[col].dtype)
            # Check if column looks like datetime
            if "date" in col.lower() or "time" in col.lower() or "month" in col.lower() or "day" in col.lower():
                try:
                    pd.to_datetime(df[col].dropna().head(10))
                    dtype_str = "datetime"
                    if not suggested_date_col:
                        suggested_date_col = col
                except Exception:
                    pass
            elif np.issubdtype(df[col].dtype, np.number):
                dtype_str = "numeric"
                if not suggested_target_col:
                    suggested_target_col = col
            else:
                dtype_str = "categorical"
            
            column_types[col] = dtype_str

        if not suggested_date_col and len(columns) > 0:
            suggested_date_col = columns[0]
        if not suggested_target_col and len(columns) > 1:
            suggested_target_col = columns[1]

        raw_records = df.to_dict(orient="records")
        clean_recs = sanitize_records(raw_records)
        return {
            "filename": file.filename,
            "columns": columns,
            "column_types": column_types,
            "suggested_date_col": suggested_date_col,
            "suggested_target_col": suggested_target_col,
            "total_rows": len(df),
            "preview": clean_recs[:15],
            "data": clean_recs
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse CSV file: {str(e)}")

@app.post("/api/analyze-health")
def analyze_health(req: HealthCheckRequest):
    """Executes data health diagnostics on uploaded dataset."""
    df = pd.DataFrame(req.data)
    if df.empty or req.date_col not in df.columns or req.target_col not in df.columns:
        raise HTTPException(status_code=400, detail="Invalid data or target columns.")
    
    health_result = analyze_data_health(df, req.date_col, req.target_col)
    return health_result

@app.post("/api/forecast/run")
def run_forecast_pipeline(req: ForecastRunRequest):
    """
    Complete end-to-end forecasting pipeline:
    1. Data health check & user imputation cleaning
    2. Model Arena time-series backtest across 5 candidate models
    3. Model selection & forecast horizon generation
    4. Plain-language explainability & governance audit metadata output
    """
    start_time = time.time()
    df_raw = pd.DataFrame(req.data)

    if df_raw.empty or req.date_col not in df_raw.columns or req.target_col not in df_raw.columns:
        raise HTTPException(status_code=400, detail="Invalid dataset, timestamp, or target column selection.")

    # 1. Health Diagnostic
    health_res = analyze_data_health(df_raw, req.date_col, req.target_col)

    # 2. User-controlled Data Cleaning & Imputation
    df_clean, cleaning_log = clean_time_series(
        df_raw, 
        req.date_col, 
        req.target_col, 
        imputation_strategy=req.imputation_strategy
    )

    if len(df_clean) < 5:
        raise HTTPException(status_code=400, detail="Dataset has fewer than 5 rows after cleaning. Minimum 5 rows required.")

    # Format historical series for charts
    df_clean[req.date_col] = pd.to_datetime(df_clean[req.date_col]).dt.strftime("%Y-%m-%d")
    historical_series = []
    for _, row in df_clean.iterrows():
        v = row[req.target_col]
        clean_v = float(v) if (v is not None and not pd.isna(v)) else 0.0
        historical_series.append({
            "date": str(row[req.date_col]),
            "actual": clean_v
        })

    # 3. Execute Model Arena Backtest
    leaderboard, champion_key, all_forecast_results = run_model_arena(
        df_clean, 
        req.date_col, 
        req.target_col, 
        horizon=req.horizon
    )

    # 4. Resolve Active Selected Model
    selected_key = req.selected_model_key
    if not selected_key or selected_key == "champion" or selected_key not in all_forecast_results:
        selected_key = champion_key

    selected_result = all_forecast_results[selected_key]

    # 5. Summary KPIs
    hist_vals = df_clean[req.target_col].values.astype(float)
    hist_total = float(np.sum(hist_vals))
    
    pred_vals = np.array([p.predicted for p in selected_result.predictions])
    forecast_total = float(np.sum(pred_vals))
    
    hist_recent_period_sum = float(np.sum(hist_vals[-len(pred_vals):])) if len(hist_vals) >= len(pred_vals) else hist_total
    growth_pct = round(((forecast_total - hist_recent_period_sum) / max(1.0, hist_recent_period_sum)) * 100.0, 2)
    
    accuracy_score = max(0.0, round(100.0 - selected_result.metrics.mape, 2))

    summary_kpis = {
        "total_records": len(df_clean),
        "health_score": health_res["score"],
        "health_status": health_res["status"],
        "historical_total": round(hist_total, 2),
        "forecast_total": round(forecast_total, 2),
        "growth_pct": growth_pct,
        "forecast_avg": round(float(np.mean(pred_vals)), 2),
        "forecast_min": round(float(np.min(pred_vals)), 2),
        "forecast_max": round(float(np.max(pred_vals)), 2),
        "accuracy_score": accuracy_score,
        "selected_model_name": selected_result.model_name,
        "selected_model_key": selected_key,
        "champion_model_key": champion_key,
        "trend_direction": "Upward" if growth_pct > 1.0 else ("Downward" if growth_pct < -1.0 else "Stable")
    }

    # 6. Plain-Language Explainability
    explainability = generate_model_explainability(
        df_clean, 
        req.date_col, 
        req.target_col, 
        selected_result.model_name, 
        selected_result
    )

    # 7. Forecast Governance Metadata
    elapsed_ms = round((time.time() - start_time) * 1000.0, 2)
    governance_metadata = {
        "run_id": f"RUN-{int(time.time())}",
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "execution_time_ms": elapsed_ms,
        "total_rows_processed": len(df_clean),
        "imputation_strategy": req.imputation_strategy,
        "date_column": req.date_col,
        "target_column": req.target_col,
        "horizon_days": req.horizon,
        "selected_model": selected_result.model_name,
        "champion_model": all_forecast_results[champion_key].model_name,
        "model_parameters": selected_result.params_summary,
        "residual_std": selected_result.residuals_std,
        "time_series_split": f"80% Train ({len(df_clean) - max(5, int(len(df_clean)*0.2))}) / 20% Out-of-sample Test ({max(5, int(len(df_clean)*0.2))})",
        "determinism_note": "Reproducible deterministic fit executed using time-series chronological walk-forward cross-validation."
    }

    # Format all_model_forecasts for UI toggle inspection
    all_model_forecasts_dict = {}
    for k, v in all_forecast_results.items():
        all_model_forecasts_dict[k] = {
            "model_name": v.model_name,
            "metrics": v.metrics.__dict__,
            "predictions": [p.__dict__ for p in v.predictions]
        }

    return {
        "status": "success",
        "data_health": health_res,
        "cleaning_log": cleaning_log,
        "summary_kpis": summary_kpis,
        "leaderboard": leaderboard,
        "champion_model_key": champion_key,
        "selected_model_key": selected_key,
        "historical_series": historical_series,
        "forecast": [p.__dict__ for p in selected_result.predictions],
        "all_model_forecasts": all_model_forecasts_dict,
        "explainability": explainability,
        "governance_metadata": governance_metadata
    }

@app.post("/api/forecast/simulate")
def simulate_forecast(req: SimulationRequest):
    """Executes What-If scenario sensitivity modifications."""
    if not req.predictions:
        raise HTTPException(status_code=400, detail="Base prediction series is required for simulation.")
    
    simulated_res = run_what_if_simulation(
        req.predictions,
        baseline_shift_pct=req.baseline_shift_pct,
        trend_multiplier=req.trend_multiplier,
        shock_step=req.shock_step,
        shock_magnitude_pct=req.shock_magnitude_pct
    )
    return {"simulated_predictions": simulated_res}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
