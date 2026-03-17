import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DEFAULT_HERO_POSITION } from '../utils/constants';
import { getHeroTierForLevel, getIslandStageForMonths, getLevelForXp } from '../utils/progression';

const CENTER_HERO_POSITION = DEFAULT_HERO_POSITION;

function createBattleState(runId = 0) {
  return {
    runId,
    status: 'idle',
    isAnimating: false,
    activeBillId: null,
    announcement: '',
    pendingBills: [],
    floatingRewards: [],
    previewXp: 0,
    pendingLevelUp: false,
    lastLevelUpLabel: '',
  };
}

export const useGameStore = create(
  persist(
    (set, get) => ({
      xp: 0,
      displayXp: 0,
      level: 1,
      totalBillsSlain: 0,
      heroVisible: false,
      heroPosition: CENTER_HERO_POSITION,
      armorTier: getHeroTierForLevel(1).key,
      islandStage: 0,
      battle: createBattleState(),

      syncIslandStage(monthsCompleted) {
        set({
          islandStage: getIslandStageForMonths(monthsCompleted).stage,
        });
      },

      queuePayday(pendingBills) {
        const state = get();

        if (state.battle.isAnimating) {
          return false;
        }

        set({
          heroVisible: true,
          heroPosition: { ...CENTER_HERO_POSITION, y: 4.8 },
          displayXp: state.xp,
          battle: {
            ...createBattleState(state.battle.runId + 1),
            status: 'queued',
            isAnimating: true,
            pendingBills,
            announcement: pendingBills.length ? 'The hero answers the payday call.' : 'A peaceful payday begins.',
            previewXp: state.xp,
          },
        });

        return true;
      },

      setBattleState(patch) {
        set((state) => ({
          battle: {
            ...state.battle,
            ...patch,
          },
        }));
      },

      setHeroVisible(heroVisible) {
        set({ heroVisible });
      },

      setHeroPosition(heroPosition) {
        set({ heroPosition });
      },

      setDisplayXp(displayXp) {
        set({ displayXp });
      },

      pushFloatingReward(reward) {
        set((state) => ({
          battle: {
            ...state.battle,
            floatingRewards: [...state.battle.floatingRewards, reward],
          },
        }));
      },

      dismissFloatingReward(id) {
        set((state) => ({
          battle: {
            ...state.battle,
            floatingRewards: state.battle.floatingRewards.filter((reward) => reward.id !== id),
          },
        }));
      },

      applyPaydayResults({ xpGained, billsSlain, monthsCompleted }) {
        const state = get();
        const nextXp = state.xp + xpGained;
        const nextLevel = getLevelForXp(nextXp);
        const nextTier = getHeroTierForLevel(nextLevel);
        const leveledUp = nextLevel > state.level;
        const islandStage = getIslandStageForMonths(monthsCompleted).stage;

        set({
          xp: nextXp,
          displayXp: nextXp,
          level: nextLevel,
          totalBillsSlain: state.totalBillsSlain + billsSlain,
          heroVisible: true,
          heroPosition: CENTER_HERO_POSITION,
          armorTier: nextTier.key,
          islandStage,
          battle: {
            ...state.battle,
            previewXp: nextXp,
            pendingLevelUp: leveledUp,
            lastLevelUpLabel: leveledUp ? nextTier.label : '',
          },
        });

        return {
          leveledUp,
          nextLevel,
          nextTier,
          islandStage,
        };
      },

      resetBattle() {
        set((state) => ({
          heroPosition: CENTER_HERO_POSITION,
          battle: createBattleState(state.battle.runId),
        }));
      },
    }),
    {
      name: 'payday-kingdom-game',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        xp: state.xp,
        displayXp: state.xp,
        level: state.level,
        totalBillsSlain: state.totalBillsSlain,
        heroVisible: state.heroVisible,
        heroPosition: CENTER_HERO_POSITION,
        armorTier: state.armorTier,
        islandStage: state.islandStage,
      }),
    },
  ),
);
