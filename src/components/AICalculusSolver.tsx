import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Mic, 
  MicOff, 
  Compass, 
  ArrowRight,
  TrendingUp,
  Infinity as InfinityIcon,
  HelpCircle,
  Lightbulb
} from 'lucide-react';
import { CalculusSolution } from '../types/calculator';

interface AICalculusSolverProps {
  onSolutionReceived: (solution: CalculusSolution) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  externalQuery?: string;
}

export const AICalculusSolver: React.FC<AICalculusSolverProps> = ({
  onSolutionReceived,
  isLoading,
  setIsLoading,
  externalQuery,
}) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [isListening, setIsListening] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  // Sync external query if passed from calculator
  useEffect(() => {
    if (externalQuery) {
      setQuery(externalQuery);
    }
  }, [externalQuery]);

  // Animated loading messages
  useEffect(() => {
    if (!isLoading) {
      setLoadingStep(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % 4);
    }, 1800);
    return () => clearInterval(interval);
  }, [isLoading]);

  const loadingMessages = [
    'Parsing natural language calculus problem...',
    'Applying symbolic differentiation & integration rules...',
    'Deriving step-by-step rigorous LaTeX proof...',
    'Generating 2D function visualizer and critical points...',
  ];

  // Calculus Templates
  const templates = [
    {
      category: 'Derivatives',
      title: 'Product & Chain Rule',
      prompt: 'Find the derivative of x^3 * sin(2x) with respect to x',
    },
    {
      category: 'Derivatives',
      title: 'Implicit Differentiation',
      prompt: 'Find dy/dx using implicit differentiation for x^3 + y^3 = 6xy',
    },
    {
      category: 'Integrals',
      title: 'Integration by Parts',
      prompt: 'Evaluate the definite integral of x * e^(-x) from 0 to 5',
    },
    {
      category: 'Integrals',
      title: 'Partial Fractions',
      prompt: 'Evaluate the indefinite integral of (2x + 3) / (x^2 - 4) dx',
    },
    {
      category: 'Limits',
      title: "L'Hôpital Indeterminate Form",
      prompt: 'Find the limit of (sin(x) - x) / x^3 as x approaches 0',
    },
    {
      category: 'Taylor Series',
      title: 'Logarithmic Expansion',
      prompt: 'Compute the Taylor series of ln(1 + x) centered at 0 up to degree 5',
    },
    {
      category: 'Differential Eq',
      title: 'First-Order Linear ODE',
      prompt: 'Solve the differential equation dy/dx + 2y = 4e^x with initial condition y(0) = 1',
    },
    {
      category: 'Optimization',
      title: 'Critical Points & Extrema',
      prompt: 'Find critical points and local extrema for f(x) = x^4 - 4x^3 + 10',
    },
    {
      category: 'Multivariable',
      title: 'Gradient & Directional Derivative',
      prompt: 'Find the gradient vector ∇f of f(x, y) = x^2 * y + y^3 at point (1, 2)',
    },
  ];

  const categories = ['All', 'Derivatives', 'Integrals', 'Limits', 'Taylor Series', 'Differential Eq', 'Optimization', 'Multivariable'];

  const filteredTemplates = activeCategory === 'All' 
    ? templates 
    : templates.filter((t) => t.category === activeCategory);

  // Handle Speech Recognition
  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported on this browser. Please type your calculus problem.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.continuous = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Submit problem to server
  const handleSolve = async (problemToSolve?: string) => {
    const targetQuery = problemToSolve || query;
    if (!targetQuery || targetQuery.trim() === '') return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/calculus/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: targetQuery.trim() }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 404) {
          throw new Error(
            'API endpoint not found (HTTP 404). If running on Vercel, please ensure the newly added `/api/calculus/solve.ts` and `vercel.json` are committed and redeployed.'
          );
        }
        throw new Error(errorData.error || `Server responded with status ${res.status}`);
      }

      const solution: CalculusSolution = await res.json();
      solution.timestamp = Date.now();
      onSolutionReceived(solution);
    } catch (err: any) {
      console.error('Failed to solve calculus problem:', err);
      setErrorMessage(err.message || 'Failed to solve problem. Please check your query or server connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search / Input Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl focus-within:border-cyan-500/50 transition">
        <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-cyan-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>NATURAL LANGUAGE CALCULUS & ADVANCED MATH SOLVER</span>
        </div>

        <div className="relative flex items-center gap-2">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSolve();
              }
            }}
            placeholder="Type your calculus problem in natural language (e.g. 'Find the derivative of x^3 * sin(2x)' or 'Evaluate definite integral of e^(-x^2) from 0 to infinity')..."
            rows={2}
            className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/40 resize-none font-sans"
          />

          <div className="flex flex-col gap-1.5 self-end pb-1">
            <button
              onClick={toggleSpeechRecognition}
              className={`p-2.5 rounded-xl border transition ${
                isListening
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                  : 'bg-slate-800 text-slate-400 border-slate-700/60 hover:text-slate-200 hover:bg-slate-700'
              }`}
              title="Voice Input (Speech-to-Text)"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <button
              onClick={() => handleSolve()}
              disabled={isLoading || !query.trim()}
              className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium shadow-md shadow-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center"
              title="Solve with AI"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            Press <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-300 font-mono">Enter</kbd> to solve • Natural English, math formulas, or mixed input accepted
          </span>
          <span className="text-slate-500 hidden sm:inline">Powered by Gemini AI</span>
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-6 shadow-xl text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
            <div className="w-3 h-3 rounded-full bg-blue-400 animate-pulse" />
            <div className="w-3 h-3 rounded-full bg-indigo-400 animate-bounce" />
          </div>
          <p className="text-sm font-medium text-cyan-200">
            {loadingMessages[loadingStep]}
          </p>
          <div className="w-48 h-1 bg-slate-800 rounded-full mx-auto overflow-hidden">
            <div className="w-full h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 animate-pulse" />
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-rose-950/40 border border-rose-800/40 rounded-xl p-4 text-xs text-rose-300 flex items-start gap-2">
          <HelpCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block mb-0.5">Could not complete derivation:</span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Category Tabs & Preset Templates */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold flex items-center gap-1.5 text-slate-300">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            Calculus Problem Library & Templates
          </span>
          <span className="text-[11px] text-slate-500">Click any problem to solve</span>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition ${
                activeCategory === cat
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
          {filteredTemplates.map((item, idx) => (
            <div
              key={idx}
              onClick={() => {
                setQuery(item.prompt);
                handleSolve(item.prompt);
              }}
              className="p-3 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 rounded-xl cursor-pointer transition group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-semibold text-cyan-400">{item.title}</span>
                  <span className="text-slate-500 text-[10px]">{item.category}</span>
                </div>
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {item.prompt}
                </p>
              </div>

              <div className="mt-2.5 flex items-center text-[11px] text-cyan-400 font-medium group-hover:translate-x-1 transition-transform">
                <span>Solve Now</span>
                <ArrowRight className="w-3 h-3 ml-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
