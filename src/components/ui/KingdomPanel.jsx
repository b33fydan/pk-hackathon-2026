import { useState } from 'react';
import {
  useBudgetStore,
  selectMonthsCompleted,
  selectSurplus,
  selectTotalBills,
} from '../../store/budgetStore';
import { useGameStore } from '../../store/gameStore';
import { useKingdomStore } from '../../store/kingdomStore';
import { BILL_CATEGORY_MAP, BILL_CATEGORY_OPTIONS, DAY_COUNT_OPTIONS } from '../../utils/constants';
import { soundManager } from '../../utils/soundManager';
import { formatCurrency } from '../../utils/formatters';
import { getHeroTierByKey, getIslandStageForMonths } from '../../utils/progression';
import KingdomSettingsDialog from './KingdomSettingsDialog';

function FieldLabel({ children }) {
  return (
    <label className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
      {children}
    </label>
  );
}

export default function KingdomPanel() {
  const income = useBudgetStore((state) => state.income);
  const bills = useBudgetStore((state) => state.bills);
  const currentMonth = useBudgetStore((state) => state.currentMonth);
  const totalBills = useBudgetStore(selectTotalBills);
  const surplus = useBudgetStore(selectSurplus);
  const monthsCompleted = useBudgetStore(selectMonthsCompleted);
  const setIncome = useBudgetStore((state) => state.setIncome);
  const addBill = useBudgetStore((state) => state.addBill);
  const removeBill = useBudgetStore((state) => state.removeBill);

  const armorTier = useGameStore((state) => state.armorTier);
  const level = useGameStore((state) => state.level);
  const battle = useGameStore((state) => state.battle);
  const queuePayday = useGameStore((state) => state.queuePayday);
  const kingdomName = useKingdomStore((state) => state.kingdomName);

  const [billName, setBillName] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billCategory, setBillCategory] = useState(BILL_CATEGORY_OPTIONS[0].value);
  const [dueDay, setDueDay] = useState('1');
  const [showSettings, setShowSettings] = useState(false);

  const heroTier = getHeroTierByKey(armorTier);
  const islandStage = getIslandStageForMonths(monthsCompleted);
  const activeBills = bills.filter((bill) => !bill.isPaid);
  const isAnimating = battle.isAnimating;
  const canTriggerPayday = !isAnimating && (income > 0 || activeBills.length > 0);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (isAnimating || Number(billAmount) <= 0) {
      return;
    }

    addBill({
      name: billName,
      amount: billAmount,
      category: billCategory,
      dueDay,
    });
    void soundManager.playFromGesture('bill_add');

    setBillName('');
    setBillAmount('');
    setDueDay('1');
  };

  const handleRemoveBill = (id) => {
    if (isAnimating) {
      return;
    }

    removeBill(id);
    void soundManager.playFromGesture('bill_remove');
  };

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

        <div className="grid gap-3 rounded-[28px] border border-white/8 bg-white/4 p-4">
          <div className="flex items-center justify-between gap-3">
            <FieldLabel>Monthly Income</FieldLabel>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">{currentMonth}</p>
          </div>
          <div className="rounded-2xl border border-emerald-300/10 bg-black/25 px-4 py-3">
            <div className="flex items-center gap-3 text-lg font-semibold text-emerald-50">
              <span className="text-emerald-300">$</span>
              <input
                type="number"
                min="0"
                step="50"
                value={income || ''}
                disabled={isAnimating}
                onChange={(event) => setIncome(event.target.value)}
                placeholder="4500"
                className="w-full bg-transparent text-2xl font-semibold outline-none placeholder:text-slate-600"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <FieldLabel>Bills (Monsters to Slay)</FieldLabel>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{bills.length} Active</p>
        </div>

        <div className="space-y-3">
          {bills.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-cyan-400/25 bg-cyan-400/5 px-4 py-5 text-sm leading-6 text-slate-300">
              Add your first recurring bill to spawn monsters onto the island.
            </div>
          ) : (
            bills.map((bill) => {
              const category = BILL_CATEGORY_MAP[bill.category] ?? BILL_CATEGORY_OPTIONS[0];

              return (
                <div
                  key={bill.id}
                  className="flex flex-col gap-4 rounded-3xl border border-white/8 bg-white/5 px-4 py-4 transition hover:border-white/14 hover:bg-white/8 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-2xl text-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
                      style={{ backgroundColor: `${category.color}30`, color: category.color }}
                    >
                      {category.emoji}
                    </div>
                    <div>
                      <p className="font-semibold text-stone-100">{bill.name}</p>
                      <p className="text-sm text-slate-400">
                        {category.label} · Due day {bill.dueDay}
                      </p>
                    </div>
                  </div>

                  <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
                    <div className="text-left sm:text-right">
                      <p className="font-semibold text-stone-100">{formatCurrency(bill.amount)}</p>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{bill.icon}</p>
                    </div>
                    <button
                      type="button"
                      disabled={isAnimating}
                      onClick={() => handleRemoveBill(bill.id)}
                      className="rounded-2xl border border-red-400/25 bg-red-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-[28px] border border-emerald-400/15 bg-emerald-400/5 p-4">
        <FieldLabel>Add Bill</FieldLabel>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={billName}
            disabled={isAnimating}
            onChange={(event) => setBillName(event.target.value)}
            placeholder="Rent"
            className="rounded-2xl border border-white/8 bg-black/25 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-slate-500 focus:border-emerald-300/35"
          />
          <input
            type="number"
            min="1"
            step="1"
            value={billAmount}
            disabled={isAnimating}
            onChange={(event) => setBillAmount(event.target.value)}
            placeholder="1200"
            className="rounded-2xl border border-white/8 bg-black/25 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-slate-500 focus:border-emerald-300/35"
          />
          <select
            value={billCategory}
            disabled={isAnimating}
            onChange={(event) => setBillCategory(event.target.value)}
            className="rounded-2xl border border-white/8 bg-black/25 px-4 py-3 text-sm text-stone-100 outline-none focus:border-emerald-300/35"
          >
            {BILL_CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={dueDay}
            disabled={isAnimating}
            onChange={(event) => setDueDay(event.target.value)}
            className="rounded-2xl border border-white/8 bg-black/25 px-4 py-3 text-sm text-stone-100 outline-none focus:border-emerald-300/35"
          >
            {DAY_COUNT_OPTIONS.map((day) => (
              <option key={day} value={day}>
                Due day {day}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={isAnimating}
          className="w-full rounded-2xl border border-emerald-300/25 bg-emerald-400/15 px-4 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-emerald-100 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Add Bill
        </button>
      </form>

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
                ? 'Spawn the hero and slay this month’s monsters'
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
