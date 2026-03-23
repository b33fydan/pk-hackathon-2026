import { useEffect, useRef, useState } from 'react';
import styles from './styles.module.css';

/**
 * AreciboGrid - Renders the pixelated Arecibo grid as a canvas
 * Takes pixelData from expressionEngine, renders with 4x scaling
 * Each section is clickable to decode
 *
 * @param {Object} props
 * @param {number[][]} props.pixelData - 2D array of color indices (0-7)
 * @param {Function} props.onSectionClick - Called with sectionIndex (0-6) when clicked
 * @param {number} [props.scale=4] - Pixel scaling (pixels per grid cell)
 * @param {string} [props.className] - Additional CSS classes
 */
export default function AreciboGrid({
  pixelData,
  onSectionClick,
  scale = 4,
  className = '',
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [gridDimensions, setGridDimensions] = useState({ width: 73, height: 23 });

  // Color palette: matches Arecibo spec (8 colors)
  const COLORS = [
    '#0f172a', // 0: Black (background)
    '#8b5cf6', // 1: Purple
    '#10b981', // 2: Green
    '#3b82f6', // 3: Blue
    '#ef4444', // 4: Red
    '#fbbf24', // 5: Yellow
    '#14b8a6', // 6: Teal
    '#06b6d4', // 7: Cyan
  ];

  // Section layout: 7 vertical sections, each ~10-11 pixels wide
  const SECTION_POSITIONS = [
    { x: 0, width: 10 },   // 0: Count (0-9)
    { x: 10, width: 11 },  // 1: Elements (10-20)
    { x: 21, width: 11 },  // 2: Pattern (21-31)
    { x: 32, width: 11 },  // 3: Thread (32-42)
    { x: 43, width: 11 },  // 4: Reflection (43-53)
    { x: 54, width: 10 },  // 5: Kingdom (54-63)
    { x: 64, width: 9 },   // 6: Signal (64-72)
  ];

  const SECTION_NAMES = [
    'Count',
    'Elements',
    'Pattern',
    'Thread',
    'Reflection',
    'Kingdom',
    'Signal',
  ];

  const SECTION_COLORS = [
    '#8b5cf6', // Purple
    '#10b981', // Green
    '#3b82f6', // Blue
    '#ef4444', // Red
    '#fbbf24', // Yellow
    '#14b8a6', // Teal
    '#06b6d4', // Cyan
  ];

  useEffect(() => {
    if (!pixelData || !pixelData.length) {
      return;
    }

    // Set dimensions from pixelData
    const height = pixelData.length;
    const width = pixelData[0]?.length || 73;
    setGridDimensions({ width, height });

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size based on pixel data and scale
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
  }, [pixelData, scale]);

  const handleCanvasClick = (e) => {
    if (!onSectionClick || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pixelX = Math.floor(x / scale);

    // Find which section was clicked
    const sectionIndex = SECTION_POSITIONS.findIndex(
      (section) => pixelX >= section.x && pixelX < section.x + section.width
    );

    if (sectionIndex !== -1) {
      onSectionClick(sectionIndex);
    }
  };

  const handleKeyDown = (e) => {
    // Allow keyboard navigation
    if (!onSectionClick) return;

    const keyMap = {
      ArrowLeft: -1,
      ArrowRight: 1,
    };

    const direction = keyMap[e.key];
    if (!direction) return;

    // This is a simplified version; full implementation would track selected index
    e.preventDefault();
  };

  return (
    <div
      className={`${styles.gridContainer} ${className}`}
      ref={containerRef}
      role="img"
      aria-label="Arecibo grid visualization"
    >
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onKeyDown={handleKeyDown}
        className={styles.canvas}
        role="button"
        tabIndex={0}
        aria-label="Click to decode sections"
        style={{
          maxWidth: '100%',
          height: 'auto',
          display: 'block',
        }}
      />

      {/* Section overlays (visual guides, clickable) */}
      <div className={styles.gridOverlay}>
        {SECTION_POSITIONS.map((section, index) => (
          <button
            key={index}
            className={styles.sectionButton}
            onClick={() => onSectionClick?.(index)}
            title={`Click to decode: ${SECTION_NAMES[index]}`}
            style={{
              position: 'absolute',
              left: `${(section.x / gridDimensions.width) * 100}%`,
              width: `${(section.width / gridDimensions.width) * 100}%`,
              height: '100%',
              top: 0,
              zIndex: 10,
              pointerEvents: 'auto',
            }}
            aria-label={`Section ${index + 1}: ${SECTION_NAMES[index]}`}
          />
        ))}
      </div>
    </div>
  );
}
