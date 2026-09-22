import pandas as pd
import numpy as np
from typing import Dict, Any, List

def analyze_data_health(df: pd.DataFrame, date_col: str, target_col: str) -> Dict[str, Any]:
    """
    Performs comprehensive data health diagnostics on time-series dataset.
    Returns health score (0-100), detailed metrics, detected issues, and plain-language diagnostic summary.
    """
    total_rows = len(df)
    if total_rows == 0:
        return {
            "score": 0,
            "status": "Critical",
            "total_rows": 0,
            "issues": ["Dataset is completely empty."],
            "diagnostics": [],
            "missing_count": 0,
            "missing_pct": 0.0,
            "duplicate_count": 0,
            "outlier_count": 0,
            "date_issues_count": 0
        }

    issues = []
    diagnostics = []
    penalties = 0.0

    # 1. Target Column Missing Values
    target_series = df[target_col] if target_col in df.columns else pd.Series(dtype=float)
    missing_count = int(target_series.isna().sum())
    missing_pct = round((missing_count / total_rows) * 100, 2)
    
    if missing_count > 0:
        missing_penalty = min(25.0, (missing_pct / 10.0) * 15.0)
        penalties += missing_penalty
        issues.append(f"{missing_count} missing target value(s) ({missing_pct}% of series).")
        diagnostics.append(
            f"Detected {missing_count} missing value(s) in '{target_col}'. "
            f"Select an imputation method (e.g., linear interpolation or forward-fill) to repair the sequence before forecasting."
        )

    # 2. Duplicate Records
    duplicate_rows = int(df.duplicated().sum())
    dup_timestamp_count = 0
    if date_col in df.columns:
        dup_timestamp_count = int(df.duplicated(subset=[date_col]).sum())

    if duplicate_rows > 0 or dup_timestamp_count > 0:
        dup_penalty = min(15.0, (dup_timestamp_count / total_rows) * 20.0 + 5.0)
        penalties += dup_penalty
        issues.append(f"{dup_timestamp_count} duplicate timestamp record(s) detected.")
        diagnostics.append(
            f"Found {dup_timestamp_count} duplicate date/time timestamp(s). "
            f"Duplicates can skew time-series model lag features; auto-aggregation or dropping duplicates is recommended."
        )

    # 3. Outlier Detection (IQR Method)
    outlier_count = 0
    outlier_pct = 0.0
    valid_numeric = target_series.dropna()
    if len(valid_numeric) >= 5:
        q25, q75 = np.percentile(valid_numeric, [25, 75])
        iqr = q75 - q25
        lower_bound = q25 - 1.5 * iqr
        upper_bound = q75 + 1.5 * iqr
        outliers = valid_numeric[(valid_numeric < lower_bound) | (valid_numeric > upper_bound)]
        outlier_count = int(len(outliers))
        outlier_pct = round((outlier_count / len(valid_numeric)) * 100, 2)

        if outlier_count > 0:
            outlier_penalty = min(15.0, outlier_pct * 1.5)
            penalties += outlier_penalty
            issues.append(f"{outlier_count} potential outlier record(s) detected ({outlier_pct}%).")
            diagnostics.append(
                f"Identified {outlier_count} statistical outlier spike(s) in '{target_col}' (outside [{round(lower_bound, 2)}, {round(upper_bound, 2)}]). "
                f"Extreme spikes may distort trend slope estimation."
            )

    # 4. Date Inconsistencies & Gap Analysis
    date_issues_count = 0
    date_freq_str = "Unknown"
    is_monotonic = True
    
    if date_col in df.columns:
        parsed_dates = pd.to_datetime(df[date_col], errors='coerce')
        unparseable = int(parsed_dates.isna().sum())
        if unparseable > 0:
            penalties += 20.0
            date_issues_count += unparseable
            issues.append(f"{unparseable} invalid/unparseable date string(s).")
            diagnostics.append(f"Failed to parse {unparseable} date entry/entries in column '{date_col}'. Ensure standard YYYY-MM-DD format.")

        valid_dates = parsed_dates.dropna().sort_values()
        if len(valid_dates) > 2:
            is_monotonic = parsed_dates.dropna().is_monotonic_increasing
            if not is_monotonic:
                penalties += 10.0
                date_issues_count += 1
                issues.append("Timestamps are not strictly chronologically ordered.")
                diagnostics.append("Timestamps were found out of sequence. RicozPredict will automatically sort by time index.")

            # Infer frequency & missing steps
            diffs = valid_dates.diff().dropna()
            mode_diff = diffs.mode()
            if not mode_diff.empty:
                median_gap = mode_diff.iloc[0]
                expected_steps = int((valid_dates.iloc[-1] - valid_dates.iloc[0]) / median_gap) + 1
                missing_dates_gap = max(0, expected_steps - len(valid_dates))
                if missing_dates_gap > 0:
                    gap_penalty = min(20.0, (missing_dates_gap / expected_steps) * 25.0)
                    penalties += gap_penalty
                    date_issues_count += missing_dates_gap
                    issues.append(f"{missing_dates_gap} missing step gap(s) in temporal sequence.")
                    diagnostics.append(
                        f"Sequence analysis indicates ~{missing_dates_gap} skipped time step(s) based on expected interval of {median_gap}."
                    )
                date_freq_str = str(median_gap).replace('0 days ', '')

    # Compute final Data Health Score (0 to 100)
    final_score = max(0, min(100, int(round(100.0 - penalties))))
    
    status = "Excellent"
    if final_score < 50:
        status = "Critical"
    elif final_score < 75:
        status = "Fair"
    elif final_score < 90:
        status = "Good"

    if len(diagnostics) == 0:
        diagnostics.append("Dataset health is excellent! Timestamps are continuous, monotonic, and clean of missing values.")

    return {
        "score": final_score,
        "status": status,
        "total_rows": total_rows,
        "missing_count": missing_count,
        "missing_pct": missing_pct,
        "duplicate_count": duplicate_rows + dup_timestamp_count,
        "outlier_count": outlier_count,
        "outlier_pct": outlier_pct,
        "date_issues_count": date_issues_count,
        "inferred_frequency": date_freq_str,
        "issues": issues,
        "diagnostics": diagnostics
    }
