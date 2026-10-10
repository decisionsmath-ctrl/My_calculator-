import React from 'react';
import { AngleMode } from '../types/calculator';
import { Delete, Sparkles } from 'lucide-react';

interface ScientificKeypadProps {
  onInsert: (value: string) => void;
  onClear: () => void;
  onBackspace: () => void;
  onCalculate: () => void;
  onSolveWithAI: () => void;
  angleMode: AngleMode;
  onToggleAngleMode: () => void;
  isSecondMode: boolean;
  onToggleSecondMode: () => void;
  onMemoryAction: (action: 'MC' | 'MR' | 'M+' | 'M-' | 'MS') => void;
  hasMemory: boolean;
}

export const ScientificKeypad: React.FC<ScientificKeypadProps> = ({
  onInsert,
  onClear,
  onBackspace,
  onCalculate,
  onSolveWithAI,
  angleMode,
  onToggleAngleMode,
  isSecondMode,
  onToggleSecondMode,
  onMemoryAction,
  hasMemory,
}) => {
  return (
    <div className="space-y-2 select-none">
      {/* Top Utility Bar: Deg/Rad, 2nd, Memory */}
      <div className="grid grid-cols-7 gap-1.5 text-xs">
        <button
          onClick={onToggleAngleMode}
          className={`py-2 px-1 rounded-xl font-bold transition flex items-center justify-center border ${
            angleMode === 'DEG'
              ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
          }`}
          title="Toggle Angle Unit (Degrees vs Radians)"
        >
          {angleMode}
        </button>

        <button
          onClick={onToggleSecondMode}
          className={`py-2 px-1 rounded-xl font-bold transition flex items-center justify-center border ${
            isSecondMode
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-slate-800 text-slate-400 border-slate-700/60 hover:text-slate-200'
          }`}
          title="2nd / Inverse Functions"
        >
          2nd
        </button>

        <button
          onClick={() => onMemoryAction('MC')}
          disabled={!hasMemory}
          className="py-2 px-1 rounded-xl font-medium bg-slate-800/80 text-slate-400 border border-slate-700/60 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:hover:text-slate-400 transition"
        >
          MC
        </button>
        <button
          onClick={() => onMemoryAction('MR')}
          disabled={!hasMemory}
          className="py-2 px-1 rounded-xl font-medium bg-slate-800/80 text-slate-400 border border-slate-700/60 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:hover:text-slate-400 transition"
        >
          MR
        </button>
        <button
          onClick={() => onMemoryAction('M+')}
          className="py-2 px-1 rounded-xl font-medium bg-slate-800/80 text-slate-300 border border-slate-700/60 hover:text-cyan-300 hover:bg-slate-800 transition"
        >
          M+
        </button>
        <button
          onClick={() => onMemoryAction('M-')}
          className="py-2 px-1 rounded-xl font-medium bg-slate-800/80 text-slate-300 border border-slate-700/60 hover:text-cyan-300 hover:bg-slate-800 transition"
        >
          M-
        </button>
        <button
          onClick={() => onMemoryAction('MS')}
          className="py-2 px-1 rounded-xl font-medium bg-slate-800/80 text-slate-300 border border-slate-700/60 hover:text-cyan-300 hover:bg-slate-800 transition"
        >
          MS
        </button>
      </div>

      {/* Scientific Functions Grid */}
      <div className="grid grid-cols-5 gap-1.5 text-sm">
        {/* Trig Row */}
        <button
          onClick={() => onInsert(isSecondMode ? 'asin(' : 'sin(')}
          className="py-2.5 rounded-xl font-medium bg-slate-800/90 text-cyan-200 border border-slate-700/60 hover:bg-slate-700 active:scale-95 transition"
        >
          {isSecondMode ? 'sin⁻¹' : 'sin'}
        </button>
        <button
          onClick={() => onInsert(isSecondMode ? 'acos(' : 'cos(')}
          className="py-2.5 rounded-xl font-medium bg-slate-800/90 text-cyan-200 border border-slate-700/60 hover:bg-slate-700 active:scale-95 transition"
        >
          {isSecondMode ? 'cos⁻¹' : 'cos'}
        </button>
        <button
          onClick={() => onInsert(isSecondMode ? 'atan(' : 'tan(')}
          className="py-2.5 rounded-xl font-medium bg-slate-800/90 text-cyan-200 border border-slate-700/60 hover:bg-slate-700 active:scale-95 transition"
        >
          {isSecondMode ? 'tan⁻¹' : 'tan'}
        </button>
        <button
          onClick={() => onInsert(isSecondMode ? 'exp(' : 'ln(')}
          className="py-2.5 rounded-xl font-medium bg-slate-800/90 text-cyan-200 border border-slate-700/60 hover:bg-slate-700 active:scale-95 transition"
        >
          {isSecondMode ? 'eˣ' : 'ln'}
        </button>
        <button
          onClick={() => onInsert(isSecondMode ? '10^(' : 'log(')}
          className="py-2.5 rounded-xl font-medium bg-slate-800/90 text-cyan-200 border border-slate-700/60 hover:bg-slate-700 active:scale-95 transition"
        >
          {isSecondMode ? '10ˣ' : 'log₁₀'}
        </button>

        {/* Hyperbolic / Powers Row */}
        <button
          onClick={() => onInsert(isSecondMode ? 'sinh(' : 'x^2')}
          className="py-2.5 rounded-xl font-medium bg-slate-800/90 text-slate-300 border border-slate-700/60 hover:bg-slate-700 active:scale-95 transition"
        >
          {isSecondMode ? 'sinh' : 'x²'}
        </button>
        <button
          onClick={() => onInsert(isSecondMode ? 'cosh(' : 'x^3')}
          className="py-2.5 rounded-xl font-medium bg-slate-800/90 text-slate-300 border border-slate-700/60 hover:bg-slate-700 active:scale-95 transition"
        >
          {isSecondMode ? 'cosh' : 'x³'}
        </button>
        <button
          onClick={() => onInsert('^')}
          className="py-2.5 rounded-xl font-medium bg-slate-800/90 text-slate-300 border border-slate-700/60 hover:bg-slate-700 active:scale-95 transition"
        >
          xʸ
        </button>
        <button
          onClick={() => onInsert(isSecondMode ? 'cbrt(' : 'sqrt(')}
          className="py-2.5 rounded-xl font-medium bg-slate-800/90 text-slate-300 border border-slate-700/60 hover:bg-slate-700 active:scale-95 transition"
        >
          {isSecondMode ? '∛x' : '√x'}
        </button>
        <button
          onClick={() => onInsert('^(-1)')}
          className="py-2.5 rounded-xl font-medium bg-slate-800/90 text-slate-300 border border-slate-700/60 hover:bg-slate-700 active:scale-95 transition"
        >
          1/x
        </button>

        {/* Constants & Parentheses */}
        <button
          onClick={() => onInsert('pi')}
          className="py-2.5 rounded-xl font-medium bg-slate-800/90 text-slate-300 border border-slate-700/60 hover:bg-slate-700 active:scale-95 transition font-serif"
        >
          π
        </button>
        <button
          onClick={() => onInsert('e')}
          className="py-2.5 rounded-xl font-medium bg-slate-800/90 text-slate-300 border border-slate-700/60 hover:bg-slate-700 active:scale-95 transition font-serif"
        >
          e
        </button>
        <button
          onClick={() => onInsert('(')}
          className="py-2.5 rounded-xl font-medium bg-slate-800/90 text-slate-300 border border-slate-700/60 hover:bg-slate-700 active:scale-95 transition"
        >
          (
        </button>
        <button
          onClick={() => onInsert(')')}
          className="py-2.5 rounded-xl font-medium bg-slate-800/90 text-slate-300 border border-slate-700/60 hover:bg-slate-700 active:scale-95 transition"
        >
          )
        </button>
        <button
          onClick={() => onInsert('!')}
          className="py-2.5 rounded-xl font-medium bg-slate-800/90 text-slate-300 border border-slate-700/60 hover:bg-slate-700 active:scale-95 transition"
        >
          n!
        </button>
      </div>

      {/* Main Standard Keypad (Numbers & Operators) */}
      <div className="grid grid-cols-4 gap-2 pt-2 text-base font-semibold">
        {/* Row 1 */}
        <button
          onClick={onClear}
          className="py-3.5 rounded-2xl bg-rose-950/40 text-rose-300 border border-rose-800/40 hover:bg-rose-900/40 active:scale-95 transition"
        >
          AC
        </button>
        <button
          onClick={onBackspace}
          className="py-3.5 rounded-2xl bg-slate-800 text-slate-300 border border-slate-700/60 hover:bg-slate-700 active:scale-95 transition flex items-center justify-center"
          title="Backspace"
        >
          <Delete className="w-5 h-5" />
        </button>
        <button
          onClick={() => onInsert('%')}
          className="py-3.5 rounded-2xl bg-slate-800 text-amber-300 border border-slate-700/60 hover:bg-slate-700 active:scale-95 transition"
        >
          %
        </button>
        <button
          onClick={() => onInsert('÷')}
          className="py-3.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 active:scale-95 transition text-lg"
        >
          ÷
        </button>

        {/* Row 2: 7, 8, 9, × */}
        <button
          onClick={() => onInsert('7')}
          className="py-3.5 rounded-2xl bg-slate-800/90 text-slate-100 border border-slate-700/50 hover:bg-slate-700 active:scale-95 transition font-mono text-lg"
        >
          7
        </button>
        <button
          onClick={() => onInsert('8')}
          className="py-3.5 rounded-2xl bg-slate-800/90 text-slate-100 border border-slate-700/50 hover:bg-slate-700 active:scale-95 transition font-mono text-lg"
        >
          8
        </button>
        <button
          onClick={() => onInsert('9')}
          className="py-3.5 rounded-2xl bg-slate-800/90 text-slate-100 border border-slate-700/50 hover:bg-slate-700 active:scale-95 transition font-mono text-lg"
        >
          9
        </button>
        <button
          onClick={() => onInsert('×')}
          className="py-3.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 active:scale-95 transition text-lg"
        >
          ×
        </button>

        {/* Row 3: 4, 5, 6, − */}
        <button
          onClick={() => onInsert('4')}
          className="py-3.5 rounded-2xl bg-slate-800/90 text-slate-100 border border-slate-700/50 hover:bg-slate-700 active:scale-95 transition font-mono text-lg"
        >
          4
        </button>
        <button
          onClick={() => onInsert('5')}
          className="py-3.5 rounded-2xl bg-slate-800/90 text-slate-100 border border-slate-700/50 hover:bg-slate-700 active:scale-95 transition font-mono text-lg"
        >
          5
        </button>
        <button
          onClick={() => onInsert('6')}
          className="py-3.5 rounded-2xl bg-slate-800/90 text-slate-100 border border-slate-700/50 hover:bg-slate-700 active:scale-95 transition font-mono text-lg"
        >
          6
        </button>
        <button
          onClick={() => onInsert('−')}
          className="py-3.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 active:scale-95 transition text-lg"
        >
          −
        </button>

        {/* Row 4: 1, 2, 3, + */}
        <button
          onClick={() => onInsert('1')}
          className="py-3.5 rounded-2xl bg-slate-800/90 text-slate-100 border border-slate-700/50 hover:bg-slate-700 active:scale-95 transition font-mono text-lg"
        >
          1
        </button>
        <button
          onClick={() => onInsert('2')}
          className="py-3.5 rounded-2xl bg-slate-800/90 text-slate-100 border border-slate-700/50 hover:bg-slate-700 active:scale-95 transition font-mono text-lg"
        >
          2
        </button>
        <button
          onClick={() => onInsert('3')}
          className="py-3.5 rounded-2xl bg-slate-800/90 text-slate-100 border border-slate-700/50 hover:bg-slate-700 active:scale-95 transition font-mono text-lg"
        >
          3
        </button>
        <button
          onClick={() => onInsert('+')}
          className="py-3.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 active:scale-95 transition text-lg"
        >
          +
        </button>

        {/* Row 5: ±, 0, ., = */}
        <button
          onClick={() => onInsert('-')}
          className="py-3.5 rounded-2xl bg-slate-800/90 text-slate-300 border border-slate-700/50 hover:bg-slate-700 active:scale-95 transition"
        >
          ±
        </button>
        <button
          onClick={() => onInsert('0')}
          className="py-3.5 rounded-2xl bg-slate-800/90 text-slate-100 border border-slate-700/50 hover:bg-slate-700 active:scale-95 transition font-mono text-lg"
        >
          0
        </button>
        <button
          onClick={() => onInsert('.')}
          className="py-3.5 rounded-2xl bg-slate-800/90 text-slate-100 border border-slate-700/50 hover:bg-slate-700 active:scale-95 transition text-lg"
        >
          .
        </button>
        <button
          onClick={onCalculate}
          className="py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 active:scale-95 transition text-xl flex items-center justify-center"
        >
          =
        </button>
      </div>

      {/* AI Solver Express Action */}
      <div className="pt-1">
        <button
          onClick={onSolveWithAI}
          className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-cyan-950 via-slate-900 to-indigo-950 border border-cyan-500/30 hover:border-cyan-400/60 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition group"
        >
          <Sparkles className="w-4 h-4 text-cyan-400 group-hover:rotate-12 transition-transform" />
          <span>Solve Current Expression or Question with AI Calculus Engine</span>
        </button>
      </div>
    </div>
  );
};
