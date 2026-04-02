import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const useUiStore = create(
  persist(
    (set) => ({
      muted: false,
      captureScene: null,
      activePanel: 'budget',
      modalOpen: null,

      toggleMuted() {
        set((state) => ({ muted: !state.muted }));
      },
      setMuted(muted) {
        set({ muted: Boolean(muted) });
      },
      setCaptureScene(captureScene) {
        set({ captureScene });
      },
      setActivePanel(activePanel) {
        set({ activePanel });
      },
      setModalOpen(modalOpen) {
        set({ modalOpen });
      },
    }),
    {
      name: 'pk-ui',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        muted: state.muted,
      }),
    },
  ),
);
