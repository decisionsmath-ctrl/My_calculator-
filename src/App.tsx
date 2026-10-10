/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Calculator, 
  Sparkles, 
  History as HistoryIcon, 
  BookOpen, 
  Volume2, 
  VolumeX, 
  Copy, 
  Check, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  SlidersHorizontal,
  ChevronRight,
  HelpCircle,
  TrendingUp,
  Cpu,
  FileDown
} from 'lucide-react';
import { AngleMode, CalculationHistoryItem, CalculusSolution } from './types/calculator';
import { evaluateExpression, formatResult } from './utils/mathEngine';
import { exportSolutionToPdf } from './utils/pdfExporter';
import { ScientificKeypad } from './components/ScientificKeypad';
import { AICalculusSolver } from './components/AICalculusSolver';
import { SolutionViewer } from './components/SolutionViewer';
import { HistoryDrawer } from './components/HistoryDrawer';
import { UnitAndConstantReference } from './components/UnitAndConstantReference';

export default function App() {
  // Navigation View Mode: 'dual' (side-by-side workstation), 'calculator', or 'ai-solver'
  const [viewMode, setViewMode] = useState<'dual' | 'calculator' | 'ai-solver'>('dual');

  // Calculator State
  const [expression, setExpression] = useState<string>('');
  const [result, setResult] = useState<string>('0');
  const [livePreview, setLivePreview] = useState<string | null>(null);
  const [hasEvaluated, setHasEvaluated] = useState<boolean>(false);
  const [angleMode, setAngleMode] = useState<AngleMode>('RAD');
  const [isSecondMode, setIsSecondMode] = useState<boolean>(false);
  const [memoryValue, setMemoryValue] = useState<number | null>(null);
  const [hasMemory, setHasMemory] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [copiedDisplay, setCopiedDisplay] = useState<boolean>(false);

  // History State
  const [history, setHistory] = useState<CalculationHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('omni_calc_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isReferenceOpen, setIsReferenceOpen] = useState<boolean>(false);

  // AI Calculus State
  const [currentSolution, setCurrentSolution] = useState<CalculusSolution | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [externalSolverPrompt, setExternalSolverPrompt] = useState<string | undefined>(undefined);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('omni_calc_history', JSON.stringify(history.slice(0, 50)));
    } catch (e) {
      console.warn('Could not save history to localStorage:', e);
    }
  }, [history]);

  // Audio Click Feedback via Web Audio API
  const playClickSound = useCallback((frequency = 440, type: OscillatorType = 'sine') => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(frequency * 0.5, audioCtx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
    } catch {
      // AudioContext not allowed before user interaction
    }
  }, [soundEnabled]);

  // Real-time calculation preview when user types arithmetic
  useEffect(() => {
    if (!expression || expression.trim() === '') {
      setLivePreview(null);
      return;
    }

    try {
      const evalRes = evaluateExpression(expression, angleMode);
      setLivePreview(evalRes.formatted);
    } catch {
      setLivePreview(null);
    }
  }, [expression, angleMode]);

  // Handle inserting tokens into calculator
  const handleInsert = (value: string) => {
    playClickSound(520);
    if (hasEvaluated) {
      // If previous calculation just finished and user types an operator, continue with result
      if (['+', '−', '×', '÷', '^', '%'].includes(value)) {
        setExpression(result + value);
      } else {
        setExpression(value);
      }
      setHasEvaluated(false);
    } else {
      setExpression((prev) => prev + value);
    }
  };

  // Backspace
  const handleBackspace = () => {
    playClickSound(380);
    if (hasEvaluated) {
      setExpression('');
      setResult('0');
      setHasEvaluated(false);
      return;
    }
    setExpression((prev) => prev.slice(0, -1));
  };

  // Clear all
  const handleClear = () => {
    playClickSound(300, 'triangle');
    setExpression('');
    setResult('0');
    setLivePreview(null);
    setHasEvaluated(false);
  };

  // Calculate Arithmetic expression
  const handleCalculate = () => {
    playClickSound(640, 'triangle');
    if (!expression || expression.trim() === '') return;

    try {
      const evalRes = evaluateExpression(expression, angleMode);
      setResult(evalRes.formatted);
      setHasEvaluated(true);
      setLivePreview(null);

      // Add to history
      const historyItem: CalculationHistoryItem = {
        id: `arith_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: 'arithmetic',
        expression: expression,
        result: evalRes.formatted,
        timestamp: Date.now(),
      };
      setHistory((prev) => [historyItem, ...prev]);
    } catch (err: any) {
      setResult('Syntax Error');
      setHasEvaluated(true);
    }
  };

  // Memory Actions
  const handleMemoryAction = (action: 'MC' | 'MR' | 'M+' | 'M-' | 'MS') => {
    playClickSound(480);
    const currentNum = Number(result) || 0;

    switch (action) {
      case 'MC':
        setMemoryValue(null);
        setHasMemory(false);
        break;
      case 'MR':
        if (memoryValue !== null) {
          handleInsert(memoryValue.toString());
        }
        break;
      case 'M+':
        setMemoryValue((prev) => (prev ?? 0) + currentNum);
        setHasMemory(true);
        break;
      case 'M-':
        setMemoryValue((prev) => (prev ?? 0) - currentNum);
        setHasMemory(true);
        break;
      case 'MS':
        setMemoryValue(currentNum);
        setHasMemory(true);
        break;
    }
  };

  // Transfer expression to AI Solver
  const handleSendToAISolver = (prompt?: string) => {
    const targetQuery = prompt || expression || (result !== '0' ? result : '');
    if (!targetQuery) return;
    setExternalSolverPrompt(targetQuery);
    if (viewMode === 'calculator') {
      setViewMode('ai-solver');
    }
  };

  // When AI solution is received
  const handleSolutionReceived = (solution: CalculusSolution) => {
    setCurrentSolution(solution);
    // Add to history
    const historyItem: CalculationHistoryItem = {
      id: `calc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'calculus',
      expression: solution.problemTitle,
      result: solution.finalAnswerLatex,
      latex: solution.finalAnswerLatex,
      calculusSolution: solution,
      timestamp: Date.now(),
    };
    setHistory((prev) => [historyItem, ...prev]);
  };

  // Global Keyboard listener for arithmetic keypad
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid intercepting if typing inside an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        handleInsert(e.key);
      } else if (e.key === '.') {
        handleInsert('.');
      } else if (e.key === '+') {
        handleInsert('+');
      } else if (e.key === '-') {
        handleInsert('−');
      } else if (e.key === '*') {
        handleInsert('×');
      } else if (e.key === '/') {
        e.preventDefault();
        handleInsert('÷');
      } else if (e.key === '^') {
        handleInsert('^');
      } else if (e.key === '(' || e.key === ')') {
        handleInsert(e.key);
      } else if (e.key === '%') {
        handleInsert('%');
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleCalculate();
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasEvaluated, result, expression, angleMode]);

  // Copy result
  const handleCopyDisplay = () => {
    navigator.clipboard.writeText(result);
    setCopiedDisplay(true);
    setTimeout(() => setCopiedDisplay(false), 1500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Header & Workstation Navigation */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Cpu className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg text-slate-100 tracking-tight">OmniCalc AI</h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Calculus Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Scientific Calculator & Natural Language Calculus Solver
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('dual')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                viewMode === 'dual'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 font-semibold border border-cyan-500/30 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Dual Workstation</span>
              <span className="md:hidden">Dual</span>
            </button>
            <button
              onClick={() => setViewMode('calculator')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                viewMode === 'calculator'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Scientific Calc</span>
            </button>
            <button
              onClick={() => setViewMode('ai-solver')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                viewMode === 'ai-solver'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>AI Calculus</span>
            </button>
          </div>

          {/* Utility Tools */}
          <div className="flex items-center gap-2 text-xs">
            {/* Quick Export Current Solution PDF */}
            {currentSolution && (
              <button
                onClick={() => exportSolutionToPdf(currentSolution)}
                className="p-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5 transition shadow-xs"
                title="Export Current Solution as PDF Report"
              >
                <FileDown className="w-4 h-4 text-cyan-400" />
                <span className="hidden sm:inline font-semibold">PDF Report</span>
              </button>
            )}

            {/* Reference Sheet Toggle */}
            <button
              onClick={() => setIsReferenceOpen(!isReferenceOpen)}
              className={`p-2 rounded-xl border transition flex items-center gap-1.5 ${
                isReferenceOpen
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="Formulas & Constants Reference Sheet"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden lg:inline">Formulas</span>
            </button>

            {/* History Toggle */}
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition"
              title="Calculation History"
            >
              <HistoryIcon className="w-4 h-4" />
              <span className="hidden lg:inline">History</span>
              {history.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] flex items-center justify-center font-mono">
                  {history.length}
                </span>
              )}
            </button>

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition"
              title={soundEnabled ? 'Mute Key Sounds' : 'Enable Key Sounds'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Quick Reference Collapsible Drawer (if opened) */}
        {isReferenceOpen && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-200">
            <UnitAndConstantReference
              onInsertValue={(val) => handleInsert(val)}
              onSendToSolver={(prompt) => handleSendToAISolver(prompt)}
            />
          </div>
        )}

        {/* View Mode Layouts */}
        <div className={`grid gap-6 ${viewMode === 'dual' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'}`}>
          {/* Scientific Calculator Section */}
          {(viewMode === 'dual' || viewMode === 'calculator') && (
            <div className={`${viewMode === 'dual' ? 'lg:col-span-5' : 'max-w-xl mx-auto w-full'} space-y-4`}>
              {/* Calculator Housing */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden backdrop-blur-sm">
                {/* Background Ambient Glow */}
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Display Screen */}
                <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 sm:p-5 mb-5 shadow-inner space-y-2 relative">
                  {/* Top status bar inside screen: Angle unit, Memory indicator */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        angleMode === 'DEG' ? 'bg-sky-950 text-sky-400' : 'bg-emerald-950 text-emerald-400'
                      }`}>
                        {angleMode}
                      </span>
                      {hasMemory && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400">
                          M
                        </span>
                      )}
                    </div>

                    <button
                      onClick={handleCopyDisplay}
                      className="hover:text-slate-200 transition flex items-center gap-1 text-[11px]"
                      title="Copy Result"
                    >
                      {copiedDisplay ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Math Expression Input Stack */}
                  <div className="min-h-[28px] overflow-x-auto text-right font-mono text-base text-slate-400 whitespace-nowrap scrollbar-none">
                    {expression || <span className="text-slate-600">0</span>}
                  </div>

                  {/* Live Evaluation Preview */}
                  {livePreview && !hasEvaluated && (
                    <div className="text-right font-mono text-xs text-cyan-400/80 -mt-1">
                      ≈ {livePreview}
                    </div>
                  )}

                  {/* Main Evaluated Output */}
                  <div className="text-right font-mono font-bold text-2xl sm:text-3xl text-slate-100 overflow-x-auto whitespace-nowrap tracking-tight scrollbar-none">
                    {result}
                  </div>
                </div>

                {/* Tactile Keypad */}
                <ScientificKeypad
                  onInsert={handleInsert}
                  onClear={handleClear}
                  onBackspace={handleBackspace}
                  onCalculate={handleCalculate}
                  onSolveWithAI={() => handleSendToAISolver()}
                  angleMode={angleMode}
                  onToggleAngleMode={() => setAngleMode((m) => (m === 'DEG' ? 'RAD' : 'DEG'))}
                  isSecondMode={isSecondMode}
                  onToggleSecondMode={() => setIsSecondMode(!isSecondMode)}
                  onMemoryAction={handleMemoryAction}
                  hasMemory={hasMemory}
                />
              </div>
            </div>
          )}

          {/* AI Calculus & Graphing Engine Section */}
          {(viewMode === 'dual' || viewMode === 'ai-solver') && (
            <div className={`${viewMode === 'dual' ? 'lg:col-span-7' : 'max-w-4xl mx-auto w-full'} space-y-6`}>
              {/* Natural Language Calculus Input Bar */}
              <AICalculusSolver
                onSolutionReceived={handleSolutionReceived}
                isLoading={isAiLoading}
                setIsLoading={setIsAiLoading}
                externalQuery={externalSolverPrompt}
              />

              {/* Solution Proof Breakdown (if solution exists) */}
              {currentSolution ? (
                <SolutionViewer
                  solution={currentSolution}
                  onSendToCalculator={(numStr) => {
                    handleInsert(numStr);
                    if (viewMode === 'ai-solver') {
                      setViewMode('calculator');
                    }
                  }}
                />
              ) : (
                /* Welcome / Empty State Guide */
                <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-8 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-200">
                      AI Symbolic Calculus Workstation
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                      Ask complex single or multivariable calculus problems using plain English. Get step-by-step rigorous derivations, interactive 2D function curves, and exact answers.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 max-w-lg mx-auto text-left text-xs">
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <span className="font-semibold text-cyan-400 block mb-1">1. Differentiation</span>
                      <p className="text-slate-400 text-[11px]">Product, Quotient, Chain, Implicit & Partial derivatives</p>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <span className="font-semibold text-cyan-400 block mb-1">2. Integration</span>
                      <p className="text-slate-400 text-[11px]">Parts, Trig substitution, Partial fractions, Definite integrals</p>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <span className="font-semibold text-cyan-400 block mb-1">3. Series & ODEs</span>
                      <p className="text-slate-400 text-[11px]">Taylor series expansions, differential equations, limits</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* History Drawer Modal */}
      <HistoryDrawer
        history={history}
        onSelectCalculation={(item) => {
          if (item.type === 'arithmetic') {
            setExpression(item.expression);
            setResult(item.result);
            setHasEvaluated(true);
          } else if (item.calculusSolution) {
            setCurrentSolution(item.calculusSolution);
          }
        }}
        onClearHistory={() => setHistory([])}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 py-4 px-4 text-center text-xs text-slate-500">
        <p>OmniCalc AI • High-Precision Arithmetic & Symbolic Calculus Intelligence Engine</p>
      </footer>
    </div>
  );
}
