/**
 * BattleOverlay — JRPG pixel-art battle UI that layers over the 3D scene.
 *
 * Reads battle.status from worldStore and renders phase-appropriate visuals:
 * - spawning: dramatic hero entrance text
 * - fighting: monster name + kanji slash overlay
 * - victory: "PAYDAY COMPLETE" with bill count
 * - levelup: tier upgrade announcement with kanji
 *
 * All text uses Press_Start_2P for the pixel aesthetic.
 * Kanji characters flash on screen during kills (Chrono Trigger style).
 */

import { useEffect, useState } from 'react';
import { useWorldStore } from '../../store/worldStore';
import { BILL_CATEGORY_MAP } from '../../utils/constants';

// ── Kanji Library ────────────────────────────────────────

const KANJI = {
  slash: '斬',     // cut / slash
  destroy: '破',   // destroy / break
  victory: '勝',   // victory / win
  ascend: '昇',    // ascend / level up
  flame: '炎',     // flame
  thunder: '雷',   // thunder
  purge: '滅',     // annihilate
};

const KILL_KANJI = [KANJI.slash, KANJI.destroy, KANJI.flame, KANJI.thunder, KANJI.purge];

function getKanjiForBill(bill, index) {
  return KILL_KANJI[index % KILL_KANJI.length];
}

// ── Kanji Flash ──────────────────────────────────────────

function KanjiFlash({ char, color = '#ef4444' }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <span
        className="animate-kanji-flash select-none font-['Press_Start_2P'] text-[8rem] sm:text-[12rem] opacity-0"
        style={{
          color,
          textShadow: `0 0 40px ${color}, 0 0 80px ${color}40, 0 4px 0 #000`,
          WebkitTextStroke: '2px #00000060',
        }}
      >
        {char}
      </span>
    </div>
  );
}

// ── Phase: Spawning ──────────────────────────────────────

function SpawnPhase({ announcement }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-end pb-24">
      <div className="animate-battle-slide-up space-y-2 text-center">
        <p
          className="font-['Press_Start_2P'] text-2xl text-amber-300 sm:text-3xl"
          style={{ textShadow: '0 2px 0 #000, 0 0 20px rgba(251,191,36,0.4)' }}
        >
          BATTLE START
        </p>
        <p className="font-['Press_Start_2P'] text-[0.5rem] uppercase tracking-[0.3em] text-slate-300">
          {announcement}
        </p>
      </div>
    </div>
  );
}

// ── Phase: Fighting ──────────────────────────────────────

function FightPhase({ bill, billIndex }) {
  const [showKanji, setShowKanji] = useState(false);
  const category = BILL_CATEGORY_MAP[bill?.category] ?? { emoji: '📋', label: 'Bill', color: '#6b7280' };

  useEffect(() => {
    setShowKanji(true);
    const timer = setTimeout(() => setShowKanji(false), 600);
    return () => clearTimeout(timer);
  }, [bill?.id]);

  if (!bill) return null;

  return (
    <>
      {showKanji && <KanjiFlash char={getKanjiForBill(bill, billIndex)} />}

      {/* Monster info bar at top */}
      <div className="pointer-events-none absolute left-0 right-0 top-6 flex justify-center px-4">
        <div className="animate-battle-slide-down rounded-2xl border-2 border-red-500/40 bg-slate-950/80 px-6 py-3 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="text-xl">{category.emoji}</span>
            <div>
              <p
                className="font-['Press_Start_2P'] text-xs text-red-200"
                style={{ textShadow: '0 1px 0 #000' }}
              >
                {bill.name}
              </p>
              <p className="font-['Press_Start_2P'] text-[0.45rem] text-slate-400">
                ${bill.amount} · {category.label}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action text at bottom */}
      <div className="pointer-events-none absolute bottom-8 left-0 right-0 flex justify-center">
        <p
          className="animate-battle-pulse font-['Press_Start_2P'] text-xs uppercase tracking-[0.3em] text-amber-300"
          style={{ textShadow: '0 1px 0 #000, 0 0 12px rgba(251,191,36,0.3)' }}
        >
          ⚔ Smash Bills ⚔
        </p>
      </div>
    </>
  );
}

