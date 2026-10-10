import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize Gemini SDK with User-Agent header
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Calculus solution schema definition
const calculusResponseSchema = {
  type: Type.OBJECT,
  properties: {
    problemTitle: {
      type: Type.STRING,
      description: 'Concise title of the calculus problem, e.g. "Derivative of x^3 * sin(2x)" or "Definite Integral of e^(-x^2) from 0 to Inf"',
    },
    problemType: {
      type: Type.STRING,
      description: 'One of: "Derivative", "Indefinite Integral", "Definite Integral", "Limit", "Taylor Series", "Differential Equation", "Extrema & Optimization", "Multivariable Calculus", "Arithmetic / Word Problem"',
    },
    inputLatex: {
      type: Type.STRING,
      description: 'Standardized LaTeX expression representing the user\'s input problem.',
    },
    finalAnswerLatex: {
      type: Type.STRING,
      description: 'Exact simplified final answer formatted in LaTeX.',
    },
    approximateValue: {
      type: Type.STRING,
      description: 'Numerical approximation (e.g. "1.77245..." or "0.84147") if applicable, otherwise empty string.',
    },
    summary: {
      type: Type.STRING,
      description: 'Clear, high-level summary (1-2 sentences) of the core mathematical theorem or method used to solve the problem.',
    },
    steps: {
      type: Type.ARRAY,
      description: 'Sequential, rigorous mathematical steps leading to the solution.',
      items: {
        type: Type.OBJECT,
        properties: {
          stepNumber: {
            type: Type.INTEGER,
            description: '1-indexed step number.',
          },
          title: {
            type: Type.STRING,
            description: 'Action-oriented step heading (e.g., "Apply Product Rule", "Integrate by Parts", "Find Critical Points").',
          },
          explanation: {
            type: Type.STRING,
            description: 'Intuitive verbal explanation of why this step is taken and what rules apply.',
          },
          latexFormula: {
            type: Type.STRING,
            description: 'LaTeX formatted intermediate equation or algebraic manipulation for this step.',
          },
          ruleApplied: {
            type: Type.STRING,
            description: 'Specific theorem or rule applied (e.g., "Chain Rule: d/dx[f(g(x))] = f\'(g(x))g\'(x)", "L\'Hôpital\'s Rule", "Separation of Variables").',
          },
        },
        required: ['stepNumber', 'title', 'explanation', 'latexFormula'],
      },
    },
    keyProperties: {
      type: Type.ARRAY,
      description: 'Relevant mathematical properties (e.g. Domain, Continuity, Asymptotes, Radius of Convergence, Inflection Points, Critical Points).',
      items: {
        type: Type.OBJECT,
        properties: {
          label: {
            type: Type.STRING,
            description: 'Property name (e.g., "Domain", "Critical Points", "Convergence Interval").',
          },
          value: {
            type: Type.STRING,
            description: 'LaTeX or plain text value of the property.',
          },
        },
        required: ['label', 'value'],
      },
    },
    graphable: {
      type: Type.OBJECT,
      description: 'Parameters for visual interactive 2D function plotting if the problem involves single-variable functions f(x).',
      properties: {
        hasGraph: {
          type: Type.BOOLEAN,
          description: 'True if f(x) can be plotted on 2D cartesian coordinates.',
        },
        functionLatex: {
          type: Type.STRING,
          description: 'Original function in LaTeX, e.g. "f(x) = x^3 \\sin(2x)"',
        },
        functionJs: {
          type: Type.STRING,
          description: 'Safe JavaScript math expression of f(x) using Math functions, e.g. "Math.pow(x, 3) * Math.sin(2 * x)" or "Math.exp(-x * x)". Must evaluate with numeric variable x.',
        },
        derivativeJs: {
          type: Type.STRING,
          description: 'Safe JavaScript expression for f\'(x) if applicable, e.g. "3 * Math.pow(x, 2) * Math.sin(2*x) + 2 * Math.pow(x, 3) * Math.cos(2*x)"',
        },
        xMin: {
          type: Type.NUMBER,
          description: 'Recommended minimum x-axis bound, e.g. -5',
        },
        xMax: {
          type: Type.NUMBER,
          description: 'Recommended maximum x-axis bound, e.g. 5',
        },
        yMin: {
          type: Type.NUMBER,
          description: 'Recommended minimum y-axis bound, e.g. -10',
        },
        yMax: {
          type: Type.NUMBER,
          description: 'Recommended maximum y-axis bound, e.g. 10',
        },
        definiteIntegralBounds: {
          type: Type.OBJECT,
          description: 'Definite integral shading bounds if applicable.',
          properties: {
            lower: { type: Type.NUMBER },
            upper: { type: Type.NUMBER },
          },
        },
        criticalPoints: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              x: { type: Type.NUMBER },
              y: { type: Type.NUMBER },
              label: { type: Type.STRING },
            },
            required: ['x', 'y', 'label'],
          },
        },
      },
      required: ['hasGraph'],
    },
  },
  required: ['problemTitle', 'problemType', 'inputLatex', 'finalAnswerLatex', 'summary', 'steps'],
};

