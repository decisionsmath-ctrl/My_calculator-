import React, { useState, useRef } from 'react';
import { 
  Check, 
  Copy, 
  Volume2, 
  VolumeX, 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  Sparkles,
  Share2,
  FileDown,
  Loader2
} from 'lucide-react';
import { CalculusSolution } from '../types/calculator';
import { MathDisplay } from './MathDisplay';
import { InteractiveGrapher } from './InteractiveGrapher';
import { exportSolutionToPdf } from '../utils/pdfExporter';

interface SolutionViewerProps {
  solution: CalculusSolution;
  onSendToCalculator?: (expr: string) => void;
}

export const SolutionViewer: React.FC<SolutionViewerProps> = ({
  solution,
  onSendToCalculator,
}) => {
  const [copiedAnswer, setCopiedAnswer] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [collapsedSteps, setCollapsedSteps] = useState<Record<number, boolean>>({});
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Export formatted PDF report
  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      await exportSolutionToPdf(solution, canvasRef.current);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Could not generate PDF. Please try again.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Copy final answer
  const handleCopyAnswer = () => {
    navigator.clipboard.writeText(solution.finalAnswerLatex);
    setCopiedAnswer(true);
    setTimeout(() => setCopiedAnswer(false), 2000);
  };

  // Copy full solution
  const handleCopyAll = () => {
    let fullText = `${solution.problemTitle}\nType: ${solution.problemType}\nProblem: ${solution.inputLatex}\n\nSummary:\n${solution.summary}\n\nFinal Answer:\n${solution.finalAnswerLatex}\n`;
    if (solution.approximateValue) {
      fullText += `Approximate: ${solution.approximateValue}\n`;
    }
    fullText += `\nSteps:\n`;
    solution.steps.forEach((s) => {
      fullText += `Step ${s.stepNumber}: ${s.title}\n${s.explanation}\nFormula: ${s.latexFormula}\n`;
      if (s.ruleApplied) fullText += `Rule: ${s.ruleApplied}\n`;
      fullText += `\n`;
    });
    navigator.clipboard.writeText(fullText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // Toggle step collapse
  const toggleStep = (stepNumber: number) => {
    setCollapsedSteps((prev) => ({
      ...prev,
      [stepNumber]: !prev[stepNumber],
    }));
  };

  // Text to Speech explanation
  const handleToggleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const narration = [
      `Solving ${solution.problemTitle}.`,
      solution.summary,
      ...solution.steps.map((s) => `Step ${s.stepNumber}: ${s.title}. ${s.explanation}.`),
      `The final answer is ${solution.finalAnswerLatex}.`,
    ].join(' ');

    const utterance = new SpeechSynthesisUtterance(narration);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="space-y-6">
      {/* Solution Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {solution.problemType}
            </span>
            <span className="text-xs text-slate-400">AI Step-by-Step Proof</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="py-1.5 px-3 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-500/20 border border-cyan-400/30 flex items-center gap-1.5 transition disabled:opacity-50"
              title="Export formatted PDF Report"
            >
              {isExportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              <span>{isExportingPdf ? 'Generating PDF...' : 'Export PDF'}</span>
            </button>

            <button
              onClick={handleToggleSpeak}
              className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition border ${
                isSpeaking
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title={isSpeaking ? 'Stop Audio Narration' : 'Listen to Explanation'}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{isSpeaking ? 'Stop' : 'Listen'}</span>
            </button>

            <button
              onClick={handleCopyAll}
              className="p-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition"
              title="Copy Full Solution"
            >
              {copiedAll ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{copiedAll ? 'Copied' : 'Share / Copy'}</span>
            </button>
          </div>
        </div>

        <h2 className="text-xl font-bold text-slate-100 mb-2">{solution.problemTitle}</h2>

        {/* Input Problem LaTeX */}
        <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-800/80 my-3 flex items-center justify-center">
          <MathDisplay latex={solution.inputLatex} displayMode={true} className="text-lg text-slate-100" />
        </div>

        <p className="text-sm text-slate-300 leading-relaxed mt-2">{solution.summary}</p>
      </div>

      {/* Prominent Final Answer Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 border-2 border-cyan-500/40 rounded-2xl p-6 shadow-xl">
        <div className="absolute top-0 right-0 p-3 opacity-10">
          <Sparkles className="w-28 h-28 text-cyan-300" />
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">Final Exact Solution</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyAnswer}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 transition"
            >
              {copiedAnswer ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedAnswer ? 'Copied' : 'Copy Answer'}
            </button>

            {onSendToCalculator && solution.approximateValue && (
              <button
                onClick={() => onSendToCalculator(solution.approximateValue || '')}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              >
                Send to Keypad
              </button>
            )}
          </div>
        </div>

        <div className="py-3 px-4 bg-slate-950/80 rounded-xl border border-cyan-500/20 my-2 overflow-x-auto text-center">
          <MathDisplay latex={solution.finalAnswerLatex} displayMode={true} className="text-2xl text-cyan-200 font-semibold" />
        </div>

        {solution.approximateValue && (
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Numerical Approximation:</span>
            <span className="font-mono text-cyan-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              ≈ {solution.approximateValue}
            </span>
          </div>
        )}

        {/* Key Properties Tags (Domain, critical points, etc.) */}
        {solution.keyProperties && solution.keyProperties.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {solution.keyProperties.map((prop, idx) => (
              <div key={idx} className="bg-slate-950/60 rounded-lg p-2.5 border border-slate-800 text-xs">
                <span className="text-slate-400 font-medium block mb-1">{prop.label}:</span>
                <span className="text-slate-200 font-mono font-medium">{prop.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Interactive 2D Graph (if graphable) */}
      {solution.graphable?.hasGraph && (
        <div>
          <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-slate-200">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>Geometric & Graphical Representation</span>
          </div>
          <InteractiveGrapher 
            graphData={solution.graphable} 
            defaultTitle={solution.problemTitle} 
            onCanvasRef={(c) => { canvasRef.current = c; }}
          />
        </div>
      )}

      {/* Step-by-Step Derivation Steps */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            Detailed Mathematical Derivation ({solution.steps.length} Steps)
          </h3>
          <button
            onClick={() => {
              const allCollapsed = Object.keys(collapsedSteps).length === solution.steps.length;
              if (allCollapsed) {
                setCollapsedSteps({});
              } else {
                const newCollapsed: Record<number, boolean> = {};
                solution.steps.forEach((s) => {
                  newCollapsed[s.stepNumber] = true;
                });
                setCollapsedSteps(newCollapsed);
              }
            }}
            className="text-xs text-slate-400 hover:text-slate-200 transition"
          >
            {Object.keys(collapsedSteps).length === solution.steps.length ? 'Expand All' : 'Collapse All'}
          </button>
        </div>

        {solution.steps.map((step) => {
          const isCollapsed = collapsedSteps[step.stepNumber];
          return (
            <div
              key={step.stepNumber}
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm transition hover:border-slate-700"
            >
              {/* Step Header */}
              <div
                onClick={() => toggleStep(step.stepNumber)}
                className="flex items-center justify-between p-4 cursor-pointer bg-slate-950/40 select-none hover:bg-slate-950/70 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center text-xs font-bold font-mono">
                    {step.stepNumber}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">{step.title}</h4>
                    {step.ruleApplied && (
                      <span className="inline-block mt-0.5 text-[11px] font-medium text-indigo-400 bg-indigo-950/40 border border-indigo-800/40 px-2 py-0.5 rounded">
                        {step.ruleApplied}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-slate-400 hover:text-slate-200">
                  {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </div>
              </div>

              {/* Step Content */}
              {!isCollapsed && (
                <div className="p-4 pt-2 border-t border-slate-800/50 space-y-3">
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{step.explanation}</p>

                  <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 overflow-x-auto text-center">
                    <MathDisplay latex={step.latexFormula} displayMode={true} className="text-base text-cyan-100" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
