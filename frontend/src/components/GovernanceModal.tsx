import React from 'react';
import { X, ShieldCheck, Cpu, CheckCircle } from 'lucide-react';
import { GovernanceMetadata } from '../types/analytics';

interface GovernanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  metadata?: GovernanceMetadata;
}

export const GovernanceModal: React.FC<GovernanceModalProps> = ({ isOpen, onClose, metadata }) => {
  if (!isOpen || !metadata) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Forecast Governance & Audit Log</h3>
              <p className="text-xs text-slate-400">Execution run audit trail and reproducibility parameters</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audit Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3.5 space-y-2">
            <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Run Identification</span>
            <div className="flex justify-between font-mono"><span className="text-slate-400">Run ID:</span> <span className="text-indigo-300 font-bold">{metadata.run_id}</span></div>
            <div className="flex justify-between font-mono"><span className="text-slate-400">Timestamp:</span> <span className="text-white">{metadata.timestamp}</span></div>
            <div className="flex justify-between font-mono"><span className="text-slate-400">Execution Latency:</span> <span className="text-emerald-400 font-bold">{metadata.execution_time_ms} ms</span></div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3.5 space-y-2">
            <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Data Specifications</span>
            <div className="flex justify-between font-mono"><span className="text-slate-400">Total Rows Processed:</span> <span className="text-white">{metadata.total_rows_processed}</span></div>
            <div className="flex justify-between font-mono"><span className="text-slate-400">Imputation Strategy:</span> <span className="text-cyan-300 capitalize">{metadata.imputation_strategy}</span></div>
            <div className="flex justify-between font-mono"><span className="text-slate-400">Target Metric:</span> <span className="text-white">{metadata.target_column}</span></div>
          </div>
        </div>

        {/* Model Audit Details */}
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 text-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-indigo-400" /> Active Model: {metadata.selected_model}
            </span>
            <span className="text-slate-400 font-mono">Champion: {metadata.champion_model}</span>
          </div>

          <div className="font-mono bg-slate-950/80 p-3 rounded-lg border border-slate-800 text-slate-300 text-[11px] overflow-x-auto">
            {JSON.stringify(metadata.model_parameters, null, 2)}
          </div>
        </div>

        {/* Reproducibility Note */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-emerald-300">
          <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <span className="font-bold block mb-0.5">Audit & Determinism Status:</span>
            <span>{metadata.determinism_note} Split: {metadata.time_series_split}.</span>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all"
          >
            Close Audit View
          </button>
        </div>
      </div>
    </div>
  );
};
