import { useState } from 'react';
import { useWeeklyStore } from '../../store/weeklyStore';
import styles from './styles.module.css';

/**
 * AreciboArchive - Gallery view of past weeks
 * Shows thumbnails + metadata, click to view details
 *
 * @param {Object} props
 * @param {Function} props.onSelectWeek - Called with weekNumber when week selected
 */
export default function AreciboArchive({ onSelectWeek }) {
  const archive = useWeeklyStore((state) => state.archive);
  const [selectedWeek, setSelectedWeek] = useState(null);

  if (!archive || archive.length === 0) {
    return (
      <div className={styles.archiveContainer}>
        <h3 className={styles.archiveTitle}>📚 Archive</h3>
        <div className={styles.archiveEmpty}>
          No past weeks archived yet. Complete your first week to build history!
        </div>
      </div>
    );
  }

  return (
    <div className={styles.archiveContainer}>
      <h3 className={styles.archiveTitle}>📚 Archive</h3>

      {selectedWeek ? (
        <ArchiveWeekDetail
          week={selectedWeek}
          onBack={() => setSelectedWeek(null)}
        />
      ) : (
        <div className={styles.archiveGrid}>
          {archive.map((week) => (
            <button
              key={week.weekNumber}
              className={styles.archiveItem}
              onClick={() => setSelectedWeek(week)}
              title={`Week ${week.weekNumber}`}
            >
              <div className={styles.archiveItemNumber}>W{week.weekNumber}</div>
              <div className={styles.archiveItemLabel}>
                {formatArchiveDate(new Date(week.dateArchived))}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * ArchiveWeekDetail - Show full details of an archived week
 */
function ArchiveWeekDetail({ week, onBack }) {
  const intent = week.intent || {};

  return (
    <div>
      <button
        className={styles.button}
        onClick={onBack}
        style={{ marginBottom: '16px' }}
      >
        ← Back to Archive
      </button>

      <div
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '16px',
        }}
      >
        <h3 style={{ color: 'var(--color-text)', marginBottom: '8px' }}>
          Week {week.weekNumber}
        </h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
          Archived: {new Date(week.dateArchived).toLocaleDateString()}
        </p>

        {/* Summary stats */}
        <div
          style={{
            marginTop: '16px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
          }}
        >
          {Object.entries(intent.sections || {}).map(([key, section]) => (
            <div
              key={key}
              style={{
                padding: '8px',
                backgroundColor: 'var(--color-bg)',
                borderRadius: '6px',
                fontSize: '0.8rem',
              }}
            >
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>
                {key}
              </div>
              <div style={{ color: 'var(--color-text)', fontWeight: 600 }}>
                {section?.derivative || 'N/A'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Helper: format archive date
 */
function formatArchiveDate(date) {
  const opts = { month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', opts);
}
