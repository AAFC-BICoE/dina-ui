
import { useEffect, useRef, useState } from "react";
import { useApiClient } from "common-ui";

export type ControlledVocabularyType = "MANAGED_ATTRIBUTE" | "SYSTEM";
export type ControlledVocabularyClass = "QUALIFIED_VALUE" | "CONTROLLED_TERM";
import { ControlledVocabulary } from "packages/dina-ui/types/collection-api/resources/ControlledVocabulary";

export interface UseCVSidebarOptions {
  apiBaseUrl?: string;      // e.g., "/collection-api"
  resourcePath?: string;    // e.g., "controlled-vocabulary"
  limit?: number;
  /**
   * Pass raw params through to the Kitsu client. For FIQL, set { fiql: "…" }.
   * You can also use fields/sort/include as needed.
   */
  params?: Record<string, any>;
}

export interface UseCVSidebarResult {
  loading: boolean;
  error?: unknown;
  items: ControlledVocabulary[];
  refetch: () => Promise<void>;
}

export function useControlledVocabularySidebarData(
  opts: UseCVSidebarOptions = {}
): UseCVSidebarResult {
  const {
    apiBaseUrl = "/collection-api",
    resourcePath = "controlled-vocabulary",
    limit = 1000,
    params
  } = opts;

  const { apiClient } = useApiClient();
  const [items, setItems] = useState<ControlledVocabulary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>();
  const mounted = useRef(true);

  async function fetchOnce() {
    setLoading(true);
    setError(undefined);
    try {
      const path = `${apiBaseUrl}/${resourcePath}`;

      // Kitsu will pass through unknown query keys (e.g., fiql, filter, fields, sort…)
      const query = {
        page: { limit },
        ...(params ?? {})
      } as any;

      const response: any = await apiClient.get(path, query);

      // Normalize to array:
      const data: any[] = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];
      const normalized: ControlledVocabulary[] = data as ControlledVocabulary[];

      if (!mounted.current) return;
      setItems(normalized);
    } catch (e) {
      if (!mounted.current) return;
      setError(e);
    } finally {
      if (!mounted.current) return;
      setLoading(false);
    }
  }

  useEffect(() => {
    mounted.current = true;
    fetchOnce();
    return () => {
      mounted.current = false;
    };
  }, [apiBaseUrl, resourcePath, limit, JSON.stringify(params)]);

  return {
    loading,
    error,
    items,
    refetch: fetchOnce
  };
}
