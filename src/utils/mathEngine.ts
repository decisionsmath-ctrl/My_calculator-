import { AngleMode } from '../types/calculator';

export const CONSTANTS = {
  pi: Math.PI,
  e: Math.E,
  phi: (1 + Math.sqrt(5)) / 2, // Golden ratio
  c: 299792458, // Speed of light m/s
  h: 6.62607015e-34, // Planck's constant
  G: 6.67430e-11, // Gravitational constant
  k: 1.380649e-23, // Boltzmann constant
};

// Factorial calculation
export function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n)) {
    throw new Error('Factorial is defined for non-negative integers only.');
  }
  if (n > 170) {
    return Infinity; // Overflow for IEEE 754 float
  }
  let res = 1;
  for (let i = 2; i <= n; i++) {
    res *= i;
  }
  return res;
}

// Permutations nPr
export function permutations(n: number, r: number): number {
  if (n < 0 || r < 0 || r > n) return 0;
  return factorial(n) / factorial(n - r);
}

// Combinations nCr
export function combinations(n: number, r: number): number {
  if (n < 0 || r < 0 || r > n) return 0;
  return factorial(n) / (factorial(r) * factorial(n - r));
}

// Clean number formatting with high precision
export function formatResult(val: number): string {
  if (Number.isNaN(val)) return 'Error: Undefined';
  if (!Number.isFinite(val)) return val > 0 ? 'Infinity' : '-Infinity';

  // Check if nearly integer (e.g. 0.9999999999999999 -> 1)
  const rounded = Math.round(val);
  if (Math.abs(val - rounded) < 1e-12) {
    return rounded.toString();
  }

  // Use precision formatting
  if (Math.abs(val) < 1e-7 || Math.abs(val) >= 1e12) {
    return val.toExponential(8).replace(/\.?0+e/, 'e');
  }

  // Limit decimal places cleanly
  const str = val.toFixed(10);
  return str.replace(/\.?0+$/, '');
}

/**
 * Tokenize and evaluate arithmetic expressions safely
 */
export function evaluateExpression(expr: string, angleMode: AngleMode = 'RAD'): { result: number; formatted: string } {
  if (!expr || expr.trim() === '') {
    throw new Error('Empty expression');
  }

  // Pre-process symbols and operators
  let processed = expr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/π/g, 'pi')
    .replace(/e\^/g, 'exp')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/√\(/g, 'sqrt(')
    .replace(/√([0-9a-zA-Z.]+)/g, 'sqrt($1)');

  // Handle factorial shorthand e.g. 5! -> fact(5)
  processed = processed.replace(/(\d+(\.\d+)?)!/g, 'fact($1)');

  // Handle implicit multiplication: e.g. 2(3) -> 2*(3), 2pi -> 2*pi, (2)(3) -> (2)*(3)
  processed = processed
    .replace(/(\d)\s*\(/g, '$1*(')
    .replace(/\)\s*(\d)/g, ')*$1')
    .replace(/\)\s*\(/g, ')*(')
    .replace(/(\d)\s*(pi|phi|e|sqrt|cbrt|sin|cos|tan|asin|acos|atan|sinh|cosh|tanh|ln|log|fact)/g, '$1*$2')
    .replace(/(pi|phi|e)\s*(\d)/g, '$1*$2');

  // Build safe math context
  const toRad = (x: number) => (angleMode === 'DEG' ? (x * Math.PI) / 180 : x);
  const fromRad = (x: number) => (angleMode === 'DEG' ? (x * 180) / Math.PI : x);

  const scope: Record<string, any> = {
    pi: Math.PI,
    e: Math.E,
    phi: CONSTANTS.phi,
    c: CONSTANTS.c,
    h: CONSTANTS.h,
    sin: (x: number) => {
      const rad = toRad(x);
      const val = Math.sin(rad);
      return Math.abs(val) < 1e-15 ? 0 : val;
    },
    cos: (x: number) => {
      const rad = toRad(x);
      const val = Math.cos(rad);
      return Math.abs(val) < 1e-15 ? 0 : val;
    },
    tan: (x: number) => {
      const rad = toRad(x);
      // Check if cos is ~ 0
      if (Math.abs(Math.cos(rad)) < 1e-15) throw new Error('Tangent undefined (asymptote)');
      const val = Math.tan(rad);
      return Math.abs(val) < 1e-15 ? 0 : val;
    },
    asin: (x: number) => {
      if (x < -1 || x > 1) throw new Error('asin input out of domain [-1, 1]');
      return fromRad(Math.asin(x));
    },
    acos: (x: number) => {
      if (x < -1 || x > 1) throw new Error('acos input out of domain [-1, 1]');
      return fromRad(Math.acos(x));
    },
    atan: (x: number) => fromRad(Math.atan(x)),
    sinh: (x: number) => Math.sinh(x),
    cosh: (x: number) => Math.cosh(x),
    tanh: (x: number) => Math.tanh(x),
    ln: (x: number) => {
      if (x <= 0) throw new Error('ln(x) undefined for x <= 0');
      return Math.log(x);
    },
    log: (x: number) => {
      if (x <= 0) throw new Error('log10(x) undefined for x <= 0');
      return Math.log10(x);
    },
    log2: (x: number) => {
      if (x <= 0) throw new Error('log2(x) undefined for x <= 0');
      return Math.log2(x);
    },
    exp: (x: number) => Math.exp(x),
    sqrt: (x: number) => {
      if (x < 0) throw new Error('sqrt(x) undefined for negative numbers');
      return Math.sqrt(x);
    },
    cbrt: (x: number) => Math.cbrt(x),
    abs: (x: number) => Math.abs(x),
    fact: (x: number) => factorial(x),
    nCr: (n: number, r: number) => combinations(n, r),
    nPr: (n: number, r: number) => permutations(n, r),
  };

  // Convert ^ to Math.pow representation or **
  // Replace x^y with Math.pow(x, y) or parse safely
  const jsCode = convertPowerSyntax(processed);

  // Validate allowed characters to prevent arbitrary script execution
  const allowedPattern = /^[0-9+\-*/^().,%_a-zA-Z\s]+$/;
  if (!allowedPattern.test(jsCode)) {
    throw new Error('Invalid mathematical syntax or characters.');
  }

  // Construct function with scoped variables
  const keys = Object.keys(scope);
  const values = Object.values(scope);
  
  // Safe evaluation within pure arithmetic scope
  const fn = new Function(...keys, `"use strict"; return (${jsCode});`);
  const rawResult = fn(...values);

  if (typeof rawResult !== 'number') {
    throw new Error('Expression did not evaluate to a valid number.');
  }

  return {
    result: rawResult,
    formatted: formatResult(rawResult),
  };
}

// Convert expression power syntax `a ^ b` into `Math.pow(a, b)`
function convertPowerSyntax(str: string): string {
  // Replace ^ with ** operator in modern JS (standard exponentiation)
  // But ensure right-associativity if needed or standard JS **
  return str.replace(/\^/g, '**');
}
