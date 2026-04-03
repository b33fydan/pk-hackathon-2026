import { useState, useEffect, useCallback } from 'react';
import { useFactStore } from '../../store/factStore';
import { useBondStore } from '../../store/bondStore';
import { useProfileStore } from '../../store/profileStore';
import { useWeeklyStore } from '../../store/weeklyStore';
import { getWeekBounds, formatShortDate } from '../../utils/formatters';
import { generateAreciboIntent } from '../../utils/arecibo/expressionEngine';
import { assembleWeekData, generatePixelData } from '../../utils/weekDataAssembler';
import AreciboRecap from '../arecibo/AreciboRecap';
import AreciboArchive from '../arecibo/AreciboArchive';
import FieldLabel from './FieldLabel';

export default function WeeklyPanel() {
  const saveWeeklyRecap = useFactStore((state) => state.saveWeeklyRecap);
  const getWeeklyRecap = useFactStore((state) => state.getWeeklyRecap);

  const [weekOffset, setWeekOffset] = useState(0);
  const [wins, setWins] = useState(['']);
  const [losses, setLosses] = useState(['']);
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  // Arecibo state
  const [showRecap, setShowRecap] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [recapIntent, setRecapIntent] = useState(null);
  const [recapPixels, setRecapPixels] = useState(null);
  const [recapWeekData, setRecapWeekData] = useState(null);
  const [generating, setGenerating] = useState(false);

  const currentWeekIntent = useWeeklyStore((state) => state.currentWeekIntent);
  const archiveCount = useWeeklyStore((state) => state.archive.length);

  const getOffsetDate = useCallback(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);

  const { weekStart, weekEnd } = getWeekBounds(getOffsetDate());

  // Load existing recap when week changes
  useEffect(() => {
    const existing = getWeeklyRecap(weekStart);
    if (existing) {
      setWins(existing.wins.length > 0 ? existing.wins : ['']);
      setLosses(existing.losses.length > 0 ? existing.losses : ['']);
      setNotes(existing.notes || '');
    } else {
      setWins(['']);
      setLosses(['']);
      setNotes('');
    }
    setSaved(false);
  }, [weekStart, getWeeklyRecap]);

  const handleSave = () => {
    saveWeeklyRecap({ weekStart, weekEnd, wins, losses, notes });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleGenerateRecap = async () => {
    setGenerating(true);

    try {
      // Save current input first
      if (wins.some((w) => w.trim()) || losses.some((l) => l.trim()) || notes.trim()) {
        saveWeeklyRecap({ weekStart, weekEnd, wins, losses, notes });
      }

      // Assemble week data from all stores
      const weekData = assembleWeekData({
        factState: useFactStore.getState(),
        bondState: useBondStore.getState(),
        profileState: useProfileStore.getState(),
        weekStart,
      });

      // Generate intent (template fallback, no LLM for MVP)
      const intent = await generateAreciboIntent({
        weekData,
        bondLevel: weekData.bondLevel,
        tasteProfile: useProfileStore.getState().preferences,
        llmBudget: 0,
        llmService: null,
      });

      // Generate pixel grid
      const pixels = generatePixelData(weekData);

      // Store in weeklyStore
      const weekNumber = weekData.weekNumber;
      useWeeklyStore.getState().setCurrentWeekIntent(intent, weekNumber, weekStart);

      setRecapIntent(intent);
      setRecapPixels(pixels);
      setRecapWeekData(weekData);
      setShowRecap(true);
    } catch (err) {
      console.error('[WeeklyPanel] Failed to generate recap:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleArchiveRecap = () => {
    useWeeklyStore.getState().archiveCurrentWeek();
    setShowRecap(false);
  };

  const handleCloseRecap = () => {
    setShowRecap(false);
  };

  const updateListItem = (list, setList, index, value) => {
    const next = [...list];
    next[index] = value;
    setList(next);
  };

  const addListItem = (list, setList) => {
    setList([...list, '']);
  };

  const removeListItem = (list, setList, index) => {
    if (list.length <= 1) {
      setList(['']);
      return;
    }
    setList(list.filter((_, i) => i !== index));
  };

  const hasContent = wins.some((w) => w.trim()) || losses.some((l) => l.trim()) || notes.trim();

  return (
    <div className="space-y-5">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setWeekOffset((o) => o - 1)}
          className="rounded-xl border border-white/8 px-3 py-2 text-xs text-slate-300 transition hover:border-white/16 hover:text-stone-100"
        >
          ←
        </button>
        <div className="text-center">
          <p className="font-['Press_Start_2P'] text-[0.5rem] uppercase tracking-[0.3em] text-emerald-300">
            Week of
          </p>
          <p className="mt-1 text-sm font-medium text-stone-100">
            {formatShortDate(weekStart)} – {formatShortDate(weekEnd)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setWeekOffset((o) => Math.min(o + 1, 0))}
          disabled={weekOffset >= 0}
          className="rounded-xl border border-white/8 px-3 py-2 text-xs text-slate-300 transition hover:border-white/16 hover:text-stone-100 disabled:opacity-30"
        >
          →
        </button>
      </div>

      {/* Wins */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <FieldLabel>Wins</FieldLabel>
          <button
            type="button"
            onClick={() => addListItem(wins, setWins)}
            className="text-xs font-semibold text-emerald-300 transition hover:text-emerald-200"
          >
            +
          </button>
        </div>
        {wins.map((win, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={win}
              onChange={(e) => updateListItem(wins, setWins, i, e.target.value)}
              placeholder={i === 0 ? 'Shipped the feature...' : 'Another win...'}
              className="flex-1 rounded-2xl border border-white/8 bg-black/25 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-slate-500 focus:border-emerald-300/35"
            />
            <button
              type="button"
              onClick={() => removeListItem(wins, setWins, i)}
              className="px-2 text-xs text-slate-500 transition hover:text-red-300"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Losses */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <FieldLabel>Tough Moments</FieldLabel>
          <button
            type="button"
            onClick={() => addListItem(losses, setLosses)}
            className="text-xs font-semibold text-emerald-300 transition hover:text-emerald-200"
          >
            +
          </button>
        </div>
        {losses.map((loss, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={loss}
              onChange={(e) => updateListItem(losses, setLosses, i, e.target.value)}
              placeholder={i === 0 ? 'Missed a deadline...' : 'Another challenge...'}
              className="flex-1 rounded-2xl border border-white/8 bg-black/25 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-slate-500 focus:border-emerald-300/35"
            />
            <button
              type="button"
              onClick={() => removeListItem(losses, setLosses, i)}
              className="px-2 text-xs text-slate-500 transition hover:text-red-300"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <FieldLabel>Notes</FieldLabel>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How was the week overall?"
          rows={3}
          className="w-full resize-none rounded-2xl border border-white/8 bg-black/25 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-slate-500 focus:border-emerald-300/35"
        />
      </div>

      {/* Save */}
      <button
        type="button"
        onClick={handleSave}
        disabled={!hasContent}
        className={`w-full rounded-2xl border px-4 py-3 text-sm font-semibold uppercase tracking-[0.25em] transition ${
          saved
            ? 'border-emerald-300/40 bg-emerald-400/20 text-emerald-100'
            : 'border-emerald-300/25 bg-emerald-400/15 text-emerald-100 hover:bg-emerald-400/20 disabled:opacity-40'
        }`}
      >
        {saved ? 'Saved ✓' : 'Save Weekly Recap'}
      </button>

      {/* Generate Arecibo Recap */}
      <button
        type="button"
        onClick={handleGenerateRecap}
        disabled={generating}
        className="w-full rounded-2xl border border-amber-300/25 bg-amber-400/10 px-4 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-amber-100 transition hover:bg-amber-400/15 disabled:opacity-40"
      >
        {generating ? 'Generating...' : '✦ Generate Transmission'}
      </button>

      {/* Archive link */}
      {archiveCount > 0 && (
        <button
          type="button"
          onClick={() => setShowArchive(!showArchive)}
          className="w-full text-center text-xs text-slate-400 transition hover:text-slate-200"
        >
          {showArchive ? 'Hide Archive' : `View Archive (${archiveCount} week${archiveCount > 1 ? 's' : ''})`}
        </button>
      )}

      {showArchive && <AreciboArchive onSelectWeek={() => {}} />}

      {/* Arecibo Recap Modal */}
      {showRecap && recapIntent && recapPixels && (
        <AreciboRecap
          weekData={recapWeekData}
          intent={recapIntent}
          pixelData={recapPixels}
          bondLevel={useBondStore.getState().bondLevel}
          kingdomName={useProfileStore.getState().kingdomName}
          companionName={useProfileStore.getState().companionName}
          open={showRecap}
          onClose={handleCloseRecap}
          onArchive={handleArchiveRecap}
        />
      )}
    </div>
  );
}
