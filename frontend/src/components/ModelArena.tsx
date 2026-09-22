import React from 'react';
import { Trophy, Zap } from 'lucide-react';
import { LeaderboardItem } from '../types/analytics';

interface ModelArenaProps {
  leaderboard: LeaderboardItem[];
  selectedModelKey: string;
  championModelKey: string;
  onSelectModel: (key: string) => void;
}

export const ModelArena: React.FC<ModelArenaProps> = ({
  leaderboard,
  selectedModelKey,
  championModelKey,
  onSelectModel,
}) => {
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white">3. Model Arena Leaderboard</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Time-series out-of-sample backtesting (80% train / 20% test). Candidate models ranked by accuracy.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/60">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Walk-Forward Cross Validation</span>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-800/80 text-slate-200 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="px-4 py-3 border-b border-slate-700/60">Rank</th>
              <th className="px-4 py-3 border-b border-slate-700/60">Model Name</th>
              <th className="px-4 py-3 border-b border-slate-700/60">MAE</th>
              <th className="px-4 py-3 border-b border-slate-700/60">RMSE</th>
              <th className="px-4 py-3 border-b border-slate-700/60">MAPE (%)</th>
              <th className="px-4 py-3 border-b border-slate-700/60">SMAPE (%)</th>
              <th className="px-4 py-3 border-b border-slate-700/60">Residual Std</th>
              <th className="px-4 py-3 border-b border-slate-700/60 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {leaderboard.map((item) => {
              const isSelected = selectedModelKey === item.model_key;
              const isChamp = championModelKey === item.model_key;

              return (
                <tr
                  key={item.model_key}
                  className={`transition-colors ${
                    isSelected
                      ? 'bg-indigo-500/10 hover:bg-indigo-500/15'
                      : 'hover:bg-slate-800/40'
                  }`}
                >
                  {/* Rank */}
                  <td className="px-4 py-3.5 font-bold">
                    {item.rank === 1 ? (
                      <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-extrabold text-xs shadow-sm">
                        #1
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono">#{item.rank}</span>
                    )}
                  </td>

                  {/* Model Name & Badge */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-sm">{item.model_name}</span>
                      {isChamp && (
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 shadow-sm">
                          <Trophy className="w-3 h-3 text-amber-400" />
                          Champion
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Metrics */}
                  <td className="px-4 py-3.5 font-mono text-slate-200">{item.mae.toFixed(2)}</td>
                  <td className="px-4 py-3.5 font-mono text-slate-200">{item.rmse.toFixed(2)}</td>
                  <td className="px-4 py-3.5 font-mono font-semibold text-emerald-400">
                    {item.mape.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3.5 font-mono text-slate-300">{item.smape.toFixed(2)}%</td>
                  <td className="px-4 py-3.5 font-mono text-slate-400">±{item.residual_std.toFixed(2)}</td>

                  {/* Select Model Button */}
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => onSelectModel(item.model_key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                      }`}
                    >
                      {isSelected ? 'Active Model' : 'Inspect Model'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
