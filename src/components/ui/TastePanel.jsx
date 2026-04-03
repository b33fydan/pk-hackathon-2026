import { useState } from 'react';
import { useProfileStore } from '../../store/profileStore';
import { useBondStore } from '../../store/bondStore';
import { getBondLevel, getBondProgress, getCycleInfo } from '../../utils/bondMath';
import {
  MOOD_PACK_OPTIONS,
  COLOR_FAMILY_OPTIONS,
  SYMBOL_OPTIONS,
  ENCOURAGEMENT_STYLE_OPTIONS,
} from '../../utils/constants';
import FieldLabel from './FieldLabel';

// ── Bond Progress Bar ────────────────────────────────────

function BondProgressBar() {
  const bondXP = useBondStore((s) => s.bondXP);
  const cycleStartDate = useBondStore((s) => s.cycleStartDate);
  const currentCycle = useBondStore((s) => s.currentCycle);

  const level = getBondLevel(bondXP);
  const progress = getBondProgress(bondXP);
  const cycle = getCycleInfo(cycleStartDate, currentCycle);

  return (
    <div className="rounded-[28px] border border-amber-300/15 bg-amber-400/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-['Press_Start_2P'] text-[0.5rem] uppercase tracking-[0.3em] text-amber-300">
            Bond Level
          </p>
          <p className="mt-1 text-lg font-semibold text-amber-50">
            Lv.{level.level} {level.label}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">
            Week {cycle.week} · {Math.round(cycle.multiplier * 100)}% XP
          </p>
          <p className="text-xs text-slate-500">
            {bondXP} XP{progress.nextThreshold ? ` / ${progress.nextThreshold}` : ' (Max)'}
          </p>
        </div>
      </div>
      <div className="h-2 rounded-full bg-black/30 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-300 transition-all duration-500"
          style={{ width: `${Math.round(progress.ratio * 100)}%` }}
        />
      </div>
      <p className="text-xs text-slate-500 leading-5">
        {level.description}. Share more about yourself to deepen the bond.
      </p>
    </div>
  );
}

// ── Disclosure-aware input helpers ───────────────────────

function useTasteField(domain, field, profileKey) {
  const preferences = useProfileStore((s) => s.preferences);
  const setPreferences = useProfileStore((s) => s.setPreferences);
  const recordDisclosure = useBondStore((s) => s.recordDisclosure);
  const hasDisclosed = useBondStore((s) => s.hasDisclosed(domain, field));

  const value = profileKey
    ? preferences[profileKey] ?? ''
    : preferences[field] ?? '';

  const commit = (newValue) => {
    setPreferences({ [profileKey || field]: newValue });
    // Award XP on first non-empty disclosure
    if (newValue && !hasDisclosed) {
      recordDisclosure(domain, field);
    }
  };

  return { value, commit, hasDisclosed };
}

// ── Text Input with blur-commit ──────────────────────────

function TasteTextInput({ domain, field, placeholder, profileKey }) {
  const { value, commit, hasDisclosed } = useTasteField(domain, field, profileKey);
  const [local, setLocal] = useState(value);

  const handleBlur = () => {
    if (local !== value) {
      commit(local);
    }
  };

  return (
    <div className="relative">
      <input
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/8 bg-black/25 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-slate-500 focus:border-emerald-300/35"
      />
      {hasDisclosed && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-amber-300/60">✓</span>
      )}
    </div>
  );
}

function TasteTextarea({ domain, field, placeholder, profileKey }) {
  const { value, commit, hasDisclosed } = useTasteField(domain, field, profileKey);
  const [local, setLocal] = useState(value);

  const handleBlur = () => {
    if (local !== value) {
      commit(local);
    }
  };

  return (
    <div className="relative">
      <textarea
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        rows={2}
        className="w-full resize-none rounded-2xl border border-white/8 bg-black/25 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-slate-500 focus:border-emerald-300/35"
      />
      {hasDisclosed && (
        <span className="absolute right-3 top-3 text-xs text-amber-300/60">✓</span>
      )}
    </div>
  );
}

// ── Radio Selector ───────────────────────────────────────

