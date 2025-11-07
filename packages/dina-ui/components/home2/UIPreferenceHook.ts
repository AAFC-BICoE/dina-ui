/*
 * Load (or create) the user's preference once, initialize parent sections
 * in a single save, and expose per-section savers.
 *
 * Design behavior:
 *  - On first visit (or if a section has no data), write defaults once so next loads are server-backed.
 *  - Expose a "saveFromCards(next)" callback for drag/drop which persists *only* the card IDs.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAccount, useApiClient, SaveArgs } from "common-ui";
import type { NavigationCard } from "../../types/common";
import type { UserPreference } from "packages/dina-ui/types/user-api";
import { FilterParam } from "kitsu";


/* Utility: given defaults and a persisted list of ids, return the cards in that exact order.
 *  - Unknown IDs are ignored (e.g., if defaults changed).
 */
function orderByIds<T extends { id: string }>(defaults: T[], ids: string[]): T[] {
  const byId = new Map(defaults.map((c) => [c.id, c]));
  return ids.map((id) => byId.get(id)).filter(Boolean) as T[];
}

// uiPreference type helper for casts.
type UiPref = UserPreference["uiPreference"] extends object
  ? UserPreference["uiPreference"]
  : Record<string, any>;

export type SectionsDefaults = Record<string, NavigationCard[]>;

export interface UIPreferenceAPI {
  // Ordered cards for a section.
  getCards: (sectionKey: string) => NavigationCard[];
  
  /*
   * Persist a section's order (called by your grid on drop).
   * Accepts full cards but only persists IDs.
   */
  saveCards: (sectionKey: string, nextCards: NavigationCard[]) => Promise<void>;
  getSectionOrder: (defaultOrder: string[]) => string[];
  saveSectionOrder: (nextOrder: string[]) => Promise<void>;
  loading: boolean;
  error: unknown;
  prefId?: string | null;
}