// ── Phase: Victory ───────────────────────────────────────

function VictoryPhase({ billsSlain, announcement }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
      <KanjiFlash char={KANJI.victory} color="#fbbf24" />
      <div className="animate-battle-slide-up z-10 space-y-3 text-center">
        <p
          className="font-['Press_Start_2P'] text-2xl text-amber-300 sm:text-4xl"
          style={{ textShadow: '0 3px 0 #000, 0 0 30px rgba(251,191,36,0.5)' }}
        >
          {announcement || 'PAYDAY COMPLETE'}
        </p>
        {billsSlain > 0 && (
          <p className="font-['Press_Start_2P'] text-[0.55rem] text-emerald-300">
            {billsSlain} monster{billsSlain > 1 ? 's' : ''} slain
          </p>
        )}
      </div>
    </div>
  );
}

// ── Phase: Level Up ──────────────────────────────────────

function LevelUpPhase({ tierLabel }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
      <KanjiFlash char={KANJI.ascend} color="#7dd3fc" />
      <div className="animate-battle-slide-up z-10 space-y-3 text-center">
        <p
          className="font-['Press_Start_2P'] text-lg text-cyan-300 sm:text-2xl"
          style={{ textShadow: '0 2px 0 #000, 0 0 20px rgba(125,211,252,0.5)' }}
        >
          LEVEL UP
        </p>
        <p
          className="font-['Press_Start_2P'] text-2xl text-amber-300 sm:text-3xl"
          style={{ textShadow: '0 3px 0 #000, 0 0 30px rgba(251,191,36,0.4)' }}
        >
          {tierLabel}
        </p>
      </div>
    </div>
  );
}

// ── Battle Frame (pixel border) ──────────────────────────

function BattleFrame() {
  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Top border strip */}
      <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
      {/* Bottom border strip */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
      {/* Corner accents */}
      <div className="absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-red-500/40" />
      <div className="absolute right-2 top-2 h-4 w-4 border-r-2 border-t-2 border-red-500/40" />
      <div className="absolute bottom-2 left-2 h-4 w-4 border-b-2 border-l-2 border-amber-400/40" />
      <div className="absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-amber-400/40" />
    </div>
  );
}

// ── Main Overlay ─────────────────────────────────────────

export default function BattleOverlay() {
  const battle = useWorldStore((state) => state.battle);
  const [billIndex, setBillIndex] = useState(0);

  // Track which bill we're on for kanji cycling
  useEffect(() => {
    if (battle.activeBillId) {
      setBillIndex((prev) => prev + 1);
    }
  }, [battle.activeBillId]);

  // Reset index when battle ends
  useEffect(() => {
    if (!battle.isAnimating) {
      setBillIndex(0);
    }
  }, [battle.isAnimating]);

  if (!battle.isAnimating) return null;

  const activeBill = battle.activeBillId
    ? battle.pendingBills.find((b) => b.id === battle.activeBillId)
    : null;

  return (
    <div className="absolute inset-0 z-30 overflow-hidden">
      {/* Vignette overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.5)_100%)]" />

      {/* Pixel border frame */}
      <BattleFrame />

      {/* Phase-specific content */}
      {battle.status === 'spawning' && (
        <SpawnPhase announcement={battle.announcement} />
      )}

      {battle.status === 'fighting' && (
        <FightPhase bill={activeBill} billIndex={billIndex} />
      )}

      {battle.status === 'victory' && (
        <VictoryPhase
          billsSlain={battle.pendingBills.length}
          announcement={battle.announcement}
        />
      )}

      {(battle.status === 'levelup' || battle.pendingLevelUp) && battle.lastLevelUpLabel && (
        <LevelUpPhase tierLabel={battle.lastLevelUpLabel} />
      )}
    </div>
  );
}
