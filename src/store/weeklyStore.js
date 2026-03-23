import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Weekly Store - Manages Arecibo Recap state
 * Persists to localStorage: current week intent, archive, share state
 */
export const useWeeklyStore = create(
  persist(
    (set, get) => ({
      // Current week's AreciboIntent
      currentWeekIntent: null,
      currentWeekNumber: null,
      currentWeekDate: null, // ISO string for week start date

      // Archive: array of past week intents
      archive: [], // Array of { weekNumber, intent, dateArchived }

      // Share/UI state
      shareOpen: false,
      selectedSectionIndex: null, // Which section is expanded (0-6)

      // Actions
      setCurrentWeekIntent(intent, weekNumber, weekDate) {
        set({
          currentWeekIntent: intent,
          currentWeekNumber: weekNumber,
          currentWeekDate: weekDate,
        });
      },

      archiveCurrentWeek() {
        const { currentWeekIntent, currentWeekNumber } = get();
        if (!currentWeekIntent || !currentWeekNumber) {
          return false;
        }

        set((state) => ({
          archive: [
            {
              weekNumber: currentWeekNumber,
              intent: currentWeekIntent,
              dateArchived: new Date().toISOString(),
            },
            ...state.archive,
          ].slice(0, 52), // Keep last 52 weeks
        }));

        return true;
      },

      getArchivedWeek(weekNumber) {
        const { archive } = get();
        return archive.find((w) => w.weekNumber === weekNumber);
      },

      clearArchive() {
        set({ archive: [] });
      },

      setShareOpen(open) {
        set({ shareOpen: Boolean(open) });
      },

      setSelectedSection(sectionIndex) {
        // Pass null to deselect
        set({ selectedSectionIndex: sectionIndex });
      },

      toggleSectionExpanded(sectionIndex) {
        const { selectedSectionIndex } = get();
        if (selectedSectionIndex === sectionIndex) {
          set({ selectedSectionIndex: null });
        } else {
          set({ selectedSectionIndex: sectionIndex });
        }
      },

      clearCurrentWeek() {
        set({
          currentWeekIntent: null,
          currentWeekNumber: null,
          currentWeekDate: null,
          selectedSectionIndex: null,
        });
      },
    }),
    {
      name: 'payday-kingdom-weekly',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentWeekIntent: state.currentWeekIntent,
        currentWeekNumber: state.currentWeekNumber,
        currentWeekDate: state.currentWeekDate,
        archive: state.archive,
      }),
    },
  ),
);