export function UIPreferenceHook(sections: SectionsDefaults): UIPreferenceAPI {
  const { subject } = useAccount();
  const { apiClient, save } = useApiClient();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  // Single in-memory preference record for this user
  const [userPref, setUserPref] = useState<UserPreference | undefined>(undefined);

  // Local copy of ids per section for immediate updates
  const [idsBySection, setIdsBySection] = useState<Record<string, string[]>>({});

  
  // Keep section order in state
  const [sectionOrder, setSectionOrder] = useState<string[] | undefined>(undefined);

  // Keep the latest sections defaults in a ref for stable access in callbacks
  const sectionsRef = useRef<SectionsDefaults>(sections);

  useEffect(() => {
    sectionsRef.current = sections;
  }, [sections]);

  useEffect(() => {
    let cancelled = false;

    async function loadAndInit() {
      if (!subject) return;
      setLoading(true);

      try {
        // 1) Load the preference (if any)
        const resp = await apiClient.get<UserPreference[]>("user-api/user-preference", {
          filter: { userId: subject as FilterParam }
        });
        if (cancelled) return;

        const pref = resp?.data?.[0];

        // Extract current uiPreference.homeLayout (may be undefined)
        const currentUiPref = (pref?.uiPreference ?? {}) as any;
        const currenthomeLayout = (currentUiPref.homeLayout ?? {}) as Record<string, string[]>;

        // Read saved section order (may be undefined)
        const savedSectionOrder: unknown = currentUiPref.homeSectionOrder;

        // 2) Build a merged homeLayout object with defaults for any *missing* sections:
        const nextHomeLayout: Record<string, string[]> = { ...currenthomeLayout };
        let needsInitSave = false;

        for (const [sectionKey, defaults] of Object.entries(sectionsRef.current)) {
          const savedIds = currenthomeLayout[sectionKey];

            if (Array.isArray(savedIds)) {
              // Respect user's saved order (including empty [])
              const allowed = new Set(defaults.map((c) => c.id));
              nextHomeLayout[sectionKey] = savedIds.filter((id) => allowed.has(id));
              // Keep [] if that's what the user saved.
            } else if (savedIds == null) {
              // Truly missing → seed with defaults once:
              nextHomeLayout[sectionKey] = defaults.map((c) => c.id);
              needsInitSave = true;
            } else {
              // Unexpected type → fall back to defaults and save:
              nextHomeLayout[sectionKey] = defaults.map((c) => c.id);
              needsInitSave = true;
            }
        }

        
        // compute nextSectionOrder
        const defaultSectionOrder = Object.keys(sectionsRef.current);
        let nextSectionOrder: string[];

        if (Array.isArray(savedSectionOrder)) {
          // Keep saved order but drop unknown keys and append any new sections at the end.
          const known = new Set(defaultSectionOrder);
          const filtered = savedSectionOrder.filter((k) => known.has(k));
          const missing = defaultSectionOrder.filter((k) => !filtered.includes(k));
          nextSectionOrder = [...filtered, ...missing];
          if (
            filtered.length !== (savedSectionOrder as string[]).length ||
            missing.length > 0
          ) {
            needsInitSave = true;
          }
        } else {
          nextSectionOrder = defaultSectionOrder;
          needsInitSave = true; // seed on first run
        }

        let finalPref = pref;

        // 3) If no pref yet OR some sections were missing → save once.
        if (!pref?.id || needsInitSave) {
          const nextUiPreference: UiPref = {
            ...(pref?.uiPreference as UiPref),
            homeLayout: nextHomeLayout,
            homeSectionOrder: nextSectionOrder
          } as UiPref;

          const args: SaveArgs<UserPreference> = {
            resource: {
              id: pref?.id ?? null, // create if missing
              userId: subject,
              uiPreference: nextUiPreference
            } as any,
            type: "user-preference"
          };

          await save([args], {
            apiBaseUrl: "/user-api",
            skipOperationForSingleRequest: true
          });

          // If pref was undefined (brand new), create an in-memory representation.
          finalPref = pref ?? ({ id: null, userId: subject, uiPreference: nextUiPreference } as any);
          // Force uiPreference to what was just saved
          finalPref = { ...finalPref, uiPreference: nextUiPreference as UserPreference["uiPreference"] };
        }
          // Update state map for optimistic reads:
          if (!cancelled) {
            setUserPref(finalPref);
            setIdsBySection(nextHomeLayout);
            setSectionOrder(nextSectionOrder);
          }
        }
        catch (e) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAndInit();
    return () => {
      cancelled = true;
    };
  }, [apiClient, save, subject]);

  /* Returns a list of NavigationCard objects for a given sectionKey, ordered by ids
   * triggered by change in idsBySection
  */
  const getCards = useCallback(
    (sectionKey: string): NavigationCard[] => {
      // try to fetch defaults and ids
      const defaults = sectionsRef.current[sectionKey] ?? [];
      const ids = idsBySection[sectionKey] ?? defaults.map((c) => c.id);
      return orderByIds(defaults, ids);
    },
    [idsBySection]
  );

  
  // Expose current section order (fall back to default order if not loaded yet)
  const getSectionOrder = useCallback(
    (defaultOrder: string[]): string[] => {
      return Array.isArray(sectionOrder) ? sectionOrder : defaultOrder;
    },
    [sectionOrder]
  );

  // Persist a single section’s order; merges into uiPreference.homeLayout.
  const saveCards = useCallback(
    async (sectionKey: string, nextCards: NavigationCard[]) => {
      const nextIds = nextCards.map((c) => c.id);

      // Optimistic update for this section only
      setIdsBySection((prev) => ({ ...prev, [sectionKey]: nextIds }));

      // Build merged uiPreference payload
      const currentUiPref = (userPref?.uiPreference ?? {}) as any;
      const currenthomeLayout = (currentUiPref.homeLayout ?? {}) as Record<string, string[]>;
      const mergedHomeLayout = { ...currenthomeLayout, [sectionKey]: nextIds };

      const nextUiPref: UiPref = { ...currentUiPref, homeLayout: mergedHomeLayout } as UiPref;

      const args: SaveArgs<UserPreference> = {
        resource: {
          id: userPref?.id ?? null,
          userId: userPref?.userId ?? subject,
          uiPreference: nextUiPref as UserPreference["uiPreference"]
        } as any,
        type: "user-preference"
      };

      try {
        await save([args], { apiBaseUrl: "/user-api", skipOperationForSingleRequest: true });
        // Keep in-memory preference consistent:
        setUserPref(prev => {
          if (!prev) return prev; // still loading or not created
          if (prev.uiPreference === nextUiPref) return prev; // nothing changed by reference
          return { ...prev, uiPreference: nextUiPref as UserPreference["uiPreference"] };
        });
      } catch (e) {
        setError(e);
      }
    },
    [save, subject, userPref]
  );

  // persist section order
  const saveSectionOrder = useCallback(
    async (nextOrder: string[]) => {
      setSectionOrder(nextOrder);
      const currentUiPref = (userPref?.uiPreference ?? {}) as any;
      const nextUiPref: UiPref = {
        ...currentUiPref,
        homeSectionOrder: nextOrder
      } as UiPref;

      const args: SaveArgs<UserPreference> = {
        resource: {
          id: userPref?.id ?? null,
          userId: userPref?.userId ?? subject,
          uiPreference: nextUiPref as UserPreference["uiPreference"]
        } as any,
        type: "user-preference"
      };
      try {
        await save([args], { apiBaseUrl: "/user-api", skipOperationForSingleRequest: true });
        setUserPref((prev) => {
          if (!prev) return prev;
          if (prev.uiPreference === nextUiPref) return prev;
          return { ...prev, uiPreference: nextUiPref as UserPreference["uiPreference"] };
        });
      } catch (e) {
        setError(e);
      }
    },
    [save, subject, userPref]
  );

  // Return a stable API object to prevent unnecessary re-renders
  return useMemo(
    () => ({
      getCards,
      saveCards,
      getSectionOrder,
      saveSectionOrder,
      loading,
      error,
      prefId: userPref?.id ?? null
    }),
    [getCards, saveCards, loading, error, userPref?.id]
  );
}