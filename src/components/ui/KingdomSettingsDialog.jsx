import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useProfileStore } from '../../store/profileStore';
import BannerColorSelector from './BannerColorSelector';

export default function KingdomSettingsDialog({ open, onClose }) {
  const kingdomName = useProfileStore((state) => state.kingdomName);
  const bannerColor = useProfileStore((state) => state.bannerColor);
  const updateKingdomSettings = useProfileStore((state) => state.updateKingdomSettings);
  const reopenOnboarding = useProfileStore((state) => state.reopenOnboarding);

  const [draftName, setDraftName] = useState(kingdomName);
  const [draftColor, setDraftColor] = useState(bannerColor);

  useEffect(() => {
    if (!open) {
      return;
    }

    setDraftName(kingdomName);
    setDraftColor(bannerColor);
  }, [open, kingdomName, bannerColor]);

  if (!open) {
    return null;
  }

  const handleSave = () => {
    updateKingdomSettings({
      kingdomName: draftName,
      bannerColor: draftColor,
    });
    onClose();
  };

  const handleReplayOnboarding = () => {
    reopenOnboarding();
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/65 px-4 py-4 backdrop-blur-sm sm:items-center sm:py-6">
      <div className="my-auto w-full max-w-2xl rounded-[32px] border border-white/10 bg-slate-950/95 p-4 shadow-[0_30px_120px_rgba(0,0,0,0.45)] sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div>
            <p className="font-['Press_Start_2P'] text-[0.6rem] uppercase tracking-[0.28em] text-cyan-200">
              Kingdom Settings
            </p>
            <h2 className="mt-3 text-xl font-semibold text-stone-50 sm:text-2xl">Name your realm and banner.</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300 transition hover:bg-white/10 sm:w-auto"
          >
            Close
          </button>
        </div>

        <div className="mt-6 max-h-[calc(100vh-15rem)] space-y-5 overflow-y-auto pr-1">
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

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={handleReplayOnboarding}
            className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300 transition hover:bg-white/10 sm:w-auto"
          >
            Replay Onboarding
          </button>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300 transition hover:bg-white/10 sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="w-full rounded-2xl bg-amber-300 px-5 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-950 shadow-[0_18px_30px_rgba(245,158,11,0.2)] sm:w-auto"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
