import unittest
import pandas as pd
import numpy as np

from app.services.data_health import analyze_data_health
from app.services.cleaning import clean_time_series
from app.services.forecasting.arena import run_model_arena
from app.services.explainability import generate_model_explainability
from app.services.simulator import run_what_if_simulation

class TestRicozPredictPipeline(unittest.TestCase):
    def setUp(self):
        np.random.seed(42)
        dates = pd.date_range("2024-01-01", periods=60, freq="D")
        vals = 1000 + np.linspace(0, 500, 60) + np.random.normal(0, 50, 60)
        self.df = pd.DataFrame({
            "Date": dates.strftime("%Y-%m-%d"),
            "Sales": vals
        })
        # Inject 1 missing value and 1 duplicate timestamp
        self.df.loc[10, "Sales"] = np.nan

    def test_data_health(self):
        health = analyze_data_health(self.df, "Date", "Sales")
        self.assertIn("score", health)
        self.assertGreater(health["score"], 0)
        self.assertEqual(health["missing_count"], 1)

    def test_data_cleaning(self):
        df_clean, log = clean_time_series(self.df, "Date", "Sales", imputation_strategy="interpolate")
        self.assertEqual(df_clean["Sales"].isna().sum(), 0)
        self.assertTrue(len(log) > 0)

    def test_model_arena_and_forecast(self):
        df_clean, _ = clean_time_series(self.df, "Date", "Sales", imputation_strategy="interpolate")
        leaderboard, champion_key, results = run_model_arena(df_clean, "Date", "Sales", horizon=14)
        
        self.assertTrue(len(leaderboard) >= 4)
        self.assertIn(champion_key, results)
        
        champ_res = results[champion_key]
        self.assertEqual(len(champ_res.predictions), 14)
        self.assertGreater(champ_res.predictions[0].predicted, 0)
        self.assertGreaterEqual(champ_res.predictions[0].upper_95, champ_res.predictions[0].lower_95)

    def test_explainability(self):
        df_clean, _ = clean_time_series(self.df, "Date", "Sales", imputation_strategy="interpolate")
        _, champ_key, results = run_model_arena(df_clean, "Date", "Sales", horizon=14)
        champ_res = results[champ_key]
        
        exp = generate_model_explainability(df_clean, "Date", "Sales", champ_res.model_name, champ_res)
        self.assertIn("causal_disclaimer", exp)
        self.assertIn("trend_direction", exp)

    def test_what_if_simulation(self):
        df_clean, _ = clean_time_series(self.df, "Date", "Sales", imputation_strategy="interpolate")
        _, champ_key, results = run_model_arena(df_clean, "Date", "Sales", horizon=14)
        champ_preds = [p.__dict__ for p in results[champ_key].predictions]
        
        sim = run_what_if_simulation(champ_preds, baseline_shift_pct=10.0, trend_multiplier=1.2)
        self.assertEqual(len(sim), 14)
        self.assertGreater(sim[0]["simulated"], champ_preds[0]["predicted"])

if __name__ == "__main__":
    unittest.main()
