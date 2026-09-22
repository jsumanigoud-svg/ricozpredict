import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  LineChart,
  Cpu,
  Sliders,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

import { Navbar } from './components/Navbar';
import { DataIngestion } from './components/DataIngestion';
import { DataHealthCard } from './components/DataHealthCard';
import { ModelArena } from './components/ModelArena';
import { ForecastChart } from './components/ForecastChart';
import { ForecastBrief } from './components/ForecastBrief';
import { ExplainabilityView } from './components/ExplainabilityView';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { GovernanceModal } from './components/GovernanceModal';

import {
  SampleDatasetInfo,
  DataHealthResult,
  ForecastResponse,
  SimulatedPoint,
} from './types/analytics';

import {
  fetchSampleDatasets,
  loadSampleData,
  uploadCSVFile,
  runHealthCheck,
  runForecastPipeline,
  runSimulation,
} from './utils/api';

export const App: React.FC = () => {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'ingestion' | 'forecast' | 'explainability' | 'simulator'>('forecast');
  
  // Data State
  const [samples, setSamples] = useState<SampleDatasetInfo[]>([]);
  const [currentDatasetName, setCurrentDatasetName] = useState<string>('E-Commerce Daily Sales');
  const [datasetRows, setDatasetRows] = useState<any[]>([]);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [columnTypes, setColumnTypes] = useState<Record<string, string>>({});
  const [dateCol, setDateCol] = useState<string>('Date');
  const [targetCol, setTargetCol] = useState<string>('Revenue');
  const [imputationStrategy, setImputationStrategy] = useState<string>('interpolate');
  const [selectedHorizon, setSelectedHorizon] = useState<number>(30);

  // Pipeline Output State
  const [healthData, setHealthData] = useState<DataHealthResult | null>(null);
  const [forecastOutput, setForecastOutput] = useState<ForecastResponse | null>(null);
  const [selectedModelKey, setSelectedModelKey] = useState<string>('champion');
  const [simulatedPoints, setSimulatedPoints] = useState<SimulatedPoint[] | undefined>(undefined);

  // UI State
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [governanceOpen, setGovernanceOpen] = useState<boolean>(false);

  // Load sample list and initial default dataset on startup
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const sampleList = await fetchSampleDatasets();
        setSamples(sampleList);

        // Load first demo dataset automatically
        if (sampleList.length > 0) {
          await handleSelectSample(sampleList[0].id);
        }
      } catch (err: any) {
        setErrorMsg('Failed to connect to backend engine. Ensure FastAPI server is running on port 8000.');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Handler: Select Demo Dataset
  const handleSelectSample = async (sampleId: string) => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await loadSampleData(sampleId);
      
      setCurrentDatasetName(res.id.replace(/_/g, ' ').toUpperCase());
      setDatasetRows(res.data);
      setPreviewRows(res.data.slice(0, 15));
      setColumns(res.columns);
      setDateCol(res.date_col);
      setTargetCol(res.target_col);

      // Run health check and forecast pipeline
      const health = await runHealthCheck(res.data, res.date_col, res.target_col);
      setHealthData(health);

      const forecastRes = await runForecastPipeline({
        data: res.data,
        date_col: res.date_col,
        target_col: res.target_col,
        imputation_strategy: imputationStrategy,
        horizon: selectedHorizon,
        selected_model_key: 'champion',
      });

      setForecastOutput(forecastRes);
      setSelectedModelKey(forecastRes.champion_model_key);
      setSimulatedPoints(undefined);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error loading sample dataset.');
    } finally {
      setLoading(false);
    }
  };

  // Handler: Upload Custom CSV File
  const handleFileUpload = async (file: File) => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await uploadCSVFile(file);

      setCurrentDatasetName(res.filename);
      setDatasetRows(res.data);
      setPreviewRows(res.preview);
      setColumns(res.columns);
      setColumnTypes(res.column_types || {});
      setDateCol(res.suggested_date_col);
      setTargetCol(res.suggested_target_col);

      const health = await runHealthCheck(res.data, res.suggested_date_col, res.suggested_target_col);
      setHealthData(health);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error processing uploaded CSV.');
    } finally {
      setLoading(false);
    }
  };

  // Handler: Run Health Diagnostic
  const handleConfirmAndAnalyze = async () => {
    if (!dateCol || !targetCol || datasetRows.length === 0) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      const health = await runHealthCheck(datasetRows, dateCol, targetCol);
      setHealthData(health);
      setActiveTab('ingestion');
    } catch (err: any) {
      setErrorMsg(err.message || 'Health check error.');
    } finally {
      setLoading(false);
    }
  };

  // Handler: Execute Forecast Pipeline
  const handleExecuteForecast = async (
    modelKey = selectedModelKey,
    horizon = selectedHorizon,
    impStrategy = imputationStrategy
  ) => {
    if (!dateCol || !targetCol || datasetRows.length === 0) return;
    try {
      setLoading(true);
      setErrorMsg(null);

      const res = await runForecastPipeline({
        data: datasetRows,
        date_col: dateCol,
        target_col: targetCol,
        imputation_strategy: impStrategy,
        horizon: horizon,
        selected_model_key: modelKey,
      });

      setForecastOutput(res);
      setSelectedModelKey(res.selected_model_key);
      setSimulatedPoints(undefined);
      setActiveTab('forecast');
    } catch (err: any) {
      setErrorMsg(err.message || 'Forecast pipeline execution failed.');
    } finally {
      setLoading(false);
    }
  };

  // Handler: Select Model
  const handleSelectModel = (key: string) => {
    setSelectedModelKey(key);
    handleExecuteForecast(key, selectedHorizon, imputationStrategy);
  };

  // Handler: Horizon Change
  const handleHorizonChange = (h: number) => {
    setSelectedHorizon(h);
    handleExecuteForecast(selectedModelKey, h, imputationStrategy);
  };

  // Handler: Imputation Strategy Change
  const handleImputationChange = (strat: string) => {
    setImputationStrategy(strat);
    handleExecuteForecast(selectedModelKey, selectedHorizon, strat);
  };

  // Handler: What-If Simulation
  const handleRunSimulation = async (params: {
    baseline_shift_pct: number;
    trend_multiplier: number;
    shock_step: number;
    shock_magnitude_pct: number;
  }) => {
    if (!forecastOutput) return;
    try {
      const simResults = await runSimulation({
        predictions: forecastOutput.forecast,
        ...params,
      });
      setSimulatedPoints(simResults);
    } catch (err: any) {
      setErrorMsg('Simulation calculation error.');
    }
  };

  const kpis = forecastOutput?.summary_kpis;
  const activeLeaderboardItem = forecastOutput?.leaderboard.find((item) => item.model_key === selectedModelKey);
  const isChampion = selectedModelKey === forecastOutput?.champion_model_key;

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans">
      
      {/* Navbar Header */}
      <Navbar
        onOpenGovernance={() => setGovernanceOpen(true)}
        datasetName={currentDatasetName}
        totalRecords={datasetRows.length}
        healthScore={healthData?.score}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8">
        
        {/* Error Alert Message */}
        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-center justify-between text-rose-300 text-sm shadow-lg">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-xs bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 px-3 py-1 rounded-lg font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Executive 6 KPI Summary Cards */}
        {kpis && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            
            {/* KPI 1: Data Health */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Data Health
              </span>
              <div>
                <div className="flex items-baseline justify-between">
                  <span className={`text-2xl font-extrabold ${
                    kpis.health_score >= 80 ? 'text-emerald-400' : kpis.health_score >= 60 ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {kpis.health_score}/100
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium block mt-1">
                  Status: <strong className="text-slate-200">{kpis.health_status}</strong>
                </span>
              </div>
            </div>

            {/* KPI 2: Historical Revenue / Metric */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1 truncate">
                Historical {targetCol}
              </span>
              <div>
                <div className="text-2xl font-extrabold text-white">
                  {kpis.historical_total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
                <span className="text-[11px] text-slate-400 block mt-1">
                  {kpis.total_records} observations
                </span>
              </div>
            </div>

            {/* KPI 3: Forecast Change */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Forecast Change
              </span>
              <div>
                <div className={`text-2xl font-extrabold flex items-center space-x-1 ${
                  kpis.growth_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {kpis.growth_pct >= 0 ? <TrendingUp className="w-5 h-5 shrink-0" /> : <TrendingDown className="w-5 h-5 shrink-0" />}
                  <span>{kpis.growth_pct >= 0 ? '+' : ''}{kpis.growth_pct}%</span>
                </div>
                <span className="text-[11px] text-slate-400 block mt-1">
                  {selectedHorizon}D Vol: {kpis.forecast_total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            {/* KPI 4: Model Performance (Explicit Metrics: MAPE %, RMSE, MAE, sMAPE) */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Model Performance
              </span>
              <div>
                <div className="text-xl font-extrabold text-indigo-400 font-mono">
                  MAPE: {activeLeaderboardItem ? activeLeaderboardItem.mape : (100 - kpis.accuracy_score).toFixed(2)}%
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-1 space-y-0.5">
                  <div className="flex justify-between">
                    <span>RMSE: <strong className="text-slate-200">{activeLeaderboardItem?.rmse ?? 'N/A'}</strong></span>
                    <span>MAE: <strong className="text-slate-200">{activeLeaderboardItem?.mae ?? 'N/A'}</strong></span>
                  </div>
                  <div>
                    <span>sMAPE: <strong className="text-slate-300">{activeLeaderboardItem?.smape ?? 'N/A'}%</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* KPI 5: Champion Model */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-col justify-between relative">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Champion Model
              </span>
              <div>
                <div className="text-sm font-extrabold text-amber-300 truncate">
                  {kpis.selected_model_name}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                  {isChampion ? 'Selected based on lowest validation error.' : 'Manual analyst override selected.'}
                </p>
                <button
                  onClick={() => setActiveTab('forecast')}
                  className="mt-1.5 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                >
                  <span>View Arena</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* KPI 6: Trend */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Trend
              </span>
              <div>
                <div className="text-sm font-extrabold text-cyan-300">
                  {kpis.trend_direction} Trajectory
                </div>
                <span className="text-[11px] text-slate-400 block mt-1">
                  {selectedHorizon}-day projected trajectory
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Forecast Brief Section */}
        {forecastOutput && (
          <ForecastBrief
            kpis={forecastOutput.summary_kpis}
            leaderboard={forecastOutput.leaderboard}
            selectedModelKey={selectedModelKey}
            championModelKey={forecastOutput.champion_model_key}
            explainability={forecastOutput.explainability}
            selectedHorizon={selectedHorizon}
            targetCol={targetCol}
            onNavigateToArena={() => setActiveTab('forecast')}
          />
        )}

        {/* Dashboard Tabbed Navigation */}
        <div className="flex border-b border-slate-800 space-x-8 overflow-x-auto scrollbar-none">
          {[
            { id: 'ingestion', label: '1. Ingestion & Health', icon: FileSpreadsheet },
            { id: 'forecast', label: '2. Forecast & Model Arena', icon: LineChart },
            { id: 'explainability', label: '3. Explainability', icon: Cpu },
            { id: 'simulator', label: '4. What-If Simulator', icon: Sliders },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 pb-4 border-b-2 font-semibold text-sm transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Data Ingestion & Data Health */}
        {activeTab === 'ingestion' && (
          <div className="space-y-8">
            <DataIngestion
              samples={samples}
              onSelectSample={handleSelectSample}
              onFileUpload={handleFileUpload}
              columns={columns}
              columnTypes={columnTypes}
              selectedDateCol={dateCol}
              selectedTargetCol={targetCol}
              onSelectDateCol={setDateCol}
              onSelectTargetCol={setTargetCol}
              previewData={previewRows}
              totalRows={datasetRows.length}
              onConfirmAndAnalyze={handleConfirmAndAnalyze}
              loading={loading}
            />

            {healthData && (
              <DataHealthCard
                health={healthData}
                imputationStrategy={imputationStrategy}
                onSelectImputation={handleImputationChange}
                onRunForecast={() => handleExecuteForecast()}
                loading={loading}
                cleaningLog={forecastOutput?.cleaning_log}
              />
            )}
          </div>
        )}

        {/* Tab 2: Forecast & Model Arena */}
        {activeTab === 'forecast' && forecastOutput && (
          <div className="space-y-8">
            <ForecastChart
              historical={forecastOutput.historical_series}
              forecast={forecastOutput.forecast}
              simulated={simulatedPoints}
              selectedHorizon={selectedHorizon}
              onSelectHorizon={handleHorizonChange}
              selectedModelName={forecastOutput.summary_kpis.selected_model_name}
            />

            <ModelArena
              leaderboard={forecastOutput.leaderboard}
              selectedModelKey={selectedModelKey}
              championModelKey={forecastOutput.champion_model_key}
              onSelectModel={handleSelectModel}
            />
          </div>
        )}

        {/* Tab 3: Explainability */}
        {activeTab === 'explainability' && forecastOutput && (
          <ExplainabilityView explainability={forecastOutput.explainability} />
        )}

        {/* Tab 4: What-If Simulator */}
        {activeTab === 'simulator' && forecastOutput && (
          <div className="space-y-8">
            <WhatIfSimulator
              predictions={forecastOutput.forecast}
              onRunSimulation={handleRunSimulation}
              simulatedData={simulatedPoints}
            />

            <ForecastChart
              historical={forecastOutput.historical_series}
              forecast={forecastOutput.forecast}
              simulated={simulatedPoints}
              selectedHorizon={selectedHorizon}
              onSelectHorizon={handleHorizonChange}
              selectedModelName={forecastOutput.summary_kpis.selected_model_name}
            />
          </div>
        )}
      </main>

      {/* Governance Audit Modal */}
      <GovernanceModal
        isOpen={governanceOpen}
        onClose={() => setGovernanceOpen(false)}
        metadata={forecastOutput?.governance_metadata}
      />
    </div>
  );
};

export default App;
