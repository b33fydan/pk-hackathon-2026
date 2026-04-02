import { useEffect, useMemo, useState } from 'react';
import { useFactStore } from '../../store/factStore';
import { useProfileStore } from '../../store/profileStore';
import { BILL_CATEGORY_OPTIONS, DAY_COUNT_OPTIONS } from '../../utils/constants';
import BannerColorSelector from './BannerColorSelector';

function makeDraftBill() {
  return {
    id: `draft-${Date.now()}-${Math.round(Math.random() * 100000)}`,
    name: '',
    amount: '',
    category: BILL_CATEGORY_OPTIONS[0].value,
    dueDay: '1',
  };
}

export default function OnboardingFlow() {
  const kingdomName = useProfileStore((state) => state.kingdomName);
  const bannerColor = useProfileStore((state) => state.bannerColor);
  const hasCompletedOnboarding = useProfileStore((state) => state.hasCompletedOnboarding);
  const updateKingdomSettings = useProfileStore((state) => state.updateKingdomSettings);
  const completeOnboarding = useProfileStore((state) => state.completeOnboarding);

  const income = useFactStore((state) => state.income);
  const bills = useFactStore((state) => state.bills);
  const setIncome = useFactStore((state) => state.setIncome);
  const replaceBills = useFactStore((state) => state.replaceBills);

  const [step, setStep] = useState(0);
  const [draftName, setDraftName] = useState(kingdomName);
  const [draftColor, setDraftColor] = useState(bannerColor);
  const [draftIncome, setDraftIncome] = useState(income ? String(income) : '');
  const [draftBills, setDraftBills] = useState(
    bills.length
      ? bills.map((bill) => ({
          id: bill.id,
          name: bill.name,
          amount: String(bill.amount),
          category: bill.category,
          dueDay: String(bill.dueDay),
        }))
      : [makeDraftBill()],
  );

  const validBills = useMemo(
    () =>
      draftBills.filter((bill) => bill.name.trim() && Number(bill.amount) > 0).map((bill) => ({
        name: bill.name,
        amount: bill.amount,
        category: bill.category,
        dueDay: bill.dueDay,
      })),
    [draftBills],
  );

  useEffect(() => {
    if (hasCompletedOnboarding) {
      return;
    }

    // Reset only when onboarding opens; store writes during setup should not rewind the flow.
    setStep(0);
    setDraftName(kingdomName);
    setDraftColor(bannerColor);
    setDraftIncome(income ? String(income) : '');
    setDraftBills(
      bills.length
        ? bills.map((bill) => ({
            id: bill.id,
            name: bill.name,
            amount: String(bill.amount),
            category: bill.category,
            dueDay: String(bill.dueDay),
          }))
        : [makeDraftBill()],
    );
  }, [hasCompletedOnboarding]);

  if (hasCompletedOnboarding) {
    return null;
  }

  const continueFromIntro = () => setStep(1);
  const continueFromIdentity = () => {
    if (!draftName.trim()) {
      return;
    }
    setStep(2);
  };
  const continueFromIncome = () => {
    if (Number(draftIncome) <= 0) {
      return;
    }
    setStep(3);
  };

  const applySetup = () => {
    if (!draftName.trim() || Number(draftIncome) <= 0 || validBills.length === 0) {
      return;
    }

    setStep(4);
    updateKingdomSettings({
      kingdomName: draftName,
      bannerColor: draftColor,
    });
    setIncome(draftIncome);
    replaceBills(validBills);
  };

  const finishReveal = () => {
    completeOnboarding();
  };

  const skipOnboarding = () => {
    completeOnboarding();
  };

  const updateDraftBill = (id, updates) => {
    setDraftBills((current) =>
      current.map((bill) => (bill.id === id ? { ...bill, ...updates } : bill)),
    );
  };

  const removeDraftBill = (id) => {
    setDraftBills((current) => (current.length === 1 ? current : current.filter((bill) => bill.id !== id)));
  };

  const addDraftBill = () => {
    setDraftBills((current) => [...current, makeDraftBill()]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.15),transparent_38%),rgba(2,6,23,0.92)] px-3 py-4 backdrop-blur-md sm:items-center sm:px-4 sm:py-6">
      <div className="my-auto w-full max-w-3xl rounded-[36px] border border-white/10 bg-slate-950/95 p-5 shadow-[0_30px_120px_rgba(0,0,0,0.5)] sm:p-6 md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-['Press_Start_2P'] text-[0.58rem] uppercase tracking-[0.28em] text-emerald-300">
              Begin Your Journey
            </p>
            <p className="mt-3 text-sm uppercase tracking-[0.24em] text-slate-500">
              Step {step + 1} of 5
            </p>
          </div>
          <button
            type="button"
            onClick={skipOnboarding}
            className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300 transition hover:bg-white/10 sm:w-auto"
          >
            Skip
          </button>
        </div>

        {step === 0 && (
          <div className="mt-8 text-center">
            <h2 className="font-['Press_Start_2P'] text-2xl leading-[1.6] text-stone-50 md:text-3xl">
              Welcome, brave soul.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-300">
              In Payday Kingdom, your financial discipline builds a thriving voxel world. Bills become
              monsters. Paydays summon heroes. Your consistency grows the island.
            </p>
            <button
              type="button"
              onClick={continueFromIntro}
              className="mt-10 rounded-2xl bg-amber-300 px-6 py-4 text-sm font-semibold uppercase tracking-[0.22em] text-slate-950"
            >
              Begin Your Journey
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="mt-8">
            <h2 className="font-['Press_Start_2P'] text-xl leading-[1.6] text-stone-50 md:text-2xl">
              Name Your Kingdom
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-300">
              Give the realm an identity and choose the banner color that will fly above the island.
            </p>

            <div className="mt-8 space-y-6">
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Kingdom Name
                </label>
                <input
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  placeholder="Fort Savings"
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-base text-stone-100 outline-none placeholder:text-slate-600 focus:border-cyan-300/35"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Banner Color
                </label>
                <div className="mt-3">
                  <BannerColorSelector value={draftColor} onChange={setDraftColor} />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="button"
                disabled={!draftName.trim()}
                onClick={continueFromIdentity}
                className="rounded-2xl bg-amber-300 px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-slate-950 disabled:cursor-not-allowed disabled:bg-amber-200/40"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-8">
            <h2 className="font-['Press_Start_2P'] text-xl leading-[1.6] text-stone-50 md:text-2xl">
              How much treasure arrives each month?
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-300">
              Enter the monthly income that keeps your kingdom running.
            </p>

            <div className="mt-8 rounded-[28px] border border-white/8 bg-white/4 p-5">
              <label className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Monthly Income
              </label>
              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-300/10 bg-black/25 px-4 py-4">
                <span className="text-emerald-300">$</span>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={draftIncome}
                  onChange={(event) => setDraftIncome(event.target.value)}
                  placeholder="4500"
                  className="w-full bg-transparent text-2xl font-semibold text-stone-100 outline-none placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="button"
                disabled={Number(draftIncome) <= 0}
                onClick={continueFromIncome}
                className="rounded-2xl bg-amber-300 px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-slate-950 disabled:cursor-not-allowed disabled:bg-amber-200/40"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mt-8">
            <h2 className="font-['Press_Start_2P'] text-xl leading-[1.6] text-stone-50 md:text-2xl">
              What monsters threaten your realm?
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-300">
              Add at least one recurring bill. These become the monsters your hero battles every payday.
            </p>

            <div className="mt-6 space-y-4">
              {draftBills.map((bill, index) => (
                <div key={bill.id} className="rounded-[28px] border border-white/8 bg-white/4 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Bill {index + 1}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeDraftBill(bill.id)}
                      className="rounded-2xl border border-red-400/25 bg-red-500/10 px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-red-200"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <input
                      value={bill.name}
                      onChange={(event) => updateDraftBill(bill.id, { name: event.target.value })}
                      placeholder="Rent"
                      className="rounded-2xl border border-white/8 bg-black/25 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-slate-500 focus:border-emerald-300/35"
                    />
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={bill.amount}
                      onChange={(event) => updateDraftBill(bill.id, { amount: event.target.value })}
                      placeholder="1200"
                      className="rounded-2xl border border-white/8 bg-black/25 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-slate-500 focus:border-emerald-300/35"
                    />
                    <select
                      value={bill.category}
                      onChange={(event) => updateDraftBill(bill.id, { category: event.target.value })}
                      className="rounded-2xl border border-white/8 bg-black/25 px-4 py-3 text-sm text-stone-100 outline-none focus:border-emerald-300/35"
                    >
                      {BILL_CATEGORY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={bill.dueDay}
                      onChange={(event) => updateDraftBill(bill.id, { dueDay: event.target.value })}
                      className="rounded-2xl border border-white/8 bg-black/25 px-4 py-3 text-sm text-stone-100 outline-none focus:border-emerald-300/35"
                    >
                      {DAY_COUNT_OPTIONS.map((day) => (
                        <option key={day} value={day}>
                          Due day {day}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={addDraftBill}
                className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300"
              >
                Add Another Monster
              </button>
              <button
                type="button"
                disabled={validBills.length === 0}
                onClick={applySetup}
                className="rounded-2xl bg-amber-300 px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-slate-950 disabled:cursor-not-allowed disabled:bg-amber-200/40"
              >
                Forge My Kingdom
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="mt-8 text-center">
            <h2 className="font-['Press_Start_2P'] text-2xl leading-[1.7] text-stone-50 md:text-3xl">
              Your Kingdom Awaits.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-300">
              {draftName} is ready. The treasury is stocked, the monsters are on the island, and your hero
              is waiting for payday.
            </p>
            <div className="mt-10 grid gap-3 rounded-[28px] border border-white/8 bg-white/4 p-5 text-left sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Kingdom</p>
                <p className="mt-2 text-lg font-semibold text-stone-100">{draftName}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Income</p>
                <p className="mt-2 text-lg font-semibold text-stone-100">${Number(draftIncome).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Monsters</p>
                <p className="mt-2 text-lg font-semibold text-stone-100">{validBills.length}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={finishReveal}
              className="mt-10 rounded-2xl bg-amber-300 px-6 py-4 text-sm font-semibold uppercase tracking-[0.22em] text-slate-950"
            >
              Ready for Payday
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
