import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { BILL_CATEGORY_MAP, BILL_CATEGORY_OPTIONS } from '../utils/constants';
import { getTodayDate } from '../utils/formatters';

function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getNextMonthKey(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  const next = new Date(year, month, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
}

function toAmount(value) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.round(parsed);
}

function getBillIcon(category) {
  return BILL_CATEGORY_MAP[category]?.icon ?? BILL_CATEGORY_OPTIONS[0].icon;
}

function getBillName(name, category) {
  const trimmed = name.trim();

  if (trimmed) {
    return trimmed;
  }

  return BILL_CATEGORY_MAP[category]?.label ?? 'Bill';
}

function createId(prefix) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

function createBillId() {
  return createId('bill');
}

export const selectTotalBills = (state) =>
  state.bills.reduce((total, bill) => total + (Number.isFinite(bill.amount) ? bill.amount : 0), 0);

export const selectSurplus = (state) => state.income - selectTotalBills(state);
export const selectMonthsCompleted = (state) => state.history.length;
export const selectActiveBills = (state) => state.bills.filter((bill) => !bill.isPaid);
export const selectLifetimeSaved = (state) =>
  state.history.reduce((total, month) => total + Math.max(month.surplus, 0), 0) +
  Math.max(selectSurplus(state), 0);

export const selectActiveHabitDefinitions = (state) =>
  state.habitDefinitions.filter((h) => !h.archived);

export const selectHabitsForDate = (state, date) => {
  const dateStr = date || getTodayDate();
  return state.habits.filter((h) => h.date === dateStr);
};

export function selectHabitStreak(state, habitKey) {
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const entry = state.habits.find((h) => h.habitKey === habitKey && h.date === dateStr && h.completed);
    if (entry) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

export const selectRecentMeetings = (state, days) => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (days || 7));
  const cutoffStr = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(cutoff.getDate()).padStart(2, '0')}`;
  return state.meetings.filter((m) => m.date >= cutoffStr).sort((a, b) => b.date.localeCompare(a.date));
};

export const selectRecentMilestones = (state, days) => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (days || 30));
  const cutoffStr = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(cutoff.getDate()).padStart(2, '0')}`;
  return state.milestones.filter((m) => m.date >= cutoffStr).sort((a, b) => b.date.localeCompare(a.date));
};

