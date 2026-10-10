export type AngleMode = 'DEG' | 'RAD';

export interface CalculusStep {
  stepNumber: number;
  title: string;
  explanation: string;
  latexFormula: string;
  ruleApplied?: string;
}

export interface KeyProperty {
  label: string;
  value: string;
}

export interface GraphData {
  hasGraph: boolean;
  functionLatex?: string;
  functionJs?: string;
  derivativeJs?: string;
  xMin?: number;
  xMax?: number;
  yMin?: number;
  yMax?: number;
  definiteIntegralBounds?: {
    lower: number;
    upper: number;
  };
  criticalPoints?: Array<{
    x: number;
    y: number;
    label: string;
  }>;
}

export interface CalculusSolution {
  problemTitle: string;
  problemType: string;
  inputLatex: string;
  finalAnswerLatex: string;
  approximateValue?: string;
  summary: string;
  steps: CalculusStep[];
  keyProperties?: KeyProperty[];
  graphable?: GraphData;
  timestamp?: number;
}

export interface CalculationHistoryItem {
  id: string;
  type: 'arithmetic' | 'calculus';
  expression: string;
  result: string;
  latex?: string;
  calculusSolution?: CalculusSolution;
  timestamp: number;
}

export interface ConstantInfo {
  symbol: string;
  name: string;
  value: number;
  unit?: string;
  description: string;
}
