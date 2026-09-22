import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { LineChart, Eye } from 'lucide-react';
import { PredictionPoint, SimulatedPoint } from '../types/analytics';

interface ForecastChartProps {
  historical: { date: string; actual: number }[];
  forecast: PredictionPoint[];
  simulated?: SimulatedPoint[];
  selectedHorizon: number;
  onSelectHorizon: (h: number) => void;
  selectedModelName: string;
}

interface ChartDataPoint {
  date: string;
  Actual: number | null;
  Forecast: number | null;
  LowerBound: number | null;
  UpperBound: number | null;
  BandRange: [number, number] | null;
  Simulated: number | null;
}

export const ForecastChart: React.FC<ForecastChartProps> = ({
  historical,
  forecast,
  simulated,
  selectedHorizon,
  onSelectHorizon,
  selectedModelName,
}) => {
  const [bandConfidence, setBandConfidence] = useState<'80' | '95'>('95');

  // Combine historical and forecast data into unified chart data array
  const chartData: ChartDataPoint[] = [
    ...historical.map((h) => ({
      date: h.date,
      Actual: h.actual,
      Forecast: null,
      LowerBound: null,
      UpperBound: null,
      BandRange: null,
      Simulated: null,
    })),
    ...forecast.map((f, idx) => {
      const simPt = simulated && simulated[idx] ? simulated[idx].simulated : null;
      const lower = bandConfidence === '95' ? f.lower_95 : f.lower_80;
      const upper = bandConfidence === '95' ? f.upper_95 : f.upper_80;

      return {
        date: f.date,
        Actual: null,
        Forecast: f.predicted,
        LowerBound: lower,
        UpperBound: upper,
        BandRange: [lower, upper] as [number, number],
        Simulated: simPt,
      };
    }),
  ];

  // Connect last historical point to first forecast point for smooth rendering
  if (historical.length > 0 && forecast.length > 0) {
    const lastHist = historical[historical.length - 1];
    chartData[historical.length - 1] = {
      ...chartData[historical.length - 1],
      Forecast: lastHist.actual,
      LowerBound: lastHist.actual,
      UpperBound: lastHist.actual,
      BandRange: [lastHist.actual, lastHist.actual] as [number, number],
      Simulated: lastHist.actual,
    };
  }

  const cutoverDate = historical.length > 0 ? historical[historical.length - 1].date : '';

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <LineChart className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">4. Interactive Forecast Visualization</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Historical observations vs <strong className="text-indigo-300">{selectedModelName}</strong> predictions with prediction intervals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Horizon Selector */}
          <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            {[7, 30, 90].map((h) => (
              <button
                key={h}
                onClick={() => onSelectHorizon(h)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  selectedHorizon === h
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {h} Days
              </button>
            ))}
          </div>

          {/* Confidence Interval Toggle */}
          <div className="flex items-center space-x-2 bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-700/60 text-xs">
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-300 font-medium">Bands:</span>
            <button
              onClick={() => setBandConfidence('80')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                bandConfidence === '80' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              80%
            </button>
            <button
              onClick={() => setBandConfidence('95')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                bandConfidence === '95' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              95%
            </button>
          </div>
        </div>
      </div>

      {/* Main Recharts Container */}
      <div className="h-[400px] w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
            <defs>
              <linearGradient id="forecastBandGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            
            <XAxis
              dataKey="date"
              stroke="#64748b"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickMargin={10}
            />
            
            <YAxis
              stroke="#64748b"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              domain={['auto', 'auto']}
              tickFormatter={(val) => Number(val).toLocaleString()}
            />
            
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '12px',
                color: '#f8fafc',
                fontSize: '12px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
              }}
              formatter={(value: any, name: string) => {
                if (value === null || value === undefined) return [null, name];
                return [Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 }), name];
              }}
            />
            
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', paddingTop: '0px' }} />

            {/* Historical Cutover Line */}
            {cutoverDate && (
              <ReferenceLine
                x={cutoverDate}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                label={{ value: 'Forecast Cutover', fill: '#f59e0b', fontSize: 11, position: 'top' }}
              />
            )}

            {/* Prediction Interval Shaded Band */}
            <Area
              type="monotone"
              dataKey="BandRange"
              stroke="none"
              fill="url(#forecastBandGrad)"
              name={`${bandConfidence}% Prediction Band`}
            />

            {/* Actual Line */}
            <Line
              type="monotone"
              dataKey="Actual"
              stroke="#06b6d4"
              strokeWidth={2.5}
              dot={{ r: 2.5, fill: '#06b6d4' }}
              activeDot={{ r: 6 }}
              name="Historical Actuals"
            />

            {/* Selected Model Forecast Line */}
            <Line
              type="monotone"
              dataKey="Forecast"
              stroke="#818cf8"
              strokeWidth={3}
              strokeDasharray="4 4"
              dot={{ r: 3, fill: '#818cf8' }}
              activeDot={{ r: 6 }}
              name={`${selectedModelName} Forecast`}
            />

            {/* Simulated Scenario Overlay Line */}
            {simulated && (
              <Line
                type="monotone"
                dataKey="Simulated"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 3, fill: '#10b981' }}
                activeDot={{ r: 6 }}
                name="Simulated Scenario"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
