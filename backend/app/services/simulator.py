import numpy as np
from typing import List, Dict, Any

def run_what_if_simulation(
    base_predictions: List[Dict[str, Any]], 
    baseline_shift_pct: float = 0.0, 
    trend_multiplier: float = 1.0, 
    shock_step: int = 0, 
    shock_magnitude_pct: float = 0.0
) -> List[Dict[str, Any]]:
    """
    Applies scenario sensitivity modifications to base forecast predictions.
    Returns simulated prediction series with recalculated confidence intervals.
    """
    simulated = []
    num_steps = len(base_predictions)

    for i, pt in enumerate(base_predictions):
        orig_val = float(pt["predicted"])
        orig_lower = float(pt["lower_95"])
        orig_upper = float(pt["upper_95"])

        # 1. Baseline shift multiplier
        shift_factor = 1.0 + (baseline_shift_pct / 100.0)

        # 2. Trend acceleration/deceleration factor (compounds over horizon)
        trend_factor = 1.0 + ((trend_multiplier - 1.0) * (i + 1) / max(1, num_steps))

        # 3. Single step event shock multiplier
        shock_factor = 1.0
        if shock_step > 0 and (i + 1) == shock_step:
            shock_factor = 1.0 + (shock_magnitude_pct / 100.0)

        combined_factor = shift_factor * trend_factor * shock_factor

        sim_val = round(orig_val * combined_factor, 2)
        sim_lower = round(orig_lower * combined_factor, 2)
        sim_upper = round(orig_upper * combined_factor, 2)

        simulated.append({
            "date": pt["date"],
            "simulated": sim_val,
            "sim_lower_95": sim_lower,
            "sim_upper_95": sim_upper,
            "baseline": orig_val,
            "delta_pct": round(((sim_val - orig_val) / max(1e-5, abs(orig_val))) * 100.0, 2)
        })

    return simulated
