import { jsPDF } from 'jspdf';
import { CalculusSolution, CalculationHistoryItem } from '../types/calculator';

/**
 * Clean up LaTeX strings for clean, readable plain-text rendering in PDF
 */
function cleanLatexForText(latex: string): string {
  if (!latex) return '';
  return latex
    .replace(/\\left|\\right/g, '')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1) / ($2)')
    .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
    .replace(/\\sqrt\[(\d+)\]\{([^}]+)\}/g, '$1√($2)')
    .replace(/\\int_\{([^}]+)\}\^\{([^}]+)\}/g, '∫[$1 to $2]')
    .replace(/\\int/g, '∫')
    .replace(/\\lim_\{([^}]+)\}/g, 'lim[$1]')
    .replace(/\\sum_\{([^}]+)\}\^\{([^}]+)\}/g, '∑[$1 to $2]')
    .replace(/\\cdot/g, '·')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\pm/g, '±')
    .replace(/\\infty/g, '∞')
    .replace(/\\pi/g, 'π')
    .replace(/\\theta/g, 'θ')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\partial/g, '∂')
    .replace(/\\sin/g, 'sin')
    .replace(/\\cos/g, 'cos')
    .replace(/\\tan/g, 'tan')
    .replace(/\\ln/g, 'ln')
    .replace(/\\log/g, 'log')
    .replace(/\\exp/g, 'exp')
    .replace(/\\quad/g, '  ')
    .replace(/\\qquad/g, '    ')
    .replace(/\\,/g, ' ')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/[\{\}]/g, '')
    .replace(/\\/g, '');
}

/**
 * Export a Calculus Solution as a formatted, styled PDF document
 */
