import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import AreciboGrid from './AreciboGrid';
import AreciboSection from './AreciboSection';
import AreciboShareCard from './AreciboShareCard';
import AreciboArchive from './AreciboArchive';
import styles from './styles.module.css';
import { useWeeklyStore } from '../../store/weeklyStore';

/**
 * AreciboRecap - Main component displaying weekly recap modal
 * Shows pixelated Arecibo grid + 7 sections + share/archive options
 *
 * @param {Object} props
 * @param {Object} props.weekData - Weekly aggregated data
 * @param {Object} props.intent - AreciboIntent (from expressionEngine)
 * @param {number} props.bondLevel - Bond level (1-5)
 * @param {string} props.kingdomName - Kingdom name
 * @param {string} props.companionName - Companion name
 * @param {number[][]} props.pixelData - Grid pixel data (73x23 or similar)
 * @param {boolean} props.open - Whether modal is open
 * @param {Function} props.onClose - Called when modal closes
 * @param {Function} [props.onArchive] - Called when archive button clicked
 */
export default function AreciboRecap({
  weekData,
  intent,
  bondLevel = 1,
  kingdomName = 'Kingdom',
  companionName = 'Companion',
  pixelData,
  open = true,
  onClose,
  onArchive,
}) {
  const [showArchive, setShowArchive] = useState(false);
  const { selectedSectionIndex, setSelectedSection, toggleSectionExpanded } =
    useWeeklyStore();

  // Section metadata
  const sections = useMemo(
    () => [
      {
        title: 'Count',
        icon: '📊',
        key: 'count',
        narrative:
          intent?.sections?.count?.derivative === 'standard'
            ? `You tracked ${weekData?.billsPaid || 0} bills and completed ${weekData?.habitsCompleted || 0} habits.`
            : 'Count derivative processed.',
      },
      {
        title: 'Elements',
        icon: '🧬',
        key: 'elements',
        narrative:
          intent?.sections?.elements?.derivative === 'full'
            ? `Your ${weekData?.activeHabits?.length || 0} active habits formed the week.`
            : 'Elements identified.',
      },
      {
        title: 'Pattern',
        icon: '📈',
        key: 'pattern',
        narrative:
          intent?.sections?.pattern?.narrative === 'strong_finish'
            ? 'Your week gained momentum toward the end.'
            : 'Daily intensity pattern analyzed.',
      },
      {
        title: 'Thread',
        icon: '🔗',
        key: 'thread',
        narrative: `Longest streak: ${weekData?.longestStreak?.days || 0} days on ${weekData?.longestStreak?.habit || 'tracking'}.`,
      },
      {
        title: 'Reflection',
        icon: '🪞',
        key: 'reflection',
        narrative: `Week sentiment: ${weekData?.weekSentiment || 'mixed'}.`,
      },
      {
        title: 'Kingdom',
        icon: '🏰',
        key: 'kingdom',
        narrative: 'Your kingdom grows with each completed week.',
      },
      {
        title: 'Signal',
        icon: '📡',
        key: 'signal',
        narrative: intent?.sections?.signal?.message || 'Transmission received.',
      },
    ],
    [intent, weekData]
  );

  const weekNumber = intent?.weekNumber || weekData?.weekNumber || 1;
  const weekStart = weekData?.weekStart ? new Date(weekData.weekStart + 'T00:00:00') : new Date();
  const weekEnd = weekData?.weekEnd ? new Date(weekData.weekEnd + 'T00:00:00') : new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
  const weekDateRange = formatDateRange(weekStart, weekEnd);

  if (!open) {
    return null;
  }

  return createPortal(
    <div className={styles.recapModal} onClick={(e) => {
      if (e.target === e.currentTarget) onClose?.();
    }}>
      <div className={styles.modalContent}>
        {/* Close button */}
        <button className={styles.closeButton} onClick={onClose} aria-label="Close modal">
          ✕
        </button>

        {/* Header */}
        <div className={styles.header}>
          <p className={styles.headerTitle}>Weekly Recap</p>
          <h2 className={styles.headerSubtitle}>
            Week {weekNumber} · {weekDateRange}
          </h2>
        </div>

        {/* Main grid */}
        {pixelData && (
          <div className={styles.gridWrapper}>
            <AreciboGrid
              pixelData={pixelData}
              onSectionClick={toggleSectionExpanded}
              scale={4}
            />
          </div>
        )}

        {/* Expandable sections */}
        <div>
          {sections.map((section, index) => (
            <AreciboSection
              key={section.key}
              index={index}
              title={section.title}
              icon={section.icon}
              data={intent?.sections?.[section.key]}
              narrative={section.narrative}
              stats={generateStatsForSection(section.key, weekData, intent)}
              isExpanded={selectedSectionIndex === index}
              onToggle={() => setSelectedSection(
                selectedSectionIndex === index ? null : index
              )}
            />
          ))}
        </div>

        {/* Share card */}
        <AreciboShareCard
          intent={intent}
          kingdomName={kingdomName}
          companionName={companionName}
          weekNumber={weekNumber}
          weekDate={weekDateRange}
          pixelData={pixelData}
          bondLevel={bondLevel}
          onExport={(data) => {
            console.log('Exported:', data);
          }}
        />

        {/* Action buttons */}
        <div className={styles.buttonGroup}>
          <button
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={() => setShowArchive(!showArchive)}
          >
            {showArchive ? '← Back' : '📚 View Archive'}
          </button>
          <button
            className={styles.button}
            onClick={() => {
              onArchive?.();
              onClose?.();
            }}
          >
            💾 Save & Close
          </button>
        </div>

        {/* Archive view */}
        {showArchive && (
          <AreciboArchive
            onSelectWeek={(weekNum) => {
              console.log('Selected archived week:', weekNum);
              setShowArchive(false);
            }}
          />
        )}
      </div>
    </div>,
    document.body
  );
}