// API endpoint to solve natural language calculus problems
app.post('/api/calculus/solve', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string' || query.trim() === '') {
      return res.status(400).json({ error: 'A mathematical query or problem statement is required.' });
    }

    if (!apiKey) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please verify your environment settings.',
      });
    }

    const systemInstruction = `You are a world-class AI Scientific & Calculus Computational Engine and Mathematics Professor.
Your job is to parse and solve any mathematical question—from fundamental scientific arithmetic to complex calculus—provided in natural language or math notation.

Problem types you master:
1. Differential Calculus: Single and multivariable derivatives, partial derivatives (∂f/∂x, ∂f/∂y), directional derivatives, gradients ∇f, chain rule, product rule, quotient rule, implicit differentiation, higher-order derivatives.
2. Integral Calculus: Indefinite integrals, definite integrals, substitution method, integration by parts, trigonometric substitutions, partial fractions, improper integrals, double/triple integrals, arc length, surface area, volume of revolution.
3. Limits & Continuity: Limits as x approaches a finite value or ±∞, one-sided limits, L'Hôpital's rule, indeterminate forms (0/0, ∞/∞, 0*∞, 1^∞), epsilon-delta reasoning.
4. Infinite Series: Taylor and Maclaurin series expansions, radius & interval of convergence, power series, ratio test, root test, alternating series error estimation.
5. Differential Equations: First-order ODEs (separable, linear integrating factor, exact), second-order linear ODEs (homogeneous with characteristic equation, non-homogeneous with undetermined coefficients/variation of parameters), initial value problems (IVPs).
6. Optimization & Curve Sketching: Critical points, local/global extrema, first and second derivative tests, concavity, inflection points, asymptotes, Lagrange multipliers.
7. Multivariable & Vector Calculus: Divergence, curl, line integrals, Green's Theorem, Stokes' Theorem, Divergence Theorem.
8. Applied Word Problems & Scientific Arithmetic: Rate of change, related rates, projectile motion, exponential growth/decay, physics integration, complex arithmetic.

CRITICAL INSTRUCTIONS:
- Ensure all mathematical formulas in LaTeX are valid and enclosed without extra unescaped syntax.
- For graphable functions, always populate \`functionJs\` with a valid, safe executable JavaScript math expression using standard \`Math\` functions (e.g. \`Math.sin(x)\`, \`Math.cos(x)\`, \`Math.exp(x)\`, \`Math.pow(x, 2)\`, \`Math.sqrt(x)\`, \`Math.abs(x)\`, \`Math.log(x)\`, etc.) where \`x\` is the numeric variable.
- Break down each step pedagogically with concise explanations and the exact rule applied.
- If the problem cannot be graphed (e.g. purely multivariable without a 2D projection, or abstract proof), set \`hasGraph: false\`.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Solve this calculus / scientific math problem step-by-step: "${query.trim()}"`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: calculusResponseSchema,
      },
    });

    const responseText = response.text;
    if (!responseText) {
      return res.status(502).json({ error: 'Empty response received from mathematical engine.' });
    }

    const parsedData = JSON.parse(responseText);
    return res.json(parsedData);
  } catch (error: any) {
    console.error('Error solving calculus problem:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to solve mathematical query. Please try phrasing with standard calculus terms.',
    });
  }
});

// Quick natural language arithmetic / expression converter
app.post('/api/calculus/quick-eval', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required.' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Evaluate or interpret this arithmetic/scientific math question in natural language: "${query}". Return the exact formula in LaTeX and numerical answer.`,
      config: {
        systemInstruction: 'You are a quick mathematical calculator. Return clean JSON with formulaLatex, answerText, and answerValue.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            formulaLatex: { type: Type.STRING },
            answerText: { type: Type.STRING },
            answerValue: { type: Type.NUMBER },
          },
          required: ['formulaLatex', 'answerText'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Evaluation error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Dev vs Prod Vite Integration
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Scientific Calculator running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
