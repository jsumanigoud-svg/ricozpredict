import { SampleDatasetInfo, DataHealthResult, ForecastResponse, SimulatedPoint } from '../types/analytics';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
export async function fetchSampleDatasets(): Promise<SampleDatasetInfo[]> {
  const res = await fetch(`${API_BASE}/samples`);
  if (!res.ok) throw new Error('Failed to fetch sample datasets.');
  const data = await res.json();
  return data.samples;
}

export async function loadSampleData(sampleId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/samples/${sampleId}`);
  if (!res.ok) throw new Error(`Failed to load sample ${sampleId}`);
  return await res.json();
}

export async function uploadCSVFile(file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await fetch(`${API_BASE}/upload-csv`, {
    method: 'POST',
    body: formData,
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(err.detail || 'CSV Upload failed.');
  }
  return await res.json();
}

export async function runHealthCheck(data: any[], dateCol: string, targetCol: string): Promise<DataHealthResult> {
  const res = await fetch(`${API_BASE}/analyze-health`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data, date_col: dateCol, target_col: targetCol }),
  });
  if (!res.ok) throw new Error('Health check failed.');
  return await res.json();
}

export async function runForecastPipeline(params: {
  data: any[];
  date_col: string;
  target_col: string;
  imputation_strategy?: string;
  horizon?: number;
  selected_model_key?: string;
}): Promise<ForecastResponse> {
  const res = await fetch(`${API_BASE}/forecast/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: params.data,
      date_col: params.date_col,
      target_col: params.target_col,
      imputation_strategy: params.imputation_strategy || 'interpolate',
      horizon: params.horizon || 30,
      selected_model_key: params.selected_model_key || 'champion',
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Forecast run failed.' }));
    throw new Error(err.detail || 'Forecast execution error.');
  }

  return await res.json();
}

export async function runSimulation(params: {
  predictions: any[];
  baseline_shift_pct: number;
  trend_multiplier: number;
  shock_step: number;
  shock_magnitude_pct: number;
}): Promise<SimulatedPoint[]> {
  const res = await fetch(`${API_BASE}/forecast/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) throw new Error('Simulation calculation failed.');
  const data = await res.json();
  return data.simulated_predictions;
}
