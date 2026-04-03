import { useState } from 'react';
import {
  useFactStore,
  selectMonthsCompleted,
  selectSurplus,
  selectTotalBills,
} from '../../store/factStore';
import { useWorldStore } from '../../store/worldStore';
import { useProfileStore } from '../../store/profileStore';
import { useUiStore } from '../../store/uiStore';
import { soundManager } from '../../utils/soundManager';
import { formatCurrency } from '../../utils/formatters';
import { getHeroTierByKey, getIslandStageForMonths } from '../../utils/progression';
import KingdomSettingsDialog from './KingdomSettingsDialog';
import PanelTabs from './PanelTabs';
import BudgetPanel from './BudgetPanel';
import LifePanel from './LifePanel';
import WeeklyPanel from './WeeklyPanel';
import TastePanel from './TastePanel';

export default function KingdomPanel() {
  const totalBills = useFactStore(selectTotalBills);
  const surplus = useFactStore(selectSurplus);
  const monthsCompleted = useFactStore(selectMonthsCompleted);
  const bills = useFactStore((state) => state.bills);

  const armorTier = useWorldStore((state) => state.armorTier);
  const level = useWorldStore((state) => state.level);
  const battle = useWorldStore((state) => state.battle);
  const queuePayday = useWorldStore((state) => state.queuePayday);
  const kingdomName = useProfileStore((state) => state.kingdomName);
  const activePanel = useUiStore((state) => state.activePanel);

  const [showSettings, setShowSettings] = useState(false);

  const heroTier = getHeroTierByKey(armorTier);
  const islandStage = getIslandStageForMonths(monthsCompleted);
  const activeBills = bills.filter((bill) => !bill.isPaid);
  const isAnimating = battle.isAnimating;
  const canTriggerPayday = !isAnimating && (useFactStore.getState().income > 0 || activeBills.length > 0);

  const handleTriggerPayday = () => {
    if (!canTriggerPayday) {
      return;
    }

    const queued = queuePayday(
      activeBills.map((bill) => ({
        id: bill.id,
        name: bill.name,
        amount: bill.amount,
        category: bill.category,
      })),
    );

    if (queued) {
      void soundManager.playFromGesture('payday_start');
    }
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto overflow-x-hidden rounded-[28px] border border-emerald-500/20 bg-slate-950/85 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur sm:p-6">
      {/* Header */}
      <div className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <p className="font-['Press_Start_2P'] text-[0.6rem] uppercase tracking-[0.35em] text-emerald-300">
              Your Kingdom Treasury
            </p>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Payday Kingdom</p>
              <h1 className="mt-2 font-['Press_Start_2P'] text-xl leading-tight text-stone-50 sm:text-3xl">
                {kingdomName}
              </h1>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
              Income feeds the treasury, bills become monsters, and each payday advances {kingdomName} into
              a richer month.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:bg-white/10 sm:w-auto"
          >
            Settings
          </button>
        </div>

        {/* Tab Navigation */}
        <PanelTabs />
      </div>

      {/* Active Panel Content */}
      <div className="mt-5 flex-1">
        {activePanel === 'budget' && <BudgetPanel isAnimating={isAnimating} />}
        {activePanel === 'life' && <LifePanel />}
        {activePanel === 'weekly' && <WeeklyPanel />}
        {activePanel === 'taste' && <TastePanel />}
      </div>

      {/* Footer */}
      <div className="mt-auto space-y-4 pt-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-3xl border border-cyan-300/12 bg-cyan-400/6 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">Hero Rank</p>
            <p className="mt-2 text-lg font-semibold text-cyan-50">
              Lv.{level} {heroTier.label}
            </p>
          </div>
          <div className="rounded-3xl border border-emerald-300/12 bg-emerald-400/6 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-emerald-200/70">Island Stage</p>
            <p className="mt-2 text-lg font-semibold text-emerald-50">{islandStage.label}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-3xl border border-white/8 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Total Bills</p>
            <p className="mt-2 text-xl font-semibold text-stone-100">{formatCurrency(totalBills)}</p>
          </div>
          <div className="rounded-3xl border border-white/8 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Surplus</p>
            <p className={`mt-2 text-xl font-semibold ${surplus >= 0 ? 'text-emerald-100' : 'text-red-200'}`}>
              {formatCurrency(surplus)}
            </p>
          </div>
          <div className="rounded-3xl border border-white/8 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Months Survived</p>
            <p className="mt-2 text-xl font-semibold text-cyan-100">{monthsCompleted}</p>
          </div>
        </div>

        <button
          type="button"
          disabled={!canTriggerPayday}
          onClick={handleTriggerPayday}
          className="w-full rounded-3xl bg-amber-300 px-5 py-4 text-sm font-semibold uppercase tracking-[0.25em] text-slate-950 shadow-[0_18px_36px_rgba(245,158,11,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(245,158,11,0.35)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-amber-200/45 disabled:text-slate-700 disabled:shadow-none"
        >
          {isAnimating ? 'Battle In Progress' : 'Trigger Payday'}
          <span className="mt-1 block text-xs font-medium uppercase tracking-[0.22em] text-slate-700">
            {isAnimating
              ? battle.announcement || 'The hero is clearing the island.'
              : activeBills.length
                ? 'Spawn the hero and slay this month\u2019s monsters'
                : 'Advance the month and bank a peaceful payday'}
          </span>
        </button>

        <p className="text-xs leading-5 text-slate-500">
          Data stays in your browser for this MVP. Budget changes persist locally across refreshes.
        </p>
      </div>
      <KingdomSettingsDialog open={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
