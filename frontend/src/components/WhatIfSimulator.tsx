import React, { useState } from 'react';
import { Sliders, RotateCcw } from 'lucide-react';
import { PredictionPoint, SimulatedPoint } from '../types/analytics';

interface WhatIfSimulatorProps {
  predictions: PredictionPoint[];
  onRunSimulation: (params: {
    baseline_shift_pct: number;
    trend_multiplier: number;
    shock_step: number;
    shock_magnitude_pct: number;
  }) => void;
  simulatedData?: SimulatedPoint[];
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({
  predictions,
  onRunSimulation,
  simulatedData,
}) => {
  const [shiftPct, setShiftPct] = useState(0);
  const [trendMult, setTrendMult] = useState(1.0);
  const [shockStep, setShockStep] = useState(0);
  const [shockMagPct, setShockMagPct] = useState(0);

  const handleApply = (sPct = shiftPct, tMult = trendMult, sStep = shockStep, sMag = shockMagPct) => {
    onRunSimulation({
      baseline_shift_pct: sPct,
      trend_multiplier: tMult,
      shock_step: sStep,
      shock_magnitude_pct: sMag,
    });
  };

  const handleReset = () => {
    setShiftPct(0);
    setTrendMult(1.0);
    setShockStep(0);
    setShockMagPct(0);
    handleApply(0, 1.0, 0, 0);
  };

  const totalBase = predictions.reduce((acc, p) => acc + p.predicted, 0);
  const totalSim = simulatedData ? simulatedData.reduce((acc, p) => acc + p.simulated, 0) : totalBase;
  const deltaPct = totalBase > 0 ? ((totalSim - totalBase) / totalBase) * 100 : 0;

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">6. What-If Business Scenario Simulator</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulate business sensitivity scenarios (price adjustments, growth acceleration, marketing shocks).
          </p>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 rounded-lg border border-slate-700 transition-all self-start md:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span>Reset Scenario</span>
        </button>
      </div>

      {/* KPI Comparison Badge */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-800/50 border border-slate-700/60 rounded-xl p-4">
        <div>
          <span className="text-xs text-slate-400 font-medium">Baseline Projected Volume</span>
          <div className="text-lg font-bold text-white mt-0.5">
            {totalBase.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
        </div>

        <div>
          <span className="text-xs text-slate-400 font-medium">Simulated Scenario Volume</span>
          <div className="text-lg font-bold text-emerald-400 mt-0.5">
            {totalSim.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
        </div>

        <div>
          <span className="text-xs text-slate-400 font-medium">Simulated Impact Delta</span>
          <div className={`text-lg font-bold mt-0.5 ${deltaPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {deltaPct >= 0 ? '+' : ''}{deltaPct.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-800/40 border border-slate-700/60 rounded-xl p-5">
        
        {/* Slider 1: Baseline Shift */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold text-slate-200">Baseline Shift (% Demand / Price Lift):</label>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {shiftPct >= 0 ? '+' : ''}{shiftPct}%
            </span>
          </div>
          <input
            type="range"
            min="-30"
            max="30"
            step="1"
            value={shiftPct}
            onChange={(e) => {
              const val = Number(e.target.value);
              setShiftPct(val);
              handleApply(val, trendMult, shockStep, shockMagPct);
            }}
            className="w-full accent-emerald-500 cursor-pointer"
          />
          <p className="text-[11px] text-slate-400 mt-1">Uniform shift across entire forecast horizon.</p>
        </div>

        {/* Slider 2: Trend Multiplier */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold text-slate-200">Trend Acceleration Multiplier:</label>
            <span className="text-xs font-mono font-bold text-indigo-400">{trendMult.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.05"
            value={trendMult}
            onChange={(e) => {
              const val = Number(e.target.value);
              setTrendMult(val);
              handleApply(shiftPct, val, shockStep, shockMagPct);
            }}
            className="w-full accent-indigo-500 cursor-pointer"
          />
          <p className="text-[11px] text-slate-400 mt-1">Compounds trend slope over forecast horizon.</p>
        </div>

        {/* Slider 3: Shock Step Index */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold text-slate-200">Event Shock Horizon Step:</label>
            <span className="text-xs font-mono font-bold text-cyan-400">
              {shockStep > 0 ? `Step ${shockStep}` : 'None'}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max={predictions.length}
            step="1"
            value={shockStep}
            onChange={(e) => {
              const val = Number(e.target.value);
              setShockStep(val);
              handleApply(shiftPct, trendMult, val, shockMagPct);
            }}
            className="w-full accent-cyan-500 cursor-pointer"
          />
          <p className="text-[11px] text-slate-400 mt-1">Specific horizon day to trigger shock boost.</p>
        </div>

        {/* Slider 4: Shock Magnitude */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold text-slate-200">Event Shock Surge Magnitude (%):</label>
            <span className="text-xs font-mono font-bold text-amber-400">
              {shockMagPct >= 0 ? '+' : ''}{shockMagPct}%
            </span>
          </div>
          <input
            type="range"
            min="-50"
            max="50"
            step="5"
            value={shockMagPct}
            onChange={(e) => {
              const val = Number(e.target.value);
              setShockMagPct(val);
              handleApply(shiftPct, trendMult, shockStep, val);
            }}
            className="w-full accent-amber-500 cursor-pointer"
          />
          <p className="text-[11px] text-slate-400 mt-1">Surge boost percentage at shock step.</p>
        </div>
      </div>
    </div>
  );
};