export async function exportSolutionToPdf(
  solution: CalculusSolution,
  graphCanvas?: HTMLCanvasElement | null
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin - 12) {
      doc.addPage();
      y = margin;
      drawHeaderBanner();
    }
  };

  const drawHeaderBanner = () => {
    // Top subtle bar
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(margin, y - 6, contentWidth, 0.8, 'F');
  };

  // --- Document Header ---
  // Background Header card
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(margin, y, contentWidth, 24, 3, 3, 'F');

  // Brand Name
  doc.setTextColor(56, 189, 248); // sky-400
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('OmniCalc AI', margin + 6, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Scientific & Symbolic Calculus Intelligence Engine', margin + 6, y + 15);

  // Date and Badge on right
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(`Report Date: ${dateStr}`, pageWidth - margin - 6, y + 9, { align: 'right' });

  // Problem Type Pill
  doc.setFillColor(14, 116, 144); // cyan-700
  doc.roundedRect(pageWidth - margin - 40, y + 12, 34, 6, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text(solution.problemType.toUpperCase(), pageWidth - margin - 23, y + 16.2, { align: 'center' });

  y += 30;

  // --- Problem Title & Input ---
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  const titleLines = doc.splitTextToSize(solution.problemTitle, contentWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 7 + 2;

  // Problem Formulation Box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('FORMULATION / INPUT EXPRESSION:', margin + 4, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  const cleanInput = cleanLatexForText(solution.inputLatex);
  doc.text(cleanInput, margin + 4, y + 10.5);

  y += 20;

  // --- Executive Summary Box ---
  doc.setFillColor(240, 249, 255); // sky-50
  doc.setDrawColor(186, 230, 253); // sky-200
  const summaryLines = doc.splitTextToSize(solution.summary, contentWidth - 8);
  const summaryBoxHeight = summaryLines.length * 4.8 + 12;

  doc.roundedRect(margin, y, contentWidth, summaryBoxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(3, 105, 161); // sky-700
  doc.text('MATHEMATICAL APPROACH & THEOREM SUMMARY', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85); // slate-700
  doc.text(summaryLines, margin + 4, y + 12);

  y += summaryBoxHeight + 6;

  // --- Final Exact Answer Callout ---
  checkPageBreak(30);

  doc.setFillColor(15, 23, 42); // slate-900
  doc.setDrawColor(14, 165, 233); // sky-500
  doc.setLineWidth(0.8);
  doc.roundedRect(margin, y, contentWidth, 24, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(56, 189, 248); // sky-400
  doc.text('FINAL EXACT MATHEMATICAL SOLUTION', margin + 6, y + 6);

  // Exact Formula
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  const cleanAnswer = cleanLatexForText(solution.finalAnswerLatex);
  doc.text(cleanAnswer, margin + 6, y + 14);

  // Numerical approx if available
  if (solution.approximateValue && solution.approximateValue.trim()) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`Numerical Approximation: ≈ ${solution.approximateValue}`, margin + 6, y + 20);
  }

  y += 30;

  // --- Key Properties Section ---
  if (solution.keyProperties && solution.keyProperties.length > 0) {
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('Key Mathematical Properties', margin, y);
    y += 5;

    const colWidth = contentWidth / Math.min(3, solution.keyProperties.length);
    let colIndex = 0;
    let propY = y;

    solution.keyProperties.forEach((prop, i) => {
      const px = margin + (i % 3) * colWidth;
      const py = propY + Math.floor(i / 3) * 14;

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.roundedRect(px, py, colWidth - 2, 12, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(prop.label.toUpperCase(), px + 3, py + 4.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      const valClean = cleanLatexForText(prop.value);
      doc.text(valClean, px + 3, py + 9.5);
    });

    const rows = Math.ceil(solution.keyProperties.length / 3);
    y += rows * 14 + 6;
  }

  // --- Graph Plot Image (if provided from canvas) ---
  if (graphCanvas && solution.graphable?.hasGraph) {
    checkPageBreak(75);
    try {
      const graphImgData = graphCanvas.toDataURL('image/png');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('Function Curve & Graphical Representation', margin, y);
      y += 4;

      const imgWidth = contentWidth;
      const imgHeight = (imgWidth * graphCanvas.height) / graphCanvas.width;
      const finalHeight = Math.min(65, imgHeight);

      doc.addImage(graphImgData, 'PNG', margin, y, imgWidth, finalHeight);
      y += finalHeight + 8;
    } catch (err) {
      console.warn('Could not export canvas image to PDF:', err);
    }
  }

  // --- Step-by-Step Derivation ---
  checkPageBreak(25);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`Step-by-Step Mathematical Derivation (${solution.steps.length} Steps)`, margin, y);
  y += 7;

  solution.steps.forEach((step) => {
    const titleText = `Step ${step.stepNumber}: ${step.title}`;
    const cleanFormula = cleanLatexForText(step.latexFormula);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const explLines = doc.splitTextToSize(step.explanation, contentWidth - 10);
    const formulaLines = doc.splitTextToSize(cleanFormula, contentWidth - 14);

    const stepCardHeight = explLines.length * 4.2 + formulaLines.length * 4.5 + (step.ruleApplied ? 22 : 18);

    checkPageBreak(stepCardHeight + 4);

    // Step Card Background
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentWidth, stepCardHeight, 2, 2, 'FD');

    // Step Header Strip
    doc.setFillColor(241, 245, 249); // slate-100
    doc.roundedRect(margin, y, contentWidth, 7, 2, 2, 'F');

    // Step Number badge & Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(titleText, margin + 4, y + 4.8);

    // Rule applied pill
    if (step.ruleApplied) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(79, 70, 229); // indigo-600
      doc.text(`[${step.ruleApplied}]`, pageWidth - margin - 4, y + 4.8, { align: 'right' });
    }

    let innerY = y + 11;

    // Explanation
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(explLines, margin + 4, innerY);
    innerY += explLines.length * 4.2 + 2;

    // Formula inner box
    const formulaBoxHeight = formulaLines.length * 4.5 + 4;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin + 4, innerY, contentWidth - 8, formulaBoxHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(3, 105, 161); // sky-700
    doc.text(formulaLines, margin + 7, innerY + 4.5);

    y += stepCardHeight + 4;
  });

  // --- Add Page Numbers & Footer to all pages ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('OmniCalc AI • Verified Mathematical Computation & Symbolic Derivation', margin, pageHeight - 8);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
  }

  // Sanitize filename
  const safeTitle = solution.problemTitle
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .slice(0, 30);
  doc.save(`omnicalc_${safeTitle}_report.pdf`);
}

/**
 * Export Calculation History as a formatted PDF summary table
 */
