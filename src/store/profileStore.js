import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { KINGDOM_BANNER_OPTIONS } from '../utils/constants';

const DEFAULT_KINGDOM_NAME = 'Fort Savings';
const DEFAULT_BANNER_COLOR = KINGDOM_BANNER_OPTIONS.find((o) => o.key === 'gold')?.key ?? 'gold';

export const useProfileStore = create(
  persist(
    (set) => ({
      // Identity
      kingdomName: DEFAULT_KINGDOM_NAME,
      companionName: 'Keeper',
      bannerColor: DEFAULT_BANNER_COLOR,
      hasCompletedOnboarding: false,

      // Financial basics
      income: 0,
      paydayDate: 1,

      // Taste Layer (Epic 5)
      preferences: {
        moodPack: 'cozy',
        activeSkin: 'adventurer',
        // Aesthetic
        favoriteColorFamily: null,
        favoriteSymbols: [],
        favoriteAnimals: '',
        // Inspiration
        favoriteArtist: '',
        quoteSources: '',
        faithMode: false,
        encouragementStyle: 'warm',
        // Life Context
        interests: '',
        motivation: '',
        celebrationStyle: 'warm',
        sideProjects: '',
        peopleWhoMatter: '',
      },

      // Location for weather (Epic 6)
      location: null,

      // Actions (same API names as old stores where possible)
      setKingdomName(kingdomName) {
        set({ kingdomName: kingdomName.trim() || DEFAULT_KINGDOM_NAME });
      },
      setBannerColor(bannerColor) {
        set({ bannerColor });
      },
      updateKingdomSettings({ kingdomName, bannerColor }) {
        set({
          kingdomName: kingdomName.trim() || DEFAULT_KINGDOM_NAME,
          bannerColor: bannerColor || DEFAULT_BANNER_COLOR,
        });
      },
      completeOnboarding() {
        set({ hasCompletedOnboarding: true });
      },
      reopenOnboarding() {
        set({ hasCompletedOnboarding: false });
      },
      setIncome(amount) {
        const parsed = Number(amount);
        set({ income: Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : 0 });
      },
      setPaydayDate(day) {
        set({ paydayDate: Math.min(28, Math.max(1, Number(day) || 1)) });
      },
      setLocation(location) {
        set({ location });
      },
      setCompanionName(companionName) {
        set({ companionName: (companionName || '').trim() || 'Keeper' });
      },
      setPreferences(patch) {
        set((state) => ({ preferences: { ...state.preferences, ...patch } }));
      },
    }),
    {
      name: 'pk-profile',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export { DEFAULT_BANNER_COLOR, DEFAULT_KINGDOM_NAME };