export const useFactStore = create(
  persist(
    (set, get) => ({
      income: 0,
      bills: [],
      paydayDate: 1,
      currentMonth: getCurrentMonthKey(),
      history: [],

      // Life Event data (Epic 3)
      habitDefinitions: [],
      habits: [],
      meetings: [],
      milestones: [],
      weeklyRecaps: [],

      setIncome(amount) {
        set({ income: toAmount(amount) });
      },

      addBill(bill) {
        const category = bill.category || BILL_CATEGORY_OPTIONS[0].value;
        const amount = toAmount(bill.amount);

        if (!amount) {
          return;
        }

        set((state) => ({
          bills: [
            ...state.bills,
            {
              id: createBillId(),
              name: getBillName(bill.name || '', category),
              amount,
              category,
              icon: getBillIcon(category),
              isPaid: false,
              dueDay: Math.min(28, Math.max(1, Number(bill.dueDay) || 1)),
            },
          ],
        }));
      },

      replaceBills(nextBills) {
        set({
          bills: nextBills
            .map((bill) => {
              const category = bill.category || BILL_CATEGORY_OPTIONS[0].value;
              const amount = toAmount(bill.amount);

              if (!amount) {
                return null;
              }

              return {
                id: createBillId(),
                name: getBillName(bill.name || '', category),
                amount,
                category,
                icon: getBillIcon(category),
                isPaid: false,
                dueDay: Math.min(28, Math.max(1, Number(bill.dueDay) || 1)),
              };
            })
            .filter(Boolean),
        });
      },

      removeBill(id) {
        set((state) => ({
          bills: state.bills.filter((bill) => bill.id !== id),
        }));
      },

      updateBill(id, updates) {
        set((state) => ({
          bills: state.bills.map((bill) => {
            if (bill.id !== id) {
              return bill;
            }

            const category = updates.category ?? bill.category;
            return {
              ...bill,
              ...updates,
              amount: updates.amount === undefined ? bill.amount : toAmount(updates.amount),
              category,
              icon: getBillIcon(category),
              dueDay:
                updates.dueDay === undefined
                  ? bill.dueDay
                  : Math.min(28, Math.max(1, Number(updates.dueDay) || 1)),
            };
          }),
        }));
      },

      markBillPaid(id) {
        set((state) => ({
          bills: state.bills.map((bill) => (bill.id === id ? { ...bill, isPaid: true } : bill)),
        }));
      },

      triggerPayday() {
        const state = get();
        const totalBills = selectTotalBills(state);
        const largestBillPaid = state.bills.reduce(
          (largest, bill) => Math.max(largest, Number.isFinite(bill.amount) ? bill.amount : 0),
          0,
        );

        if (!state.income && !totalBills) {
          return;
        }

        const historyEntry = {
          month: state.currentMonth,
          totalBills,
          totalPaid: totalBills,
          surplus: selectSurplus(state),
          largestBillPaid,
        };

        set({
          currentMonth: getNextMonthKey(state.currentMonth),
          history: [...state.history, historyEntry],
          bills: state.bills.map((bill) => ({ ...bill, isPaid: false })),
        });
      },

      resetMonth() {
        set((state) => ({
          bills: state.bills.map((bill) => ({ ...bill, isPaid: false })),
        }));
      },

      getSurplus() {
        return selectSurplus(get());
      },

      getMonthsCompleted() {
        return selectMonthsCompleted(get());
      },

      // ── Habit Definitions ──────────────────────────────

      addHabitDefinition({ label, emoji }) {
        const trimmed = (label || '').trim();
        if (!trimmed) return;

        set((state) => ({
          habitDefinitions: [
            ...state.habitDefinitions,
            {
              id: createId('habit'),
              key: trimmed.toLowerCase().replace(/\s+/g, '_'),
              label: trimmed,
              emoji: emoji || '⭐',
              createdAt: new Date().toISOString(),
              archived: false,
            },
          ],
        }));
      },

      archiveHabitDefinition(id) {
        set((state) => ({
          habitDefinitions: state.habitDefinitions.map((h) =>
            h.id === id ? { ...h, archived: true } : h,
          ),
        }));
      },

      // ── Habit Check-ins ────────────────────────────────

      toggleHabit(habitKey, date) {
        const dateStr = date || getTodayDate();
        set((state) => {
          const existing = state.habits.find(
            (h) => h.habitKey === habitKey && h.date === dateStr,
          );

          if (existing) {
            return {
              habits: state.habits.map((h) =>
                h.id === existing.id ? { ...h, completed: !h.completed } : h,
              ),
            };
          }

          return {
            habits: [
              ...state.habits,
              {
                id: createId('checkin'),
                habitKey,
                date: dateStr,
                completed: true,
              },
            ],
          };
        });
      },

      // ── Meetings ───────────────────────────────────────

      addMeeting({ label, intensity, date }) {
        const trimmed = (label || '').trim();
        if (!trimmed) return;

        set((state) => ({
          meetings: [
            ...state.meetings,
            {
              id: createId('meeting'),
              date: date || getTodayDate(),
              label: trimmed,
              intensity: intensity || 'normal',
            },
          ],
        }));
      },

      removeMeeting(id) {
        set((state) => ({
          meetings: state.meetings.filter((m) => m.id !== id),
        }));
      },

      // ── Milestones ─────────────────────────────────────

      addMilestone({ type, value, note, date }) {
        if (!value && value !== 0) return;

        set((state) => ({
          milestones: [
            ...state.milestones,
            {
              id: createId('milestone'),
              date: date || getTodayDate(),
              type: type || 'custom',
              value,
              note: (note || '').trim() || undefined,
            },
          ],
        }));
      },

      removeMilestone(id) {
        set((state) => ({
          milestones: state.milestones.filter((m) => m.id !== id),
        }));
      },

      // ── Weekly Recaps ──────────────────────────────────

      saveWeeklyRecap({ weekStart, weekEnd, wins, losses, notes }) {
        if (!weekStart) return;

        set((state) => {
          const existing = state.weeklyRecaps.findIndex(
            (r) => r.weekStart === weekStart,
          );
          const entry = {
            id: existing >= 0 ? state.weeklyRecaps[existing].id : createId('recap'),
            weekStart,
            weekEnd,
            wins: (wins || []).filter((w) => w.trim()),
            losses: (losses || []).filter((l) => l.trim()),
            notes: (notes || '').trim() || undefined,
          };

          if (existing >= 0) {
            const next = [...state.weeklyRecaps];
            next[existing] = entry;
            return { weeklyRecaps: next };
          }

          return { weeklyRecaps: [...state.weeklyRecaps, entry] };
        });
      },

      getWeeklyRecap(weekStart) {
        return get().weeklyRecaps.find((r) => r.weekStart === weekStart) || null;
      },
    }),
    {
      name: 'pk-facts',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
