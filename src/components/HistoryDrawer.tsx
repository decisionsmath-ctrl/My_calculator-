import React, { useState } from 'react';
import { CalculationHistoryItem } from '../types/calculator';
import { 
  History, 
  Trash2, 
  ArrowUpRight, 
  Sparkles, 
  Calculator, 
  Clock, 
  Copy, 
  Check,
  FileDown,
  Loader2
} from 'lucide-react';
import { MathDisplay } from './MathDisplay';
import { exportHistoryToPdf } from '../utils/pdfExporter';

interface HistoryDrawerProps {
  history: CalculationHistoryItem[];
  onSelectCalculation: (item: CalculationHistoryItem) => void;
  onClearHistory: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  history,
  onSelectCalculation,
  onClearHistory,
  isOpen,
  onClose,
}) => {
  const [filter, setFilter] = useState<'all' | 'arithmetic' | 'calculus'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  if (!isOpen) return null;

  const filteredHistory = history.filter((item) => {
    if (filter === 'arithmetic') return item.type === 'arithmetic';
    if (filter === 'calculus') return item.type === 'calculus';
    return true;
  });

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      await exportHistoryToPdf(filteredHistory);
    } catch (err) {
      console.error('Error exporting history to PDF:', err);
      alert('Could not export history to PDF. Please try again.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100">Calculation History</h2>
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
              {history.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <>
                <button
                  onClick={handleExportPdf}
                  disabled={isExportingPdf}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/40 flex items-center gap-1 transition disabled:opacity-50"
                  title="Export history as PDF report"
                >
                  {isExportingPdf ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileDown className="w-3.5 h-3.5" />
                  )}
                  <span>{isExportingPdf ? 'Exporting...' : 'Export PDF'}</span>
                </button>

                <button
                  onClick={onClearHistory}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                  title="Clear History"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
            >
              Close
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="p-3 border-b border-slate-800/80 bg-slate-950/40 flex items-center gap-2 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              filter === 'all'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({history.length})
          </button>
          <button
            onClick={() => setFilter('arithmetic')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              filter === 'arithmetic'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Arithmetic
          </button>
          <button
            onClick={() => setFilter('calculus')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              filter === 'calculus'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            AI Calculus
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredHistory.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
              <Clock className="w-10 h-10 stroke-1 text-slate-600" />
              <p className="text-sm font-medium">No calculations yet</p>
              <p className="text-xs max-w-xs text-slate-500">
                Perform arithmetic or ask calculus questions to see your calculation log here.
              </p>
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div
                key={item.id}
                className="bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 space-y-2 transition group"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    {item.type === 'calculus' ? (
                      <span className="flex items-center gap-1 text-cyan-400 font-semibold bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                        <Sparkles className="w-3 h-3" />
                        AI Calculus
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-slate-300 font-semibold bg-slate-800 px-1.5 py-0.5 rounded">
                        <Calculator className="w-3 h-3 text-cyan-400" />
                        Arithmetic
                      </span>
                    )}
                    <span className="text-slate-500">{formatTime(item.timestamp)}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopy(item.id, item.result)}
                      className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                      title="Copy result"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        onSelectCalculation(item);
                        onClose();
                      }}
                      className="p-1 rounded text-cyan-400 hover:bg-cyan-950/60 transition"
                      title="Recall into workspace"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expression */}
                <div className="text-sm font-mono text-slate-300 break-all">
                  {item.expression}
                </div>

                {/* Result */}
                <div className="text-base font-bold text-cyan-300 bg-slate-900/80 rounded-lg p-2 border border-slate-800/80 overflow-x-auto">
                  {item.latex ? (
                    <MathDisplay latex={item.latex} displayMode={false} />
                  ) : (
                    <span>= {item.result}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
