export interface DataHealthResult {
  score: number;
  status: 'Excellent' | 'Good' | 'Fair' | 'Critical';
  total_rows: number;
  missing_count: number;
  missing_pct: number;
  duplicate_count: number;
  outlier_count: number;
  outlier_pct: number;
  date_issues_count: number;
  inferred_frequency: string;
  issues: string[];
  diagnostics: string[];
}

export interface PredictionPoint {
  date: string;
  predicted: number;
  lower_80: number;
  upper_80: number;
  lower_95: number;
  upper_95: number;
}

export interface ModelMetrics {
  mae: number;
  rmse: number;
  mape: number;
  smape: number;
}

export interface LeaderboardItem {
  model_key: string;
  model_name: string;
  mae: number;
  rmse: number;
  mape: number;
  smape: number;
  residual_std: number;
  params_summary: Record<string, any>;
  rank: number;
  is_champion: boolean;
}

export interface SummaryKPIs {
  total_records: number;
  health_score: number;
  health_status: string;
  historical_total: number;
  forecast_total: number;
  growth_pct: number;
  forecast_avg: number;
  forecast_min: number;
  forecast_max: number;
  accuracy_score: number;
  selected_model_name: string;
  selected_model_key: string;
  champion_model_key: string;
  trend_direction: 'Upward' | 'Downward' | 'Stable';
}

export interface DriverComponent {
  name: string;
  contribution_pct: number;
  description: string;
}

export interface ExplainabilityData {
  model_name: string;
  baseline_level: number;
  trend_direction: string;
  trend_slope_pct: number;
  seasonality_summary: string;
  volatility_std: number;
  driver_components: DriverComponent[];
  causal_disclaimer: string;
  summary: string;
}

export interface GovernanceMetadata {
  run_id: string;
  timestamp: string;
  execution_time_ms: number;
  total_rows_processed: number;
  imputation_strategy: string;
  date_column: string;
  target_column: string;
  horizon_days: number;
  selected_model: string;
  champion_model: string;
  model_parameters: Record<string, any>;
  residual_std: number;
  time_series_split: string;
  determinism_note: string;
}

export interface ForecastResponse {
  status: string;
  data_health: DataHealthResult;
  cleaning_log: string[];
  summary_kpis: SummaryKPIs;
  leaderboard: LeaderboardItem[];
  champion_model_key: string;
  selected_model_key: string;
  historical_series: { date: string; actual: number }[];
  forecast: PredictionPoint[];
  all_model_forecasts: Record<string, {
    model_name: string;
    metrics: ModelMetrics;
    predictions: PredictionPoint[];
  }>;
  explainability: ExplainabilityData;
  governance_metadata: GovernanceMetadata;
}

export interface SimulatedPoint {
  date: string;
  simulated: number;
  sim_lower_95: number;
  sim_upper_95: number;
  baseline: number;
  delta_pct: number;
}

export interface SampleDatasetInfo {
  id: string;
  name: string;
  description: string;
  date_col: string;
  target_col: string;
  recommended_horizon: number;
}
