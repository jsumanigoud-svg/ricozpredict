import React from 'react';
import { Activity, CheckCircle, ArrowRight, Settings2 } from 'lucide-react';
import { DataHealthResult } from '../types/analytics';

interface DataHealthCardProps {
  health: DataHealthResult;
  imputationStrategy: string;
  onSelectImputation: (strategy: string) => void;
  onRunForecast: () => void;
  loading: boolean;
  cleaningLog?: string[];
}

export const DataHealthCard: React.FC<DataHealthCardProps> = ({
  health,
  imputationStrategy,
  onSelectImputation,
  onRunForecast,
  loading,
  cleaningLog,
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (score >= 65) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-6">
      
      {/* Header & Score Gauge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-4">
          <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center font-extrabold text-2xl shadow-lg ${getScoreColor(health.score)}`}>
            {health.score}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-white">2. Data Health Analysis</h2>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded border uppercase tracking-wider ${getScoreColor(health.score)}`}>
                {health.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Automated data validation across missing records, duplicates, outliers, and temporal ordering.
            </p>
          </div>
        </div>

        <button
          onClick={onRunForecast}
          disabled={loading}
          className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-600 via-indigo-600 to-indigo-500 hover:from-emerald-500 hover:to-indigo-400 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Training Model Arena...</span>
            </>
          ) : (
            <>
              <span>Run Forecasting & Model Arena</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Metrics Counters Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-medium block mb-1">Missing Values</span>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold text-white">{health.missing_count}</span>
            <span className="text-xs text-slate-400">{health.missing_pct}%</span>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-medium block mb-1">Duplicates</span>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold text-white">{health.duplicate_count}</span>
            <span className="text-xs text-slate-400">Records</span>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-medium block mb-1">Detected Outliers</span>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold text-white">{health.outlier_count}</span>
            <span className="text-xs text-slate-400">Spikes</span>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-medium block mb-1">Temporal Frequency</span>
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-bold text-indigo-300 truncate">{health.inferred_frequency}</span>
            <span className="text-xs text-slate-400">Step</span>
          </div>
        </div>
      </div>

      {/* User-Controlled Data Imputation Selector */}
      <div className="bg-slate-900/90 border border-indigo-500/20 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-indigo-400" />
            User-Controlled Data Imputation Strategy
          </h3>
          <span className="text-xs text-indigo-300 font-medium">Select cleaning strategy for gaps</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {[
            { key: 'interpolate', label: 'Linear Interpolation', desc: 'Smooth linear bridge' },
            { key: 'ffill', label: 'Forward Fill', desc: 'Carry last value forward' },
            { key: 'bfill', label: 'Backward Fill', desc: 'Carry next value back' },
            { key: 'zero', label: 'Impute Zero', desc: 'Fill missing as 0.0' },
            { key: 'mean', label: 'Impute Mean', desc: 'Fill series mean' },
            { key: 'drop', label: 'Drop Missing', desc: 'Remove gap rows' },
          ].map((strat) => (
            <button
              key={strat.key}
              onClick={() => onSelectImputation(strat.key)}
              className={`p-3 rounded-lg border text-left transition-all ${
                imputationStrategy === strat.key
                  ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md'
                  : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <div className="font-bold text-xs">{strat.label}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{strat.desc}</div>
            </button>
          ))}
        </div>

        {cleaningLog && cleaningLog.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-emerald-400 font-mono flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{cleaningLog[0]}</span>
          </div>
        )}
      </div>

      {/* Plain Language Diagnostics */}
      <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          Data Health Diagnostic Findings (Plain English)
        </h3>
        <ul className="space-y-2">
          {health.diagnostics.map((diag, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
              <span className="text-indigo-400 mt-0.5">•</span>
              <span>{diag}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
