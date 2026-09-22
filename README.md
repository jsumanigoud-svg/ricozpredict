# RicozPredict 🚀

> **Explainable Business Forecasting & Decision Intelligence**  
> *Forecast demand. Understand why. Simulate what happens next.*

RicozPredict is a fast, transparent, and flexible business forecasting platform built as a modern alternative to legacy prediction tools. It provides automated CSV data health analysis, user-controlled missing data imputation, time-series out-of-sample backtesting across multiple algorithms, 80%/95% prediction intervals, plain-language explainability, scenario sensitivity simulation, and forecast governance audit trails.

---

## 🌟 Core Features

- **📊 Data Ingestion & Demo Datasets**: Drag-and-drop CSV upload with automatic date/target column detection. Pre-packaged with 3 demo datasets (*E-Commerce Sales*, *SaaS MRR Growth*, *Retail Footfall*).
- **🩺 Data Health Score (0–100)**: Detects missing values, duplicate timestamps, statistical outliers (IQR), and temporal gaps with plain-English diagnostic findings.
- **🛠️ User-Controlled Data Imputation**: Selectable gap cleaning strategies (*Linear Interpolation*, *Forward Fill*, *Backward Fill*, *Impute Zero*, *Impute Mean*, *Drop Missing*).
- **⚔️ Time-Series Model Arena**: Evaluates candidate models (*Naive Baseline*, *Moving Average*, *Exponential Smoothing (ETS)*, *Bounded Auto-ARIMA*, *Lag Ridge Regression*) using 80% train / 20% test walk-forward cross-validation. Computes **MAE**, **RMSE**, **Zero-Safe MAPE (%)**, and **sMAPE (%)**.
- **📈 Interactive Forecast Visualization**: Recharts graph displaying historical actuals vs point predictions with shaded 80% and 95% confidence bands and 7, 30, and 90-day horizon toggles.
- **💡 Transparent Explainability**: Baseline, trend slope %, seasonality cycles, and volatility breakdown accompanied by an explicit **Causal Distinction Notice**.
- **🎯 Scenario-Based What-If Simulator**: Interactive sliders for baseline shift %, trend acceleration, and event shocks with live green scenario curve overlay.
- **🛡️ Governance Audit Metadata**: Complete audit trail logging run ID, execution latency, imputation strategy, 80/20 split stats, model hyperparameters, and determinism certification.

---

## 🛠️ Tech Stack

- **Backend**: Python 3.12, FastAPI, Uvicorn, Pandas, NumPy, scikit-learn, statsmodels, PyTest
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS v3, Recharts, Lucide React

---

## 📁 Project Structure

```
ricozpredict/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI server & REST endpoints
│   │   ├── services/
│   │   │   ├── data_health.py       # Data health diagnostic engine
│   │   │   ├── cleaning.py          # User-controlled data imputation
│   │   │   ├── forecasting/
│   │   │   │   ├── base.py          # Extensible BaseForecaster & zero-safe error metrics
│   │   │   │   ├── naive.py         # Naive Baseline forecaster
│   │   │   │   ├── moving_average.py# Simple Moving Average forecaster
│   │   │   │   ├── ets.py           # Holt-Winters ETS forecaster
│   │   │   │   ├── arima.py         # Bounded Auto-ARIMA forecaster
│   │   │   │   ├── regression.py    # Lag Ridge Regression forecaster
│   │   │   │   └── arena.py         # Time-series walk-forward backtester
│   │   │   ├── explainability.py    # Statistical rationale & causal notice engine
│   │   │   └── simulator.py         # Scenario What-If sensitivity modifier
│   │   └── samples/                 # Pre-packaged CSV demo datasets
│   ├── test_pipeline.py             # PyTest / Unittest verification suite
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx           # Enterprise header with status indicators
│   │   │   ├── DataIngestion.tsx    # CSV dropzone & preview table
│   │   │   ├── DataHealthCard.tsx   # Health score & user imputation controls
│   │   │   ├── ModelArena.tsx       # Backtest leaderboard (MAE/RMSE/MAPE/sMAPE)
│   │   │   ├── ForecastChart.tsx    # Recharts actual vs forecast + 80%/95% confidence bands
│   │   │   ├── ForecastBrief.tsx    # Executive digest section
│   │   │   ├── ExplainabilityView.tsx # Statistical drivers & causal warning
│   │   │   ├── WhatIfSimulator.tsx  # Scenario sensitivity sliders
│   │   │   └── GovernanceModal.tsx  # Run governance audit modal
│   │   ├── types/analytics.ts       # TypeScript API contracts
│   │   ├── utils/api.ts             # API network client
│   │   ├── App.tsx                  # Main analytics dashboard
│   │   └── index.css                # Tailwind directives & dark enterprise theme
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
└── README.md
```

---

## ⚡ Setup & Local Run Instructions

### Prerequisites
- **Python**: 3.10+
- **Node.js**: v18+ (npm v9+)

### 1. Backend Setup (FastAPI)
```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Run backend server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
Backend API will run at `http://127.0.0.1:8000` (Swagger docs available at `http://127.0.0.1:8000/docs`).

### 2. Frontend Setup (React + Vite)
```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install npm dependencies
npm install

# Start Vite development server
npm run dev
```
Frontend web application will run at `http://localhost:5173/`.

---

## 🧪 Testing & Verification

```bash
# Run backend test suite
python backend/test_pipeline.py

# Build frontend production bundle
cd frontend && npm run build
```

---

## 📄 License
MIT License. Free for commercial and non-commercial use.
