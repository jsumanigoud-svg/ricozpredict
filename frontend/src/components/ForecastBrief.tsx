import React from 'react';
import { FileText, Trophy, Cpu, ArrowRight } from 'lucide-react';
import { SummaryKPIs, LeaderboardItem, ExplainabilityData } from '../types/analytics';

interface ForecastBriefProps {
  kpis: SummaryKPIs;
  leaderboard: LeaderboardItem[];
  selectedModelKey: string;
  championModelKey: string;
  explainability: ExplainabilityData;
  selectedHorizon: number;
  targetCol: string;
  onNavigateToArena: () => void;
}

export const ForecastBrief: React.FC<ForecastBriefProps> = ({
  kpis,
  leaderboard,
  selectedModelKey,
  championModelKey,
  explainability,
  selectedHorizon,
  targetCol,
  onNavigateToArena,
}) => {
  const activeLeaderboardItem = leaderboard.find((item) => item.model_key === selectedModelKey);
  const isChampion = selectedModelKey === championModelKey;

  return (
    <div className="bg-[#111827]/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md relative overflow-hidden">
      {/* Decorative gradient glow background */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        
        {/* Main Rationale Brief */}
        <div className="space-y-3 max-w-3xl">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
              <FileText className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-white tracking-tight">Executive Forecast Brief</h3>
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              Decision Intelligence
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            RicozPredict projects a <strong className={kpis.growth_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {kpis.trend_direction.toLowerCase()} trajectory ({kpis.growth_pct >= 0 ? '+' : ''}{kpis.growth_pct}%)
            </strong> for <strong className="text-white">{targetCol}</strong> over the next <strong className="text-white">{selectedHorizon} days</strong>. 
            Forecast values ground at a baseline of <strong className="text-indigo-300">{explainability.baseline_level.toLocaleString()}</strong> with an estimated total volume of <strong className="text-white">{kpis.forecast_total.toLocaleString()}</strong>.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
            <div className="flex items-center space-x-1.5 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-400">Model:</span>
              <strong className="text-white font-semibold">{kpis.selected_model_name}</strong>
              {isChampion ? (
                <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-bold ml-1">
                  Champion (#1)
                </span>
              ) : (
                <span className="text-[9px] bg-slate-700 text-slate-300 px-1.5 py-0.2 rounded font-mono ml-1">
                  Manual Override
                </span>
              )}
            </div>

            {activeLeaderboardItem && (
              <div className="flex items-center space-x-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 font-mono text-[11px]">
                <span className="text-slate-400 font-sans">Metrics:</span>
                <span className="text-emerald-400 font-bold">MAPE: {activeLeaderboardItem.mape}%</span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-300">RMSE: {activeLeaderboardItem.rmse}</span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-300">MAE: {activeLeaderboardItem.mae}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Button & Teaser */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-4 border-t lg:border-t-0 lg:border-l border-slate-800 pt-4 lg:pt-0 lg:pl-6 shrink-0">
          <div className="text-left lg:text-right">
            <span className="text-[11px] font-semibold text-slate-400 block">Selection Rationale</span>
            <span className="text-xs text-slate-300 font-medium">
              {isChampion ? 'Selected based on lowest validation error' : 'Selected via analyst manual override'}
            </span>
          </div>

          <button
            onClick={onNavigateToArena}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-500/20 transition-all group"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Compare in Model Arena</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
