import pandas as pd
import numpy as np
from typing import Tuple, List

def clean_time_series(
    df: pd.DataFrame, 
    date_col: str, 
    target_col: str, 
    imputation_strategy: str = "interpolate"
) -> Tuple[pd.DataFrame, List[str]]:
    """
    Cleans and preprocesses time-series dataframe according to user-selected imputation strategy.
    Returns (cleaned_df, cleaning_log).
    """
    df_clean = df.copy()
    log = []

    # 1. Parse and sort by date_col
    if date_col in df_clean.columns:
        df_clean[date_col] = pd.to_datetime(df_clean[date_col], errors='coerce')
        # Drop unparseable dates
        invalid_dates = df_clean[date_col].isna()
        if invalid_dates.sum() > 0:
            df_clean = df_clean.dropna(subset=[date_col])
            log.append(f"Dropped {invalid_dates.sum()} row(s) with unparseable timestamp values.")
        
        # Sort chronologically
        if not df_clean[date_col].is_monotonic_increasing:
            df_clean = df_clean.sort_values(by=date_col).reset_index(drop=True)
            log.append(f"Re-ordered series chronologically by '{date_col}'.")
        else:
            df_clean = df_clean.reset_index(drop=True)

    # 2. Ensure target column numeric
    if target_col in df_clean.columns:
        df_clean[target_col] = pd.to_numeric(df_clean[target_col], errors='coerce')
        
        missing_count = int(df_clean[target_col].isna().sum())
        if missing_count > 0:
            if imputation_strategy == "interpolate":
                df_clean[target_col] = df_clean[target_col].interpolate(method='linear').bfill().ffill()
                log.append(f"Applied linear interpolation to repair {missing_count} missing value(s) in '{target_col}'.")
            elif imputation_strategy == "ffill":
                df_clean[target_col] = df_clean[target_col].ffill().bfill()
                log.append(f"Applied forward fill (ffill) for {missing_count} missing value(s) in '{target_col}'.")
            elif imputation_strategy == "bfill":
                df_clean[target_col] = df_clean[target_col].bfill().ffill()
                log.append(f"Applied backward fill (bfill) for {missing_count} missing value(s) in '{target_col}'.")
            elif imputation_strategy == "zero":
                df_clean[target_col] = df_clean[target_col].fillna(0.0)
                log.append(f"Imputed 0.0 for {missing_count} missing value(s) in '{target_col}'.")
            elif imputation_strategy == "mean":
                mean_val = float(df_clean[target_col].mean())
                df_clean[target_col] = df_clean[target_col].fillna(mean_val)
                log.append(f"Imputed mean value ({round(mean_val, 2)}) for {missing_count} missing value(s) in '{target_col}'.")
            elif imputation_strategy == "drop":
                df_clean = df_clean.dropna(subset=[target_col]).reset_index(drop=True)
                log.append(f"Dropped {missing_count} row(s) containing missing values in '{target_col}'.")
            else:
                df_clean[target_col] = df_clean[target_col].interpolate(method='linear').bfill().ffill()
                log.append(f"Applied default linear interpolation for {missing_count} missing value(s).")

    if len(log) == 0:
        log.append("Data validation passed cleanly. No imputation or sorting modifications required.")

    return df_clean, log
