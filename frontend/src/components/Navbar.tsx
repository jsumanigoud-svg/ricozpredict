import React from 'react';
import { Activity, ShieldCheck, Database, Layers, Sparkles } from 'lucide-react';

interface NavbarProps {
  onOpenGovernance: () => void;
  datasetName?: string;
  totalRecords?: number;
  healthScore?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenGovernance,
  datasetName,
  totalRecords,
  healthScore,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#0b0f19]/90 backdrop-blur-md border-b border-slate-800/80 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Brand & Logo */}
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[2px] shadow-lg shadow-indigo-500/20 shrink-0 mt-0.5">
            <div className="w-full h-full bg-[#0b0f19] rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                RicozPredict
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                MVP v1.0
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-200 mt-0.5">
              Explainable Business Forecasting & Decision Intelligence
            </p>
            <p className="text-[11px] text-indigo-300/90 font-mono mt-0.5">
              Forecast demand. Understand why. Simulate what happens next.
            </p>
          </div>
        </div>

        {/* Right Side Info & Governance Controls */}
        <div className="flex items-center space-x-3 self-end md:self-auto">
          {datasetName && (
            <div className="hidden lg:flex items-center space-x-3 bg-slate-900/60 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-300">
              <div className="flex items-center space-x-1.5">
                <Database className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-medium text-white">{datasetName}</span>
              </div>
              <span className="text-slate-700">|</span>
              <div className="flex items-center space-x-1 text-slate-400">
                <Layers className="w-3.5 h-3.5" />
                <span>{totalRecords} rows</span>
              </div>
              {healthScore !== undefined && (
                <>
                  <span className="text-slate-700">|</span>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-slate-400">Health:</span>
                    <span className={`font-bold px-1.5 py-0.5 rounded ${
                      healthScore >= 80 ? 'bg-emerald-500/15 text-emerald-400' :
                      healthScore >= 60 ? 'bg-amber-500/15 text-amber-400' : 'bg-rose-500/15 text-rose-400'
                    }`}>
                      {healthScore}/100
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="hidden sm:flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-xl">
            <Activity className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>FastAPI Engine Active</span>
          </div>

          <button
            onClick={onOpenGovernance}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-200 transition-all shadow-sm"
          >
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>Governance Audit</span>
          </button>
        </div>
      </div>
    </header>
  );
};