/**
 * Helper: format date range
 */
function formatDateRange(start, end) {
  const opts = { month: 'short', day: 'numeric' };
  const startStr = start.toLocaleDateString('en-US', opts);
  const endStr = end.toLocaleDateString('en-US', opts);
  return `${startStr} - ${endStr}`;
}

/**
 * Helper: generate stats for a specific section
 */
function generateStatsForSection(sectionKey, weekData, intent) {
  const data = intent?.sections?.[sectionKey];
  
  switch (sectionKey) {
    case 'count':
      return [
        { label: 'Bills Paid', value: weekData?.billsPaid || 0 },
        { label: 'Bills Total', value: weekData?.billsTotal || 0 },
        { label: 'Habits Done', value: weekData?.habitsCompleted || 0 },
        { label: 'Habits Total', value: weekData?.habitsTotal || 0 },
        { label: 'Meetings', value: weekData?.meetings || 0 },
        { label: 'Days Active', value: weekData?.daysActive || 0 },
      ];
    case 'elements':
      return (weekData?.activeHabits || []).map((habit) => ({
        label: habit.name,
        value: `${habit.completed}/${habit.total}`,
      }));
    case 'pattern':
      return [
        { label: 'Week Pattern', value: data?.narrative || 'analyzed' },
      ];
    case 'thread':
      return [
        { label: 'Longest Streak', value: `${weekData?.longestStreak?.days || 0}d` },
        { label: 'Weeks Engaged', value: weekData?.weeksEngaged || 1 },
      ];
    case 'reflection':
      return [
        { label: 'Week Sentiment', value: weekData?.weekSentiment || 'mixed' },
        { label: 'Bond XP', value: weekData?.bondXpEarned || 0 },
      ];
    case 'kingdom':
      return [
        { label: 'Kingdom', value: 'Growth recorded' },
      ];
    case 'signal':
      return [
        { label: 'Derivative', value: data?.derivative || 'fact_grounded' },
      ];
    default:
      return [];
  }
}
