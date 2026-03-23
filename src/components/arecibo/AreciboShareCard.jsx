import { useEffect, useRef, useState } from 'react';
import styles from './styles.module.css';

/**
 * AreciboShareCard - Generates shareable card with grid preview
 * Renders as HTML element (for screenshot) + export to PNG
 *
 * @param {Object} props
 * @param {Object} props.intent - AreciboIntent
 * @param {string} props.kingdomName - Kingdom name
 * @param {string} props.companionName - Companion name
 * @param {string} props.weekNumber - Week number (e.g. "12")
 * @param {string} props.weekDate - Week date range (e.g. "March 17-23")
 * @param {number[][]} props.pixelData - Grid pixel data for preview
 * @param {number} [props.bondLevel] - Bond level (1-5) for visual effect
 * @param {Function} [props.onExport] - Called with { format, blob } when export happens
 */
export default function AreciboShareCard({
  intent,
  kingdomName,
  companionName,
  weekNumber,
  weekDate,
  pixelData,
  bondLevel = 1,
  onExport,
}) {
  const cardRef = useRef(null);
  const canvasRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);

  // Render grid preview in canvas
  useEffect(() => {
    if (!pixelData || !pixelData.length) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const COLORS = [
      '#0f172a',
      '#8b5cf6',
      '#10b981',
      '#3b82f6',
      '#ef4444',
      '#fbbf24',
      '#14b8a6',
      '#06b6d4',
    ];

    const width = pixelData[0]?.length || 73;
    const height = pixelData.length;
    const scale = 2; // Small preview

    canvas.width = width * scale;
    canvas.height = height * scale;

    // Fill background
    ctx.fillStyle = COLORS[0];
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw pixels
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const colorIndex = pixelData[y][x] || 0;
        ctx.fillStyle = COLORS[colorIndex] || COLORS[0];
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
  }, [pixelData]);

  /**
   * Export card as PNG using html2canvas
   * Creates Instagram-optimized sizes: 1080x1350 and 1080x1080
   */
  const handleExportPNG = async (format) => {
    if (!window.html2canvas) {
      console.warn('html2canvas not loaded, trying fallback canvas export');
      handleExportCanvasDirectly(format);
      return;
    }

    setIsExporting(true);
    try {
      const element = cardRef.current;
      if (!element) return;

      // Use html2canvas to capture the card
      const canvas = await window.html2canvas(element, {
        backgroundColor: '#0f172a',
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, 'image/png')
      );

      if (onExport) {
        onExport({ format, blob });
      }

      // Auto-download
      downloadBlob(blob, `arecibo-week-${weekNumber}-${format}.png`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export image. Try copying to clipboard instead.');
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Fallback: direct canvas export (just the grid)
   */
  const handleExportCanvasDirectly = async (format) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (onExport) {
        onExport({ format, blob });
      }
      downloadBlob(blob, `arecibo-week-${weekNumber}-grid.png`);
    }, 'image/png');
  };

  /**
   * Copy text representation to clipboard
   */
  const handleCopyText = () => {
    const text = `
📡 Arecibo Transmission
🏰 ${kingdomName}
Week ${weekNumber} · ${weekDate}
Transmitted by ${companionName}
Bond Level: ${bondLevel}/5

paydaykingdom.app
    `.trim();

    navigator.clipboard.writeText(text).then(() => {
      alert('Recap copied to clipboard!');
    });
  };

  /**
   * Copy card as image to clipboard (requires ClipboardItem API)
   */
  const handleCopyImage = async () => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.toBlob(async (blob) => {
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        alert('Grid copied to clipboard!');
      });
    } catch (error) {
      console.error('Copy image failed:', error);
      alert('Could not copy image. Try downloading instead.');
    }
  };

  return (
    <div className={styles.shareCard}>
      {/* Shareable card preview */}
      <div ref={cardRef} className={styles.shareCardInner}>
        {/* Grid */}
        <div className={styles.shareCardGrid}>
          <canvas
            ref={canvasRef}
            style={{
              imageRendering: 'pixelated',
              imageRendering: 'crisp-edges',
              width: '140px',
              height: 'auto',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
            }}
          />
        </div>

        {/* Text info */}
        <div className={styles.shareCardHeader}>{kingdomName}</div>
        <div className={styles.shareCardSmall}>
          Week {weekNumber} · {weekDate}
        </div>
        <div className={styles.shareCardSmall}>
          Transmitted by {companionName}
        </div>

        {/* Bond level bar */}
        <div className={styles.shareCardSmall} style={{ marginTop: 'var(--spacing-sm)' }}>
          <div style={{ display: 'flex', gap: '2px', justifyContent: 'center', marginBottom: '4px' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: '16px',
                  height: '8px',
                  backgroundColor: i < bondLevel ? '#8b5cf6' : '#334155',
                  borderRadius: '2px',
                }}
              />
            ))}
          </div>
          <div>Bond Level {bondLevel}</div>
        </div>

        {/* Footer */}
        <div className={styles.shareCardFooter}>paydaykingdom.app</div>
      </div>

      {/* Export buttons */}
      <div className={styles.buttonGroup}>
        <button
          className={styles.button}
          onClick={() => handleExportPNG('1080x1350')}
          disabled={isExporting}
          title="Export as 1080x1350 (Instagram feed)"
        >
          {isExporting ? '⏳ Exporting...' : '⬇️ Download'}
        </button>
        <button
          className={styles.button}
          onClick={handleCopyImage}
          title="Copy grid to clipboard"
        >
          📋 Copy Grid
        </button>
        <button
          className={styles.button}
          onClick={handleCopyText}
          title="Copy text version"
        >
          📝 Copy Text
        </button>
      </div>
    </div>
  );
}

/**
 * Helper: download blob as file
 */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
