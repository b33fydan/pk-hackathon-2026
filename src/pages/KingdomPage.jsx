import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import OnboardingFlow from '../components/ui/OnboardingFlow';
import SceneViewport from '../components/scene/SceneViewport';
import KingdomPanel from '../components/ui/KingdomPanel';
import { useKingdomStore } from '../store/kingdomStore';
import { KINGDOM_LAYOUT } from '../utils/constants';

export default function KingdomPage() {
  const reopenOnboarding = useKingdomStore((state) => state.reopenOnboarding);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('onboarding') !== '1') {
      return;
    }

    reopenOnboarding();
    setSearchParams({}, { replace: true });
  }, [reopenOnboarding, searchParams, setSearchParams]);

  return (
    <main
      className="min-h-screen bg-transparent px-3 py-3 text-stone-50 sm:px-4 sm:py-4 md:px-6 md:py-6"
      style={{
        paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
        paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
      }}
    >
      <div
        className="kingdom-shell mx-auto flex min-h-[calc(100vh-1.5rem)] w-full flex-col gap-4"
        style={{
          '--kingdom-shell-max-width': KINGDOM_LAYOUT.shellMaxWidth,
          '--kingdom-shell-wide-max-width': KINGDOM_LAYOUT.shellWideMaxWidth,
          '--kingdom-panel-max-width': KINGDOM_LAYOUT.panelMaxWidth,
          '--kingdom-panel-basis': KINGDOM_LAYOUT.desktopPanelBasis,
          '--kingdom-panel-wide-basis': KINGDOM_LAYOUT.widePanelBasis,
        }}
      >
        <section className="kingdom-panel-column order-2 lg:order-1">
          <KingdomPanel />
        </section>
        <section className="kingdom-scene-column order-1 lg:order-2">
          <SceneViewport />
        </section>
      </div>
      <OnboardingFlow />
    </main>
  );
}
