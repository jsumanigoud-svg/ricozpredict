import React, { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, ArrowRight, Table, Sparkles } from 'lucide-react';
import { SampleDatasetInfo } from '../types/analytics';

interface DataIngestionProps {
  samples: SampleDatasetInfo[];
  onSelectSample: (sampleId: string) => void;
  onFileUpload: (file: File) => void;
  columns: string[];
  columnTypes?: Record<string, string>;
  selectedDateCol: string;
  selectedTargetCol: string;
  onSelectDateCol: (col: string) => void;
  onSelectTargetCol: (col: string) => void;
  previewData: any[];
  totalRows: number;
  onConfirmAndAnalyze: () => void;
  loading: boolean;
}

export const DataIngestion: React.FC<DataIngestionProps> = ({
  samples,
  onSelectSample,
  onFileUpload,
  columns,
  columnTypes,
  selectedDateCol,
  selectedTargetCol,
  onSelectDateCol,
  onSelectTargetCol,
  previewData,
  totalRows,
  onConfirmAndAnalyze,
  loading,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState<'sample' | 'upload'>('sample');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Options Bar */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
              1. Data Ingestion & Setup
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Select a pre-packaged business dataset or upload your own CSV file.
            </p>
          </div>

          <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 self-start md:self-auto">
            <button
              onClick={() => setActiveTab('sample')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'sample'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Demo Datasets
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'upload'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Upload Custom CSV
            </button>
          </div>
        </div>

        {/* Tab 1: Demo Datasets Cards */}
        {activeTab === 'sample' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
            {samples.map((s) => (
              <div
                key={s.id}
                onClick={() => onSelectSample(s.id)}
                className="group relative bg-slate-800/50 hover:bg-slate-800/90 border border-slate-700/80 hover:border-indigo-500/80 rounded-xl p-5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/10"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                    {s.id.replace('_', ' ')}
                  </span>
                  <Sparkles className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                </div>
                <h3 className="font-bold text-white text-base mb-1 group-hover:text-indigo-200">
                  {s.name}
                </h3>
                <p className="text-xs text-slate-400 mb-4 line-clamp-2">{s.description}</p>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-700/50">
                  <span>Target: <strong className="text-slate-200">{s.target_col}</strong></span>
                  <span className="text-indigo-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Load Dataset <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Upload CSV */}
        {activeTab === 'upload' && (
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`mt-6 border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
              dragActive
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-slate-700 hover:border-slate-600 bg-slate-800/30'
            }`}
          >
            <input
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="hidden"
              id="csv-file-input"
            />
            <label htmlFor="csv-file-input" className="cursor-pointer">
              <Upload className="w-10 h-10 mx-auto text-indigo-400 mb-3" />
              <h3 className="text-sm font-semibold text-white">Drag & drop your CSV file here</h3>
              <p className="text-xs text-slate-400 mt-1">Supports standard CSV format with headers</p>
              <span className="inline-block mt-4 text-xs font-semibold px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all shadow-md">
                Browse CSV File
              </span>
            </label>
          </div>
        )}

        {/* Column Mapping Selector */}
        {columns.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-800 bg-slate-900/90 rounded-xl p-5 border border-indigo-500/20">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Map Key Columns for Forecasting
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Timestamp / Date Column:
                </label>
                <select
                  value={selectedDateCol}
                  onChange={(e) => onSelectDateCol(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {columns.map((c) => (
                    <option key={c} value={c}>
                      {c} {columnTypes && columnTypes[c] ? `(${columnTypes[c]})` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">Chronological time index column</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Target Variable (To Forecast):
                </label>
                <select
                  value={selectedTargetCol}
                  onChange={(e) => onSelectTargetCol(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {columns.map((c) => (
                    <option key={c} value={c}>
                      {c} {columnTypes && columnTypes[c] ? `(${columnTypes[c]})` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">Numeric value series to analyze and predict</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={onConfirmAndAnalyze}
                disabled={loading || !selectedDateCol || !selectedTargetCol}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Analyzing Data Health...</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Data Health Check</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dataset Preview Table */}
      {previewData.length > 0 && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Table className="w-4 h-4 text-indigo-400" />
              Dataset Preview ({totalRows} total rows)
            </h3>
            <span className="text-xs text-slate-400">Showing first {previewData.length} records</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-200 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  {columns.map((col) => (
                    <th key={col} className="px-4 py-3 border-b border-slate-700/60">
                      {col}
                      {col === selectedDateCol && (
                        <span className="ml-1 text-[9px] text-cyan-400 bg-cyan-400/10 px-1 py-0.5 rounded">DATE</span>
                      )}
                      {col === selectedTargetCol && (
                        <span className="ml-1 text-[9px] text-emerald-400 bg-emerald-400/10 px-1 py-0.5 rounded">TARGET</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {previewData.slice(0, 10).map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    {columns.map((col) => (
                      <td key={col} className="px-4 py-2.5 font-mono text-[12px] text-slate-200">
                        {row[col] !== null && row[col] !== undefined ? String(row[col]) : <span className="text-rose-400 font-bold">NaN</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
