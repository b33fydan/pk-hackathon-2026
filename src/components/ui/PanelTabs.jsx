import { useUiStore } from '../../store/uiStore';

const TABS = [
  { id: 'budget', label: 'Budget' },
  { id: 'life', label: 'Life' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'taste', label: 'Taste' },
];

export default function PanelTabs() {
  const activePanel = useUiStore((state) => state.activePanel);
  const setActivePanel = useUiStore((state) => state.setActivePanel);

  return (
    <div className="flex gap-2">
      {TABS.map((tab) => {
        const isActive = activePanel === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActivePanel(tab.id)}
            className={`rounded-2xl border px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] transition ${
              isActive
                ? 'border-emerald-300/40 bg-emerald-400/10 text-emerald-100'
                : 'border-white/8 text-slate-400 hover:border-white/16 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
