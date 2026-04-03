import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  applyMultiplier,
  getBondLevel,
  shouldResetCycle,
  BOND_XP_AWARDS,
} from '../utils/bondMath';
import { TASTE_DOMAINS } from '../utils/constants';

const DOMAIN_KEYS = new Set(TASTE_DOMAINS.map((d) => d.key));

export const selectBondLevel = (state) => getBondLevel(state.bondXP);

export const useBondStore = create(
  persist(
    (set, get) => ({
      bondXP: 0,
      bondLevel: 1,
      cycleStartDate: null,
      currentCycle: 1,
      disclosureLog: {},
      unlockedDomains: [],

      /**
       * Award Bond XP with cycle multiplier applied.
       * Starts the cycle lazily on first award.
       */
      awardBondXP(rawAmount, source) {
        const state = get();

        // Auto-start cycle on first XP
        let { cycleStartDate, currentCycle } = state;
        if (!cycleStartDate) {
          cycleStartDate = new Date().toISOString();
        }

        // Auto-reset if cycle expired
        if (shouldResetCycle(cycleStartDate)) {
          cycleStartDate = new Date().toISOString();
          currentCycle = state.currentCycle + 1;
        }

        const adjusted = applyMultiplier(rawAmount, cycleStartDate);
        const nextXP = state.bondXP + adjusted;
        const nextLevel = getBondLevel(nextXP);

        set({
          bondXP: nextXP,
          bondLevel: nextLevel.level,
          cycleStartDate,
          currentCycle,
        });

        return adjusted;
      },

      /**
       * Record a taste disclosure. Awards one-time XP for the field
       * and domain unlock bonus if it's the first field in a new domain.
       */
      recordDisclosure(domainKey, fieldKey) {
        const state = get();
        const logKey = `${domainKey}.${fieldKey}`;

        // Already disclosed this field — no XP
        if (state.disclosureLog[logKey]) return 0;

        let totalXP = 0;

        // Domain unlock bonus (first field in this domain)
        const isNewDomain = !state.unlockedDomains.includes(domainKey) && DOMAIN_KEYS.has(domainKey);
        if (isNewDomain) {
          totalXP += BOND_XP_AWARDS.domain_unlock;
        }

        // Field-specific XP based on domain depth
        const fieldXP = getFieldXP(domainKey, fieldKey);
        totalXP += fieldXP;

        // Update disclosure log and domains
        set((prev) => ({
          disclosureLog: { ...prev.disclosureLog, [logKey]: true },
          unlockedDomains: isNewDomain
            ? [...prev.unlockedDomains, domainKey]
            : prev.unlockedDomains,
        }));

        // Award the XP through the main method (applies multiplier)
        if (totalXP > 0) {
          return get().awardBondXP(totalXP, logKey);
        }

        return 0;
      },

      /**
       * Check if a field has already been disclosed.
       */
      hasDisclosed(domainKey, fieldKey) {
        return Boolean(get().disclosureLog[`${domainKey}.${fieldKey}`]);
      },

      /**
       * Check and advance cycle if expired (call on app load).
       */
      checkAndAdvanceCycle() {
        const state = get();
        if (state.cycleStartDate && shouldResetCycle(state.cycleStartDate)) {
          set({
            cycleStartDate: new Date().toISOString(),
            currentCycle: state.currentCycle + 1,
          });
        }
      },
    }),
    {
      name: 'pk-bond',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

// ── Helpers ──────────────────────────────────────────────

function getFieldXP(domainKey, fieldKey) {
  // Deeper domains (inspiration, lifeContext) earn more XP per field
  if (domainKey === 'identity') return BOND_XP_AWARDS.add_bill;
  if (domainKey === 'aesthetic') return BOND_XP_AWARDS.share_interest;
  if (domainKey === 'inspiration') return BOND_XP_AWARDS.share_artist;
  if (domainKey === 'lifeContext') return BOND_XP_AWARDS.share_motivation;
  return BOND_XP_AWARDS.share_interest;
}
