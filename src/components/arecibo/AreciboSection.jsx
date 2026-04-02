import { useEffect, useRef } from 'react';
import styles from './styles.module.css';

/**
 * AreciboSection - Expandable section showing decoded data
 * Animated expand/collapse with narrative and stats
 *
 * @param {Object} props
 * @param {number} props.index - Section index (0-6)
 * @param {string} props.title - Section title
 * @param {string} props.icon - Section emoji icon
 * @param {Object} props.data - Section data from AreciboIntent
 * @param {string} [props.narrative] - Human-readable narrative
 * @param {Array} [props.stats] - Array of { label, value } pairs
 * @param {boolean} props.isExpanded - Whether section is expanded
 * @param {Function} props.onToggle - Called when section is clicked
 */
export default function AreciboSection({
  index,
  title,
  icon,
  data,
  narrative,
  stats,
  isExpanded,
  onToggle,
}) {
  const contentRef = useRef(null);

  // Generate stats from data if not provided
  const generateStats = () => {
    if (stats && stats.length > 0) {
      return stats;
    }

    // Fallback: derive stats from data object
    const derivedStats = [];
    if (data?.stats) {
      Object.entries(data.stats).forEach(([key, value]) => {
        derivedStats.push({
          label: key.replace(/([A-Z])/g, ' $1').toUpperCase(),
          value: typeof value === 'number' ? value : String(value),
        });
      });
    }
    return derivedStats;
  };

  const finalStats = generateStats();

  return (
    <div className={styles.section} role="region" aria-label={title}>
      <button
        className={styles.sectionHeader}
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={`section-content-${index}`}
      >
        <div>
          <span className={styles.sectionIcon}>{icon}</span>
          <h3 className={styles.sectionTitle}>{title}</h3>
        </div>
        <span
          className={`${styles.expandIcon} ${isExpanded ? styles.expanded : ''}`}
          aria-hidden="true"
        >
          ▼
        </span>
      </button>

      {isExpanded && (
        <div
          ref={contentRef}
          id={`section-content-${index}`}
          className={styles.sectionContent}
        >
          {/* Section grid/visual representation */}
          {data?.grid && (
            <div className={styles.sectionGrid}>
              <canvas
                width={data.grid.width || 50}
                height={data.grid.height || 23}
                style={{
                  imageRendering: 'pixelated',
                  imageRendering: 'crisp-edges',
                  width: `${(data.grid.width || 50) * 2}px`,
                  height: `${(data.grid.height || 23) * 2}px`,
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                }}
              />
            </div>
          )}

          {/* Narrative explanation */}
          {narrative && <p className={styles.sectionNarrative}>{narrative}</p>}

          {/* Statistics display */}
          {finalStats.length > 0 && (
            <ul className={styles.statsList}>
              {finalStats.map((stat, idx) => (
                <li key={idx} className={styles.statItem}>
                  <div className={styles.statLabel}>{stat.label}</div>
                  <div className={styles.statValue}>{stat.value}</div>
                </li>
              ))}
            </ul>
          )}

          {/* Raw derivative info */}
          {data?.derivative && (
            <div className={styles.sectionNarrative}>
              <strong>Derivative:</strong> {data.derivative}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
