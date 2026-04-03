import { useState } from 'react';
import {
  useFactStore,
  selectTotalBills,
  selectSurplus,
} from '../../store/factStore';
import { BILL_CATEGORY_MAP, BILL_CATEGORY_OPTIONS, DAY_COUNT_OPTIONS } from '../../utils/constants';
import { soundManager } from '../../utils/soundManager';
import { formatCurrency } from '../../utils/formatters';
import { useBondStore } from '../../store/bondStore';
import { BOND_XP_AWARDS } from '../../utils/bondMath';
import FieldLabel from './FieldLabel';

export default function BudgetPanel({ isAnimating }) {
  const income = useFactStore((state) => state.income);
  const bills = useFactStore((state) => state.bills);
  const currentMonth = useFactStore((state) => state.currentMonth);
  const setIncome = useFactStore((state) => state.setIncome);
  const addBill = useFactStore((state) => state.addBill);
  const removeBill = useFactStore((state) => state.removeBill);

  const [billName, setBillName] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billCategory, setBillCategory] = useState(BILL_CATEGORY_OPTIONS[0].value);
  const [dueDay, setDueDay] = useState('1');

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
    useBondStore.getState().awardBondXP(BOND_XP_AWARDS.add_bill, 'add_bill');

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

  return (
    <>
      <div className="space-y-5">
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
    </>
  );
}
