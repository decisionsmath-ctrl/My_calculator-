import React, { useState } from 'react';
import { CONSTANTS } from '../utils/mathEngine';
import { MathDisplay } from './MathDisplay';
import { BookOpen, Hash, Copy, Check } from 'lucide-react';

interface UnitAndConstantReferenceProps {
  onInsertValue: (val: string) => void;
  onSendToSolver?: (prompt: string) => void;
}

export const UnitAndConstantReference: React.FC<UnitAndConstantReferenceProps> = ({
  onInsertValue,
  onSendToSolver,
}) => {
  const [activeTab, setActiveTab] = useState<'constants' | 'formulas'>('constants');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const constantsList = [
    {
      symbol: 'π',
      name: 'Pi (Archimedes Constant)',
      valueStr: '3.141592653589793',
      raw: 'pi',
      desc: 'Ratio of a circle circumference to its diameter',
    },
    {
      symbol: 'e',
      name: "Euler's Number",
      valueStr: '2.718281828459045',
      raw: 'e',
      desc: 'Base of the natural logarithm',
    },
    {
      symbol: 'φ',
      name: 'Golden Ratio',
      valueStr: '1.618033988749895',
      raw: 'phi',
      desc: '(1 + √5)/2, harmonious proportion in mathematics and geometry',
    },
    {
      symbol: 'c',
      name: 'Speed of Light',
      valueStr: '299,792,458 m/s',
      raw: '299792458',
      desc: 'Universal physical constant in vacuum',
    },
    {
      symbol: 'h',
      name: "Planck's Constant",
      valueStr: '6.62607015 × 10⁻³⁴ J·s',
      raw: '6.62607015e-34',
      desc: 'Quantum of electromagnetic action',
    },
    {
      symbol: 'G',
      name: 'Gravitational Constant',
      valueStr: '6.67430 × 10⁻¹¹ m³/(kg·s²)',
      raw: '6.67430e-11',
      desc: 'Newtonian gravitational constant',
    },
    {
      symbol: 'k',
      name: "Boltzmann's Constant",
      valueStr: '1.380649 × 10⁻²³ J/K',
      raw: '1.380649e-23',
      desc: 'Relates temperature to particle kinetic energy',
    },
  ];

  const calculusFormulas = [
    {
      category: 'Derivatives',
      name: 'Product Rule',
      latex: '\\frac{d}{dx}[u \\cdot v] = u\'v + uv\'',
      query: 'Explain and derive product rule for u(x)*v(x)',
    },
    {
      category: 'Derivatives',
      name: 'Quotient Rule',
      latex: '\\frac{d}{dx}\\left[\\frac{u}{v}\\right] = \\frac{u\'v - uv\'}{v^2}',
      query: 'Explain and derive quotient rule for u(x)/v(x)',
    },
    {
      category: 'Derivatives',
      name: 'Chain Rule',
      latex: '\\frac{d}{dx}[f(g(x))] = f\'(g(x)) \\cdot g\'(x)',
      query: 'Explain and derive chain rule with example f(g(x))',
    },
    {
      category: 'Integrals',
      name: 'Integration by Parts',
      latex: '\\int u \\, dv = uv - \\int v \\, du',
      query: 'Derive integration by parts formula integral u dv',
    },
    {
      category: 'Integrals',
      name: 'Fundamental Theorem of Calculus',
      latex: '\\int_a^b f(x)\\,dx = F(b) - F(a)',
      query: 'Explain Fundamental Theorem of Calculus parts 1 and 2',
    },
    {
      category: 'Series',
      name: 'Taylor Series Expansion',
      latex: 'f(x) = \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(a)}{n!}(x-a)^n',
      query: 'Show general Taylor series formula and convergence condition',
    },
    {
      category: 'Series',
      name: 'Euler\'s Identity',
      latex: 'e^{i\\pi} + 1 = 0',
      query: 'Prove Euler identity e^(i*pi) + 1 = 0 using Taylor series of e^x, sin x, cos x',
    },
    {
      category: 'Limits',
      name: "L'Hôpital's Rule",
      latex: '\\lim_{x \\to c} \\frac{f(x)}{g(x)} = \\lim_{x \\to c} \\frac{f\'(x)}{g\'(x)}',
      query: "Explain L'Hopital rule for 0/0 and infinity/infinity indeterminate forms",
    },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
      {/* Header and tab switcher */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Reference Guide & Formula Sheet
          </h3>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('constants')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              activeTab === 'constants'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Constants
          </button>
          <button
            onClick={() => setActiveTab('formulas')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              activeTab === 'formulas'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Calculus Formulas
          </button>
        </div>
      </div>

      {/* Tab 1: Constants */}
      {activeTab === 'constants' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[380px] overflow-y-auto pr-1">
          {constantsList.map((item) => (
            <div
              key={item.symbol}
              className="bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex flex-col justify-between transition"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-serif text-lg text-cyan-400 font-bold">{item.symbol}</span>
                  <span className="text-[11px] font-semibold text-slate-300">{item.name}</span>
                </div>
                <p className="text-[11px] text-slate-400 mb-2">{item.desc}</p>
                <div className="font-mono text-xs text-slate-200 bg-slate-900 px-2 py-1 rounded border border-slate-800 truncate">
                  {item.valueStr}
                </div>
              </div>

              <div className="mt-2.5 flex items-center gap-2 pt-2 border-t border-slate-800/60">
                <button
                  onClick={() => onInsertValue(item.raw)}
                  className="flex-1 py-1 px-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-[11px] font-medium border border-cyan-500/20 transition"
                >
                  Insert to Calc
                </button>
                <button
                  onClick={() => handleCopy(item.symbol, item.raw)}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                  title="Copy value"
                >
                  {copiedKey === item.symbol ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Calculus Formulas */}
      {activeTab === 'formulas' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[380px] overflow-y-auto pr-1">
          {calculusFormulas.map((f, idx) => (
            <div
              key={idx}
              className="bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex flex-col justify-between transition"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-semibold text-slate-300">{f.name}</span>
                  <span className="text-cyan-400 font-mono text-[10px]">{f.category}</span>
                </div>

                <div className="bg-slate-900 rounded-lg p-2.5 my-2 border border-slate-800 overflow-x-auto text-center">
                  <MathDisplay latex={f.latex} displayMode={true} className="text-sm text-cyan-200" />
                </div>
              </div>

              {onSendToSolver && (
                <button
                  onClick={() => onSendToSolver(f.query)}
                  className="w-full mt-1 py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 text-[11px] font-medium border border-slate-700 transition flex items-center justify-center gap-1"
                >
                  <Hash className="w-3 h-3 text-cyan-400" />
                  <span>Analyze & Solve in AI Engine</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
