import pandas as pd
import numpy as np
import os

os.makedirs("C:/Users/jsuma/.gemini/antigravity/scratch/ricozpredict/backend/app/samples", exist_ok=True)
np.random.seed(42)

# 1. E-Commerce Daily Sales (180 days)
dates_ecom = pd.date_range(start="2024-01-01", periods=180, freq="D")
baseline_rev = 12000
trend = np.linspace(0, 8000, 180)
seasonality = 3500 * np.sin(2 * np.pi * np.arange(180) / 7) # Weekly seasonality
noise = np.random.normal(0, 900, 180)
revenue = np.maximum(5000, baseline_rev + trend + seasonality + noise)

df_ecom = pd.DataFrame({
    "Date": dates_ecom.strftime("%Y-%m-%d"),
    "Revenue": np.round(revenue, 2),
    "Orders": np.random.randint(150, 450, 180),
    "Marketing_Spend": np.round(np.random.uniform(1000, 3000, 180), 2)
})

# Inject 2 synthetic missing values and 1 outlier for Data Health testing
df_ecom.loc[15, "Revenue"] = np.nan
df_ecom.loc[42, "Revenue"] = np.nan
df_ecom.loc[88, "Revenue"] = 49000.0  # Outlier spike

ecom_path = "C:/Users/jsuma/.gemini/antigravity/scratch/ricozpredict/backend/app/samples/ecommerce_daily_sales.csv"
df_ecom.to_csv(ecom_path, index=False)
print(f"Generated {ecom_path}")

# 2. SaaS Monthly MRR (36 months)
dates_saas = pd.date_range(start="2022-01-01", periods=36, freq="MS")
mrr = 50000 * (1.045 ** np.arange(36)) + np.random.normal(0, 1200, 36)
df_saas = pd.DataFrame({
    "Month": dates_saas.strftime("%Y-%m-%d"),
    "MRR": np.round(mrr, 2),
    "Active_Customers": np.random.randint(400, 1200, 36),
    "Churn_Rate": np.round(np.random.uniform(1.2, 3.5, 36), 2)
})
saas_path = "C:/Users/jsuma/.gemini/antigravity/scratch/ricozpredict/backend/app/samples/saas_mrr_growth.csv"
df_saas.to_csv(saas_path, index=False)
print(f"Generated {saas_path}")

# 3. Retail Store Footfall (120 days)
dates_retail = pd.date_range(start="2024-05-01", periods=120, freq="D")
footfall = 1800 + 400 * np.cos(2 * np.pi * np.arange(120) / 7) + np.random.normal(0, 150, 120)
df_retail = pd.DataFrame({
    "Timestamp": dates_retail.strftime("%Y-%m-%d"),
    "Footfall": np.round(footfall, 0).astype(int),
    "Transactions": np.round(footfall * 0.28).astype(int),
    "Avg_Basket_Size": np.round(np.random.uniform(42.0, 78.0, 120), 2)
})
retail_path = "C:/Users/jsuma/.gemini/antigravity/scratch/ricozpredict/backend/app/samples/retail_store_footfall.csv"
df_retail.to_csv(retail_path, index=False)
print(f"Generated {retail_path}")
