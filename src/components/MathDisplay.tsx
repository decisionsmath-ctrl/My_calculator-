import React, { useMemo } from 'react';
import katex from 'katex';

interface MathDisplayProps {
  latex: string;
  displayMode?: boolean;
  className?: string;
}

export const MathDisplay: React.FC<MathDisplayProps> = ({
  latex,
  displayMode = false,
  className = '',
}) => {
  const html = useMemo(() => {
    if (!latex) return '';
    try {
      // Clean up common issues like wrapping dollar signs
      const cleaned = latex.trim().replace(/^\$\$|\$\$$|^\\\[|\\\]$|^\$|\$$/g, '');
      return katex.renderToString(cleaned, {
        displayMode,
        throwOnError: false,
        strict: false,
        trust: true,
      });
    } catch (err) {
      console.warn('KaTeX render error:', err);
      return `<span class="font-mono text-amber-300">${latex}</span>`;
    }
  }, [latex, displayMode]);

  return (
    <span
      className={`inline-block ${displayMode ? 'overflow-x-auto max-w-full py-1 text-center' : ''} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
