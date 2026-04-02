import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { BILL_CATEGORY_MAP, BILL_CATEGORY_OPTIONS } from '../utils/constants';

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

function createBillId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `bill-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

export const selectTotalBills = (state) =>
  state.bills.reduce((total, bill) => total + (Number.isFinite(bill.amount) ? bill.amount : 0), 0);

export const selectSurplus = (state) => state.income - selectTotalBills(state);
export const selectMonthsCompleted = (state) => state.history.length;
export const selectActiveBills = (state) => state.bills.filter((bill) => !bill.isPaid);
export const selectLifetimeSaved = (state) =>
  state.history.reduce((total, month) => total + Math.max(month.surplus, 0), 0) +
  Math.max(selectSurplus(state), 0);

export const useFactStore = create(
  persist(
    (set, get) => ({
      income: 0,
      bills: [],
      paydayDate: 1,
      currentMonth: getCurrentMonthKey(),
      history: [],

      // Stubs for Epic 3
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
    }),
    {
      name: 'pk-facts',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
