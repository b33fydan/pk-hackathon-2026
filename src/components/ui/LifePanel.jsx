import { useState } from 'react';
import {
  useFactStore,
  selectActiveHabitDefinitions,
  selectHabitsForDate,
  selectHabitStreak,
  selectRecentMeetings,
  selectRecentMilestones,
} from '../../store/factStore';
import {
  HABIT_EMOJI_OPTIONS,
  MEETING_INTENSITY_OPTIONS,
  MEETING_INTENSITY_MAP,
  MILESTONE_TYPE_OPTIONS,
  MILESTONE_TYPE_MAP,
} from '../../utils/constants';
import { getTodayDate, formatShortDate } from '../../utils/formatters';
import { useBondStore } from '../../store/bondStore';
import { BOND_XP_AWARDS } from '../../utils/bondMath';
import FieldLabel from './FieldLabel';

// ── Habits Section ───────────────────────────────────────

function HabitSection() {
  const definitions = useFactStore(selectActiveHabitDefinitions);
  const todayCheckins = useFactStore((state) => selectHabitsForDate(state, getTodayDate()));
  const addHabitDefinition = useFactStore((state) => state.addHabitDefinition);
  const archiveHabitDefinition = useFactStore((state) => state.archiveHabitDefinition);
  const toggleHabit = useFactStore((state) => state.toggleHabit);

  const [label, setLabel] = useState('');
  const [emoji, setEmoji] = useState(HABIT_EMOJI_OPTIONS[0].value);
  const [showDefine, setShowDefine] = useState(false);

  const handleAddHabit = (event) => {
    event.preventDefault();
    if (!label.trim()) return;
    addHabitDefinition({ label: label.trim(), emoji });
    useBondStore.getState().awardBondXP(BOND_XP_AWARDS.add_habit, 'add_habit');
    setLabel('');
    setEmoji(HABIT_EMOJI_OPTIONS[0].value);
    setShowDefine(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <FieldLabel>Daily Habits</FieldLabel>
        <button
          type="button"
          onClick={() => setShowDefine(!showDefine)}
          className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300 transition hover:text-emerald-200"
        >
          {showDefine ? 'Done' : '+ Add'}
        </button>
      </div>

      {showDefine && (
        <form onSubmit={handleAddHabit} className="space-y-3 rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-3">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Meditate"
            className="w-full rounded-2xl border border-white/8 bg-black/25 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-slate-500 focus:border-emerald-300/35"
          />
          <div className="flex flex-wrap gap-2">
            {HABIT_EMOJI_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setEmoji(opt.value)}
                className={`rounded-xl border px-3 py-2 text-base transition ${
                  emoji === opt.value
                    ? 'border-emerald-300/40 bg-emerald-400/15'
                    : 'border-white/8 hover:border-white/16'
                }`}
              >
                {opt.value}
              </button>
            ))}
          </div>
          <button
            type="submit"
            disabled={!label.trim()}
            className="w-full rounded-2xl border border-emerald-300/25 bg-emerald-400/15 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-100 transition hover:bg-emerald-400/20 disabled:opacity-40"
          >
            Add Habit
          </button>
        </form>
      )}

      {definitions.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-cyan-400/25 bg-cyan-400/5 px-4 py-5 text-sm leading-6 text-slate-300">
          Add your first habit to start tracking streaks.
        </div>
      ) : (
        <div className="space-y-2">
          {definitions.map((def) => {
            const checkin = todayCheckins.find((c) => c.habitKey === def.key);
            const completed = checkin?.completed || false;

            return (
              <div
                key={def.id}
                className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/5 px-4 py-3 transition hover:border-white/14"
              >
                <button
                  type="button"
                  onClick={() => toggleHabit(def.key)}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl border text-base transition ${
                    completed
                      ? 'border-emerald-300/50 bg-emerald-400/20'
                      : 'border-white/12 bg-black/20 hover:border-white/25'
                  }`}
                >
                  {completed ? '✓' : def.emoji}
                </button>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${completed ? 'text-emerald-200 line-through' : 'text-stone-100'}`}>
                    {def.label}
                  </p>
                  <HabitStreakDisplay habitKey={def.key} />
                </div>
                <button
                  type="button"
                  onClick={() => archiveHabitDefinition(def.id)}
                  className="text-xs text-slate-500 transition hover:text-red-300"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function HabitStreakDisplay({ habitKey }) {
  const streak = useFactStore((state) => selectHabitStreak(state, habitKey));
  if (streak === 0) return null;
  return (
    <p className="text-xs text-amber-300/80">
      {streak} day streak 🔥
    </p>
  );
}

// ── Meetings Section ─────────────────────────────────────

function MeetingSection() {
  const recentMeetings = useFactStore((state) => selectRecentMeetings(state, 7));
  const addMeeting = useFactStore((state) => state.addMeeting);
  const removeMeeting = useFactStore((state) => state.removeMeeting);

  const [label, setLabel] = useState('');
  const [intensity, setIntensity] = useState('normal');

  const handleAdd = (event) => {
    event.preventDefault();
    if (!label.trim()) return;
    addMeeting({ label: label.trim(), intensity });
    setLabel('');
    setIntensity('normal');
  };

  return (
    <div className="space-y-3">
      <FieldLabel>Meetings</FieldLabel>

      <form onSubmit={handleAdd} className="space-y-3 rounded-2xl border border-white/8 bg-white/4 p-3">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Team standup"
          className="w-full rounded-2xl border border-white/8 bg-black/25 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-slate-500 focus:border-emerald-300/35"
        />
        <div className="flex gap-2">
          {MEETING_INTENSITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setIntensity(opt.value)}
              className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                intensity === opt.value
                  ? 'border-white/25 bg-white/10 text-stone-100'
                  : 'border-white/8 text-slate-400 hover:border-white/16'
              }`}
              style={intensity === opt.value ? { borderColor: `${opt.color}50` } : undefined}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button
          type="submit"
          disabled={!label.trim()}
          className="w-full rounded-2xl border border-emerald-300/25 bg-emerald-400/15 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-100 transition hover:bg-emerald-400/20 disabled:opacity-40"
        >
          Log Meeting
        </button>
      </form>

      {recentMeetings.length > 0 && (
        <div className="space-y-2">
          {recentMeetings.map((meeting) => {
            const intensityInfo = MEETING_INTENSITY_MAP[meeting.intensity] ?? MEETING_INTENSITY_OPTIONS[1];
            return (
              <div
                key={meeting.id}
                className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/5 px-4 py-3"
              >
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: intensityInfo.color }}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-stone-100">{meeting.label}</p>
                  <p className="text-xs text-slate-500">{formatShortDate(meeting.date)} · {intensityInfo.label}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeMeeting(meeting.id)}
                  className="text-xs text-slate-500 transition hover:text-red-300"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Milestones Section ───────────────────────────────────

function MilestoneSection() {
  const recentMilestones = useFactStore((state) => selectRecentMilestones(state, 30));
  const addMilestone = useFactStore((state) => state.addMilestone);
  const removeMilestone = useFactStore((state) => state.removeMilestone);

  const [type, setType] = useState('custom');
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');

  const handleAdd = (event) => {
    event.preventDefault();
    if (!value.trim()) return;
    addMilestone({ type, value: value.trim(), note: note.trim() });
    useBondStore.getState().awardBondXP(BOND_XP_AWARDS.share_milestone, 'share_milestone');
    setValue('');
    setNote('');
  };

  return (
    <div className="space-y-3">
      <FieldLabel>Milestones</FieldLabel>

      <form onSubmit={handleAdd} className="space-y-3 rounded-2xl border border-white/8 bg-white/4 p-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-2xl border border-white/8 bg-black/25 px-4 py-3 text-sm text-stone-100 outline-none focus:border-emerald-300/35"
          >
            {MILESTONE_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.emoji} {opt.label}
              </option>
            ))}
          </select>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="First 100 users"
            className="rounded-2xl border border-white/8 bg-black/25 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-slate-500 focus:border-emerald-300/35"
          />
        </div>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note..."
          className="w-full rounded-2xl border border-white/8 bg-black/25 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-slate-500 focus:border-emerald-300/35"
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="w-full rounded-2xl border border-emerald-300/25 bg-emerald-400/15 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-100 transition hover:bg-emerald-400/20 disabled:opacity-40"
        >
          Log Milestone
        </button>
      </form>

      {recentMilestones.length > 0 && (
        <div className="space-y-2">
          {recentMilestones.map((ms) => {
            const typeInfo = MILESTONE_TYPE_MAP[ms.type] ?? MILESTONE_TYPE_OPTIONS[4];
            return (
              <div
                key={ms.id}
                className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/5 px-4 py-3"
              >
                <span className="text-lg">{typeInfo.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-stone-100">{ms.value}</p>
                  <p className="text-xs text-slate-500">
                    {formatShortDate(ms.date)} · {typeInfo.label}
                    {ms.note ? ` · ${ms.note}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeMilestone(ms.id)}
                  className="text-xs text-slate-500 transition hover:text-red-300"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main LifePanel ───────────────────────────────────────

export default function LifePanel() {
  return (
    <div className="space-y-6">
      <HabitSection />
      <MeetingSection />
      <MilestoneSection />
    </div>
  );
}
