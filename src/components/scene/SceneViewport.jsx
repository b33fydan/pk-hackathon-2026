import { useEffect, useState } from 'react';
import { useBudgetStore, selectLifetimeSaved, selectMonthsCompleted } from '../../store/budgetStore';
import { useAchievementStore } from '../../store/achievementStore';
import { useGameStore } from '../../store/gameStore';
import { useKingdomStore } from '../../store/kingdomStore';
import { useSceneStore } from '../../store/sceneStore';
import { useAudioStore } from '../../store/audioStore';
import { KINGDOM_BANNER_MAP } from '../../utils/constants';
import {
  ACHIEVEMENT_MAP,
  getUnlockedAchievementIds,
} from '../../utils/achievements';
import { soundManager } from '../../utils/soundManager';
import { formatCompactCurrency, formatCurrency } from '../../utils/formatters';
import { getHeroTierByKey, getIslandStageForMonths, getXpProgress } from '../../utils/progression';
import AchievementsDialog from '../ui/AchievementsDialog';
import IslandScene from './IslandScene';

export default function SceneViewport() {
  const income = useBudgetStore((state) => state.income);
  const bills = useBudgetStore((state) => state.bills);
  const history = useBudgetStore((state) => state.history);
  const monthsCompleted = useBudgetStore(selectMonthsCompleted);
  const lifetimeSaved = useBudgetStore(selectLifetimeSaved);

  const level = useGameStore((state) => state.level);
  const displayXp = useGameStore((state) => state.displayXp);
  const armorTier = useGameStore((state) => state.armorTier);
  const totalBillsSlain = useGameStore((state) => state.totalBillsSlain);
  const battle = useGameStore((state) => state.battle);
  const syncIslandStage = useGameStore((state) => state.syncIslandStage);
  const kingdomName = useKingdomStore((state) => state.kingdomName);
  const bannerColor = useKingdomStore((state) => state.bannerColor);
  const captureScene = useSceneStore((state) => state.captureScene);
  const muted = useAudioStore((state) => state.muted);
  const toggleMuted = useAudioStore((state) => state.toggleMuted);
  const unlockedAchievements = useAchievementStore((state) => state.unlocked);
  const achievementToasts = useAchievementStore((state) => state.toastQueue);
  const achievementDialogOpen = useAchievementStore((state) => state.dialogOpen);
  const unlockAchievement = useAchievementStore((state) => state.unlockAchievement);
  const setAchievementDialogOpen = useAchievementStore((state) => state.setDialogOpen);

  const [captureAsset, setCaptureAsset] = useState(null);
  const [captureMessage, setCaptureMessage] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [achievementShareId, setAchievementShareId] = useState('');

  const tier = getHeroTierByKey(armorTier);
  const stageMeta = getIslandStageForMonths(monthsCompleted);
  const xpProgress = getXpProgress(displayXp);
  const bannerOption = KINGDOM_BANNER_MAP[bannerColor] ?? KINGDOM_BANNER_MAP.gold;

  useEffect(() => {
    syncIslandStage(monthsCompleted);
  }, [monthsCompleted, syncIslandStage]);

  useEffect(() => {
    return () => {
      if (captureAsset?.objectUrl) {
        URL.revokeObjectURL(captureAsset.objectUrl);
      }
    };
  }, [captureAsset]);

  useEffect(() => {
    const idsToUnlock = getUnlockedAchievementIds({
      totalBillsSlain,
      islandStage: stageMeta.stage,
      lifetimeSaved,
      level,
      monthsCompleted,
      history,
    });

    idsToUnlock.forEach((id) => {
      unlockAchievement(id);
    });
  }, [history, level, lifetimeSaved, monthsCompleted, stageMeta.stage, totalBillsSlain, unlockAchievement]);

  const replaceCaptureAsset = (nextAsset) => {
    if (captureAsset?.objectUrl) {
      URL.revokeObjectURL(captureAsset.objectUrl);
    }

    setCaptureAsset(nextAsset);
  };

  const triggerAssetDownload = (asset, message) => {
    const link = document.createElement('a');
    link.href = asset.objectUrl;
    link.download = asset.filename;
    link.click();
    setCaptureMessage(message);
  };

  const shareOrDownloadAsset = async (asset, { title, text, fallbackMessage }) => {
    if (navigator.share) {
      try {
        const file = new File([asset.blob], asset.filename, { type: 'image/png' });

        if (!navigator.canShare || navigator.canShare({ files: [file] })) {
          await navigator.share({
            title,
            text,
            files: [file],
          });
          setCaptureMessage('Share sheet opened.');
          return;
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
      }
    }

    triggerAssetDownload(asset, fallbackMessage);
  };

  const handleCapture = async () => {
    if (!captureScene || battle.isAnimating || isCapturing) {
      return;
    }

    setIsCapturing(true);
    setCaptureMessage('');

    try {
      const result = await captureScene({
        title: kingdomName,
        subtitle: `${tier.label} · ${stageMeta.label} · ${formatCompactCurrency(lifetimeSaved)} saved`,
        accentColor: bannerOption.color,
        accentDarkColor: bannerOption.darkColor,
        filename: `${kingdomName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}.png`,
      });

      replaceCaptureAsset(result);
      setCaptureMessage('Kingdom captured.');
    } catch (error) {
      setCaptureMessage(error instanceof Error ? error.message : 'Capture failed.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleDownload = () => {
    if (!captureAsset) {
      return;
    }

    triggerAssetDownload(captureAsset, 'PNG downloaded.');
  };

  const handleCopy = async () => {
    if (!captureAsset || !navigator.clipboard || typeof window.ClipboardItem === 'undefined') {
      setCaptureMessage('Clipboard image copy is not supported here.');
      return;
    }

    try {
      await navigator.clipboard.write([
        new window.ClipboardItem({
          'image/png': captureAsset.blob,
        }),
      ]);
      setCaptureMessage('Copied image to clipboard.');
    } catch (error) {
      setCaptureMessage(error instanceof Error ? error.message : 'Clipboard copy failed.');
    }
  };

  const handleShare = async () => {
    if (!captureAsset) {
      return;
    }

    await shareOrDownloadAsset(captureAsset, {
      title: kingdomName,
      text: `${kingdomName} · ${tier.label} · ${stageMeta.label}`,
      fallbackMessage: 'PNG downloaded for sharing.',
    });
  };

  const handleAchievementShare = async (achievement) => {
    if (!captureScene || battle.isAnimating || isCapturing) {
      return;
    }

    setIsCapturing(true);
    setAchievementShareId(achievement.id);
    setCaptureMessage('');

    try {
      const result = await captureScene({
        title: achievement.label,
        subtitle: achievement.shareLine,
        accentColor: achievement.accentColor,
        accentDarkColor: achievement.accentDarkColor,
        filename: `${achievement.id}-${Date.now()}.png`,
      });

      replaceCaptureAsset(result);
      await shareOrDownloadAsset(result, {
        title: `${achievement.icon} ${achievement.label}`,
        text: `${achievement.label} unlocked in ${kingdomName}.`,
        fallbackMessage: 'Achievement card downloaded.',
      });
    } catch (error) {
      setCaptureMessage(error instanceof Error ? error.message : 'Share failed.');
    } finally {
      setAchievementShareId('');
      setIsCapturing(false);
    }
  };

  const handleToggleAudio = () => {
    const nextMuted = !muted;
    toggleMuted();

    if (!nextMuted) {
      void soundManager.playFromGesture('bill_add');
    }
  };

  return (
    <div className="relative h-[72vh] min-h-[520px] max-h-[760px] overflow-hidden rounded-[28px] border border-emerald-500/20 bg-[#112615] shadow-[0_30px_100px_rgba(0,0,0,0.35)] sm:h-[68vh] lg:h-full lg:min-h-[720px] lg:max-h-none">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 grid grid-cols-2 gap-2 p-3 sm:gap-3 sm:p-5 xl:grid-cols-3">
        <div className="min-w-0 rounded-2xl border border-white/10 bg-black/30 px-3 py-2.5 backdrop-blur-sm sm:px-4 sm:py-3">
          <p className="font-['Press_Start_2P'] text-[0.52rem] uppercase tracking-[0.25em] text-amber-200">
            Kingdom Banner
          </p>
          <p className="mt-2 truncate text-sm text-amber-50">{kingdomName}</p>
        </div>
        <div className="min-w-0 rounded-2xl border border-white/10 bg-black/30 px-3 py-2.5 backdrop-blur-sm sm:px-4 sm:py-3">
          <p className="font-['Press_Start_2P'] text-[0.52rem] uppercase tracking-[0.25em] text-emerald-200">
            Hero Status
          </p>
          <p className="mt-2 text-sm text-emerald-50">
            Lv.{level} {tier.label}
          </p>
          <div className="mt-3 w-full max-w-[180px] rounded-full bg-white/8 p-1">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-emerald-400 via-cyan-300 to-amber-300"
              style={{ width: `${Math.max(6, xpProgress.ratio * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs uppercase tracking-[0.24em] text-emerald-100/70">
            XP {formatCurrency(displayXp).replace('$', '')}
            {xpProgress.nextThreshold ? ` / ${formatCurrency(xpProgress.nextThreshold).replace('$', '')}` : ' / MAX'}
          </p>
        </div>
        <div className="col-span-2 min-w-0 rounded-2xl border border-white/10 bg-black/30 px-3 py-2.5 backdrop-blur-sm sm:px-4 sm:py-3 xl:col-span-1 xl:text-right">
          <p className="font-['Press_Start_2P'] text-[0.52rem] uppercase tracking-[0.25em] text-cyan-200">
            Kingdom
          </p>
          <p className="mt-2 text-sm text-cyan-50">
            {stageMeta.label} · Month {monthsCompleted + 1}
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.24em] text-cyan-100/70">
            {bills.length ? `${bills.length} threats active` : income ? 'Treasury stocked' : 'Waiting for bills'}
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.24em] text-cyan-100/70">
            Saved {formatCompactCurrency(lifetimeSaved)} · Slain {totalBillsSlain}
          </p>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center px-3 sm:bottom-5 sm:px-4 lg:inset-x-auto lg:right-5 lg:bottom-24 lg:px-0 lg:justify-end">
        <div className="pointer-events-auto w-full max-w-[22rem] rounded-[28px] border border-white/10 bg-black/35 px-3 py-3 shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:max-w-[28rem] sm:px-4 lg:w-[18rem] lg:max-w-[18rem]">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={!captureScene || battle.isAnimating || isCapturing}
              onClick={handleCapture}
              className="col-span-2 rounded-2xl bg-amber-300 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-950 transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-amber-200/45"
            >
              {isCapturing ? 'Capturing...' : 'Capture Kingdom'}
            </button>
            <button
              type="button"
              disabled={!captureAsset}
              onClick={handleDownload}
              className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Download
            </button>
            <button
              type="button"
              disabled={!captureAsset}
              onClick={handleCopy}
              className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Copy
            </button>
            <button
              type="button"
              disabled={!captureAsset}
              onClick={handleShare}
              className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Share
            </button>
            <button
              type="button"
              aria-label="Open achievements"
              onClick={() => setAchievementDialogOpen(true)}
              className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-white/10"
            >
              🏆
            </button>
            <button
              type="button"
              aria-pressed={!muted}
              onClick={handleToggleAudio}
              className={`rounded-2xl border px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] transition ${
                muted
                  ? 'border-red-300/20 bg-red-400/10 text-red-100 hover:bg-red-400/20'
                  : 'border-emerald-300/20 bg-emerald-400/12 text-emerald-50 hover:bg-emerald-400/18'
              }`}
            >
              {muted ? 'Sound Off' : 'Sound On'}
            </button>
          </div>
          {captureMessage && (
            <p className="mt-3 text-center text-xs uppercase tracking-[0.22em] text-white/70">{captureMessage}</p>
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 hidden items-end justify-between gap-3 p-4 sm:p-5 lg:flex">
        <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 backdrop-blur-sm">
          <p className="font-['Press_Start_2P'] text-[0.52rem] uppercase tracking-[0.25em] text-amber-200">
            Treasury
          </p>
          <p className="mt-2 text-sm text-amber-50">{income ? formatCurrency(income) : 'No income yet'}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-right backdrop-blur-sm">
          <p className="font-['Press_Start_2P'] text-[0.52rem] uppercase tracking-[0.25em] text-white/70">
            Realm Stats
          </p>
          <p className="mt-2 text-sm text-white/90">Bills Slain {totalBillsSlain}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.24em] text-white/60">
            Saved {formatCurrency(lifetimeSaved)}
          </p>
        </div>
      </div>

      {(battle.announcement || battle.floatingRewards.length > 0) && (
        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center px-6">
          {battle.announcement && (
            <div
              className={`scene-announcement rounded-full border px-5 py-3 text-center font-['Press_Start_2P'] text-[0.62rem] uppercase tracking-[0.28em] text-white sm:text-xs ${
                battle.pendingLevelUp ? 'border-amber-200/40 bg-amber-300/20' : 'border-white/18 bg-black/30'
              }`}
            >
              {battle.announcement}
            </div>
          )}
          <div className="mt-4 flex flex-col items-center gap-2">
            {battle.floatingRewards.map((reward, index) => (
              <div
                key={reward.id}
                className="reward-float rounded-full border border-emerald-200/25 bg-emerald-400/18 px-4 py-2 text-sm font-semibold text-emerald-50"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                {reward.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {achievementToasts.length > 0 && (
        <div className="pointer-events-none absolute inset-x-0 top-4 z-30 flex flex-col items-center gap-2 px-4 sm:top-20">
          {achievementToasts.slice(-3).map((achievementId) => {
            const achievement = ACHIEVEMENT_MAP[achievementId];

            if (!achievement) {
              return null;
            }

            return (
              <div
                key={achievementId}
                className="achievement-toast rounded-full border border-amber-200/35 bg-slate-950/88 px-5 py-3 text-center shadow-[0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur-sm"
              >
                <p className="font-['Press_Start_2P'] text-[0.52rem] uppercase tracking-[0.24em] text-amber-200">
                  Achievement Unlocked
                </p>
                <p className="mt-2 text-sm font-semibold text-stone-50">
                  {achievement.icon} {achievement.label}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <IslandScene />
      <AchievementsDialog
        open={achievementDialogOpen}
        onClose={() => setAchievementDialogOpen(false)}
        unlocked={unlockedAchievements}
        onShare={handleAchievementShare}
        shareInFlightId={achievementShareId}
        shareDisabled={!captureScene || battle.isAnimating || isCapturing}
      />
    </div>
  );
}