export async function exportHistoryToPdf(history: CalculationHistoryItem[]): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin - 12) {
      doc.addPage();
      y = margin;
      drawHeaderBanner();
    }
  };

  const drawHeaderBanner = () => {
    doc.setFillColor(15, 23, 42);
    doc.rect(margin, y - 6, contentWidth, 0.8, 'F');
  };

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(margin, y, contentWidth, 24, 3, 3, 'F');

  doc.setTextColor(56, 189, 248);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('OmniCalc AI', margin + 6, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Calculation & Derivation History Audit Log', margin + 6, y + 15);

  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Generated: ${dateStr}`, pageWidth - margin - 6, y + 9, { align: 'right' });
  doc.text(`Total Records: ${history.length}`, pageWidth - margin - 6, y + 15, { align: 'right' });

  y += 32;

  // History Statistics Cards
  const arithCount = history.filter((h) => h.type === 'arithmetic').length;
  const calcCount = history.filter((h) => h.type === 'calculus').length;

  const cardWidth = (contentWidth - 6) / 3;

  // Stat Card 1
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, cardWidth, 14, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL CALCULATIONS', margin + 4, y + 5);
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(history.length.toString(), margin + 4, y + 10.5);

  // Stat Card 2
  doc.roundedRect(margin + cardWidth + 3, y, cardWidth, 14, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('ARITHMETIC SESSIONS', margin + cardWidth + 7, y + 5);
  doc.setFontSize(11);
  doc.setTextColor(14, 116, 144); // cyan-700
  doc.text(arithCount.toString(), margin + cardWidth + 7, y + 10.5);

  // Stat Card 3
  doc.roundedRect(margin + (cardWidth + 3) * 2, y, cardWidth, 14, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('AI CALCULUS DERIVATIONS', margin + (cardWidth + 3) * 2 + 4, y + 5);
  doc.setFontSize(11);
  doc.setTextColor(79, 70, 229); // indigo-600
  doc.text(calcCount.toString(), margin + (cardWidth + 3) * 2 + 4, y + 10.5);

  y += 20;

  // Table Headers
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105); // slate-600

  doc.text('TYPE', margin + 3, y + 4.8);
  doc.text('TIMESTAMP', margin + 26, y + 4.8);
  doc.text('EXPRESSION / PROBLEM', margin + 58, y + 4.8);
  doc.text('RESULT', pageWidth - margin - 3, y + 4.8, { align: 'right' });

  y += 7;

  if (history.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('No calculations recorded in this session.', margin + 4, y + 8);
    y += 15;
  } else {
    history.forEach((item, idx) => {
      const isEven = idx % 2 === 0;
      const cleanExpr = cleanLatexForText(item.expression);
      const cleanRes = cleanLatexForText(item.result);

      const exprLines = doc.splitTextToSize(cleanExpr, 75);
      const resLines = doc.splitTextToSize(cleanRes, 45);
      const rowHeight = Math.max(exprLines.length, resLines.length) * 4.2 + 6;

      checkPageBreak(rowHeight);

      if (isEven) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, contentWidth, rowHeight, 'F');
      }

      // Border bottom
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight);

      // Type Badge
      if (item.type === 'calculus') {
        doc.setFillColor(224, 231, 255); // indigo-100
        doc.roundedRect(margin + 2, y + 2, 20, 5, 1, 1, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(67, 56, 202); // indigo-700
        doc.text('CALCULUS', margin + 12, y + 5.5, { align: 'center' });
      } else {
        doc.setFillColor(224, 242, 254); // sky-100
        doc.roundedRect(margin + 2, y + 2, 20, 5, 1, 1, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(3, 105, 161); // sky-700
        doc.text('ARITH', margin + 12, y + 5.5, { align: 'center' });
      }

      // Time
      const timeStr = new Date(item.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(timeStr, margin + 26, y + 5.5);

      // Expression
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(exprLines, margin + 58, y + 5.5);

      // Result
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(14, 116, 144);
      doc.text(resLines, pageWidth - margin - 3, y + 5.5, { align: 'right' });

      y += rowHeight;
    });
  }

  // Total pages and footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('OmniCalc AI • Calculation History Audit Report', margin, pageHeight - 8);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
  }

  doc.save(`omnicalc_history_report_${Date.now()}.pdf`);
}