function TasteRadio({ domain, field, options, profileKey }) {
  const { value, commit } = useTasteField(domain, field, profileKey);

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => commit(opt.value)}
          className={`rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
            value === opt.value
              ? 'border-amber-300/40 bg-amber-400/10 text-amber-100'
              : 'border-white/8 text-slate-400 hover:border-white/16 hover:text-slate-200'
          }`}
        >
          {opt.emoji ? `${opt.emoji} ` : ''}{opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Symbol Multi-Select ──────────────────────────────────

function TasteSymbolSelect({ domain, field }) {
  const preferences = useProfileStore((s) => s.preferences);
  const setPreferences = useProfileStore((s) => s.setPreferences);
  const recordDisclosure = useBondStore((s) => s.recordDisclosure);
  const hasDisclosed = useBondStore((s) => s.hasDisclosed(domain, field));

  const selected = preferences.favoriteSymbols || [];

  const toggle = (symbol) => {
    const next = selected.includes(symbol)
      ? selected.filter((s) => s !== symbol)
      : [...selected, symbol];
    setPreferences({ favoriteSymbols: next });
    if (next.length > 0 && !hasDisclosed) {
      recordDisclosure(domain, field);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {SYMBOL_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => toggle(opt.value)}
          className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
            selected.includes(opt.value)
              ? 'border-amber-300/40 bg-amber-400/10 text-amber-100'
              : 'border-white/8 text-slate-400 hover:border-white/16'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Toggle ───────────────────────────────────────────────

function TasteToggle({ domain, field, label }) {
  const { value, commit } = useTasteField(domain, field);

  return (
    <button
      type="button"
      onClick={() => commit(!value)}
      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
        value
          ? 'border-amber-300/30 bg-amber-400/10 text-amber-100'
          : 'border-white/8 bg-black/25 text-slate-400 hover:border-white/16'
      }`}
    >
      <span className={`flex h-5 w-5 items-center justify-center rounded-md border text-xs ${
        value ? 'border-amber-300/50 bg-amber-400/20' : 'border-white/20'
      }`}>
        {value ? '✓' : ''}
      </span>
      {label}
    </button>
  );
}

// ── Domain Sections ──────────────────────────────────────

function IdentitySection() {
  const kingdomName = useProfileStore((s) => s.kingdomName);
  const companionName = useProfileStore((s) => s.companionName);
  const setKingdomName = useProfileStore((s) => s.setKingdomName);
  const setCompanionName = useProfileStore((s) => s.setCompanionName);
  const recordDisclosure = useBondStore((s) => s.recordDisclosure);

  const [localKingdom, setLocalKingdom] = useState(kingdomName);
  const [localCompanion, setLocalCompanion] = useState(companionName);

  return (
    <div className="space-y-3">
      <FieldLabel>Identity</FieldLabel>
      <input
        value={localKingdom}
        onChange={(e) => setLocalKingdom(e.target.value)}
        onBlur={() => {
          if (localKingdom !== kingdomName) {
            setKingdomName(localKingdom);
            recordDisclosure('identity', 'kingdomName');
          }
        }}
        placeholder="Kingdom name"
        className="w-full rounded-2xl border border-white/8 bg-black/25 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-slate-500 focus:border-emerald-300/35"
      />
      <input
        value={localCompanion}
        onChange={(e) => setLocalCompanion(e.target.value)}
        onBlur={() => {
          if (localCompanion !== companionName) {
            setCompanionName(localCompanion);
            recordDisclosure('identity', 'companionName');
          }
        }}
        placeholder="Companion name"
        className="w-full rounded-2xl border border-white/8 bg-black/25 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-slate-500 focus:border-emerald-300/35"
      />
    </div>
  );
}

function AestheticSection() {
  return (
    <div className="space-y-3">
      <FieldLabel>Aesthetic</FieldLabel>
      <div className="space-y-2">
        <p className="text-xs text-slate-500">Mood Pack</p>
        <TasteRadio domain="aesthetic" field="moodPack" options={MOOD_PACK_OPTIONS} />
      </div>
      <div className="space-y-2">
        <p className="text-xs text-slate-500">Color Family</p>
        <TasteRadio domain="aesthetic" field="favoriteColorFamily" options={COLOR_FAMILY_OPTIONS} />
      </div>
      <div className="space-y-2">
        <p className="text-xs text-slate-500">Favorite Symbols</p>
        <TasteSymbolSelect domain="aesthetic" field="favoriteSymbols" />
      </div>
      <TasteTextInput domain="aesthetic" field="favoriteAnimals" placeholder="Favorite animals or birds" />
    </div>
  );
}

function InspirationSection() {
  return (
    <div className="space-y-3">
      <FieldLabel>Inspiration</FieldLabel>
      <TasteTextInput domain="inspiration" field="favoriteArtist" placeholder="Favorite artist, thinker, or author" />
      <TasteTextInput domain="inspiration" field="quoteSources" placeholder="Preferred quote sources" />
      <div className="space-y-2">
        <p className="text-xs text-slate-500">Encouragement Style</p>
        <TasteRadio domain="inspiration" field="encouragementStyle" options={ENCOURAGEMENT_STYLE_OPTIONS} />
      </div>
      <TasteToggle domain="inspiration" field="faithMode" label="Faith mode (enables scripture/verse content)" />
    </div>
  );
}

function LifeContextSection() {
  return (
    <div className="space-y-3">
      <FieldLabel>Life Context</FieldLabel>
      <TasteTextarea domain="lifeContext" field="interests" placeholder="Interests and hobbies" />
      <TasteTextarea domain="lifeContext" field="motivation" placeholder="What motivates you when things are hard?" />
      <TasteTextarea domain="lifeContext" field="sideProjects" placeholder="Side projects or businesses" />
      <TasteTextarea domain="lifeContext" field="peopleWhoMatter" placeholder="People who matter (names for shoutouts)" />
    </div>
  );
}

// ── Main TastePanel ──────────────────────────────────────

export default function TastePanel() {
  return (
    <div className="space-y-6">
      <BondProgressBar />
      <IdentitySection />
      <AestheticSection />
      <InspirationSection />
      <LifeContextSection />
    </div>
  );
}
