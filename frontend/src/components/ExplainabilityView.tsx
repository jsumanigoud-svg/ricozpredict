import React from 'react';
import { HelpCircle, ShieldAlert, TrendingUp, Cpu } from 'lucide-react';
import { ExplainabilityData } from '../types/analytics';

interface ExplainabilityViewProps {
  explainability: ExplainabilityData;
}

export const ExplainabilityView: React.FC<ExplainabilityViewProps> = ({ explainability }) => {
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-6">
      
      {/* Header */}
      <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
        <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
          <Cpu className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">5. Explainability & Driver Breakdown</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Transparent statistical rationale for <strong className="text-indigo-300">{explainability.model_name}</strong> predictions.
          </p>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          Forecast Rationale Summary
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed font-sans">{explainability.summary}</p>
      </div>

      {/* Drivers Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {explainability.driver_components.map((comp, idx) => (
          <div key={idx} className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-200">{comp.name}</span>
              <span className="text-xs font-mono font-bold text-indigo-400">{comp.contribution_pct}%</span>
            </div>

            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, Math.min(100, comp.contribution_pct))}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-400 leading-normal">{comp.description}</p>
          </div>
        ))}
      </div>

      {/* Seasonality Insights */}
      <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 flex items-start gap-3">
        <HelpCircle className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
        <div className="text-xs text-slate-300">
          <span className="font-bold text-white block mb-0.5">Seasonal & Cyclic Patterns:</span>
          <span>{explainability.seasonality_summary}</span>
        </div>
      </div>

      {/* High Visibility Causal Distinction Alert */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 text-amber-200 text-xs leading-relaxed space-y-2">
        <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
          <span>IMPORTANT: Causal Distinction & Statistical Association Notice</span>
        </div>
        <p className="text-amber-200/90">{explainability.causal_disclaimer}</p>
      </div>
    </div>
  );
};
