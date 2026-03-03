import {
  ColumnDefinition,
  CreateButton,
  dateCell,
  descriptionCell,
  ListLayoutFilterType,
  ListPageLayout,
  useApiClient,
  LoadingSpinner
} from "common-ui";
import Link from "next/link";
import { useMemo, useCallback, useState, useEffect } from "react";

import PageLayout from "packages/dina-ui/components/page/PageLayout";
import { DinaMessage, useDinaIntl } from "packages/dina-ui/intl/dina-ui-intl";
import {
  Head,
  GroupSelectField,
  groupCell,
  TypeFilterState,
  TypeFilterSideBarDynamic,
  SidebarOption
} from "packages/dina-ui/components";

import styles from "./controlled-vocabulary.module.css";

import { useControlledVocabularySidebarData } from "packages/dina-ui/components/controlled-vocabulary/useControlledVocabularySidebarData";
import { ControlledVocabularyItem } from "packages/dina-ui/types/collection-api/resources/ControlledVocabularyItem";

export default function ControlledVocabularyListPage() {
  const { formatMessage } = useDinaIntl();
  const { apiClient } = useApiClient();

  // 1. Data Hook
  const {
    items: cvItems,
    loading: cvLoading,
    error: cvError
  } = useControlledVocabularySidebarData({
    apiBaseUrl: "/collection-api",
    resourcePath: "controlled-vocabulary",
    limit: 1000,
    params: {
      fiql: "type==MANAGED_ATTRIBUTE,type==SYSTEM",
      fields: { "controlled-vocabulary": "id,name,key,type,vocabClass" },
      sort: "name"
    }
  });

  const CV_FILTER_ATTRIBUTES = ["name", "key", "unit", "createdBy"];

  // 2. Filter State
  const [typeFilter, setTypeFilter] = useState<TypeFilterState>({
    parent_cv_ids: [],
    children: []
  });

  // 3. Load Children Helper (Used for both Lazy Load AND Initial Count)
  const loadChildren = useCallback(
    async (parentUuid: string): Promise<SidebarOption[]> => {
      const resp: any = await apiClient.get(
        "/collection-api/controlled-vocabulary-item",
        {
          page: { limit: 1000 },
          filter: { "controlledVocabulary.uuid": { EQ: parentUuid } },
          fields: { "controlled-vocabulary-item": "id,dinaComponent" }
        }
      );

      const arr: any[] = Array.isArray(resp?.data) ? resp.data : [];
      const counts = new Map<string, number>();

      for (const it of arr) {
        const comp = it?.attributes?.dinaComponent ?? it?.dinaComponent;
        if (comp) {
          // Item has a dinaComponent - group by component
          counts.set(comp, (counts.get(comp) ?? 0) + 1);
        }
      }

      // Only return children if there are actual dinaComponents
      return Array.from(counts, ([id, count]) => ({ id, label: id, count }));
    },
    [apiClient]
  );

  const [parentCounts, setParentCounts] = useState<Record<string, number>>({});
  const [parentsWithChildren, setParentsWithChildren] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    if (!cvItems || cvItems.length === 0) return;

    const fetchAllCounts = async () => {
      const newCounts: Record<string, number> = {};
      const withChildren = new Set<string>();

      await Promise.all(
        cvItems.map(async (cv: any) => {
          try {
            const children = await loadChildren(cv.id);
            if (children.length > 0) {
              // Has dinaComponent grouping
              withChildren.add(cv.id);
              newCounts[cv.id] = children.reduce(
                (sum, child) => sum + (child.count || 0),
                0
              );
            } else {
              // Count all items directly
              const resp: any = await apiClient.get(
                "/collection-api/controlled-vocabulary-item",
                {
                  page: { limit: 1000 },
                  filter: { "controlledVocabulary.uuid": { EQ: cv.id } },
                  fields: { "controlled-vocabulary-item": "id" }
                }
              );
              newCounts[cv.id] = resp?.data?.length || 0;
            }
          } catch (e) {
            console.error("Error loading count for CV", cv.id, e);
          }
        })
      );

      setParentCounts(newCounts);
      setParentsWithChildren(withChildren);
    };

    fetchAllCounts();
  }, [cvItems, loadChildren, apiClient]);

  // 4. Build Sidebar Options (merged with Counts)
  const parentOptions = useMemo(() => {
    return cvItems.map((cv) => {
      const id = String((cv as any).id);
      return {
        id,
        label: String(cv.name),
        hasChildren: parentsWithChildren.has(id),
        // Inject the pre-calculated count here
        count: parentCounts[id]
      };
    });
  }, [cvItems, parentCounts, parentsWithChildren]);

  // Helper to determine which parents need dinaComponent filtering
  const getParentFilterGroups = useCallback(
    (selectedParents: string[], selectedChildren: string[]) => {
      const needsFilter =
        selectedChildren.length > 0
          ? selectedParents.filter((id) => parentsWithChildren.has(id))
          : [];

      const withoutFilter =
        selectedChildren.length > 0
          ? selectedParents.filter((id) => !parentsWithChildren.has(id))
          : selectedParents;

      return { needsFilter, withoutFilter };
    },
    [parentsWithChildren]
  );

  // 5. Multi-Request Data Fetching
  // When filtering requires OR logic (e.g., some parents filtered by dinaComponent, others not),
  // multiple API requests are needed
  const [mergedData, setMergedData] = useState<
    ControlledVocabularyItem[] | null
  >(null);
  const [isLoadingMergedData, setIsLoadingMergedData] = useState(false);
  const [lastFetchKey, setLastFetchKey] = useState("");

  useEffect(() => {
    const selectedParents = typeFilter.parent_cv_ids ?? [];
    const selectedChildren = typeFilter.children ?? [];

    const fetchKey = JSON.stringify({ selectedParents, selectedChildren });
    if (fetchKey === lastFetchKey && mergedData !== null) {
      return; // Already fetched this combination
    }

    if (selectedParents.length === 0) {
      setMergedData(null);
      setLastFetchKey(fetchKey);
      return;
    }

    const { needsFilter, withoutFilter } = getParentFilterGroups(
      selectedParents,
      selectedChildren
    );

    // Check if we need multiple requests (OR logic scenario)
    if (needsFilter.length === 0 || withoutFilter.length === 0) {
      setMergedData(null);
      setLastFetchKey(fetchKey);
      return;
    }

    // Make multiple requests with different filter combinations
    const fetchMultiRequestData = async () => {
      setIsLoadingMergedData(true);

      try {
        const requests: Promise<any>[] = [
          // Request 1: Parents that need dinaComponent filtering
          apiClient.get("/collection-api/controlled-vocabulary-item", {
            page: { limit: 1000 },
            filter: {
              "controlledVocabulary.uuid": { IN: needsFilter.join(",") },
              dinaComponent: { IN: selectedChildren.join(",") }
            }
          }),
          // Request 2: Parents that don't need dinaComponent filtering
          apiClient.get("/collection-api/controlled-vocabulary-item", {
            page: { limit: 1000 },
            filter: {
              "controlledVocabulary.uuid": { IN: withoutFilter.join(",") }
            }
          })
        ];

        const results = await Promise.all(requests);

        // Merge results and deduplicate by ID
        const allData: ControlledVocabularyItem[] = [];
        const seenIds = new Set<string>();

        for (const result of results) {
          const items = (result?.data || []) as ControlledVocabularyItem[];
          for (const item of items) {
            if (item.id && !seenIds.has(item.id)) {
              seenIds.add(item.id);
              allData.push(item);
            }
          }
        }

        setMergedData(allData);
        setLastFetchKey(fetchKey);
      } catch (error) {
        console.error("Error fetching multi-request data:", error);
        setMergedData([]);
        setLastFetchKey(fetchKey);
      } finally {
        setIsLoadingMergedData(false);
      }
    };

    fetchMultiRequestData();
  }, [typeFilter, getParentFilterGroups, apiClient, lastFetchKey, mergedData]);

  // 6. Table Columns
  const COLUMNS: ColumnDefinition<ControlledVocabularyItem>[] = [
    {
      accessorKey: "multilingualTitle",
      header: "Multilingual Title",
      cell: ({ row: { original } }) =>
        original.multilingualTitle?.titles?.[0]?.title ?? ""
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row: { original } }) => (
        <Link href={`/controlled-vocabulary-item/view?id=${original.id}`}>
          {original.name ?? original.id}
        </Link>
      )
    },
    {
      accessorKey: "dinaComponent",
      header: "Data Component",
      cell: ({ row: { original } }) => {
        const comp = original.dinaComponent as any;
        return comp ?? "";
      }
    },
    {
      accessorKey: "vocabularyElementType",
      header: "Vocabulary Element Type",
      cell: ({ row: { original } }) => original.vocabularyElementType ?? ""
    },
    {
      accessorKey: "unit",
      header: "Unit",
      cell: ({ row: { original } }) => original.unit ?? ""
    },
    {
      accessorKey: "acceptedValues",
      header: "Accepted Values",
      cell: ({ row: { original } }) =>
        Array.isArray(original.acceptedValues)
          ? original.acceptedValues.map((v) => `"${v}"`).join(", ")
          : ""
    },
    descriptionCell(false, false, "multilingualDescription"),
    groupCell("group"),
    {
      accessorKey: "createdBy",
      header: () => <DinaMessage id="field_createdBy" />
    },
    dateCell("createdOn")
  ];

  return (
    <PageLayout
      titleId="controlledVocabularyTitle"
      buttonBarContent={
        <div className="flex d-flex ms-auto">
          <CreateButton
            entityLink="/controlled-vocabulary"
            messageKey="createNewControlledVocabulary"
          />
          <CreateButton
            entityLink="/controlled-vocabulary-item"
            messageKey="createNewControlledVocabularyItem"
            extraCssClasses="ms-2"
          />
        </div>
      }
    >
      <Head
        title={
          formatMessage("controlledVocabularyTitle" as any) ??
          "Controlled Vocabulary"
        }
      />
      <ListPageLayout<ControlledVocabularyItem>
        id="controlled-vocabulary-items-list"
        useFiql={false}
        filterType={ListLayoutFilterType.FILTER_BUILDER}
        filterAttributes={CV_FILTER_ATTRIBUTES}
        additionalFilters={(filterForm) => {
          if (mergedData !== null) {
            return { id: { EQ: "__USING_MERGED_DATA__" } };
          }

          const selectedParents = typeFilter.parent_cv_ids ?? [];
          const selectedChildren = typeFilter.children ?? [];
          const groupVal = (filterForm as any)?.group as string | undefined;

          const { needsFilter } = getParentFilterGroups(
            selectedParents,
            selectedChildren
          );

          const filters: Record<string, any> = {};

          if (selectedParents.length > 0) {
            filters["controlledVocabulary.uuid"] = {
              IN: selectedParents.join(",")
            };
          }

          // Only add dinaComponent filter when ALL selected parents can use it
          if (
            needsFilter.length === selectedParents.length &&
            selectedChildren.length > 0
          ) {
            filters.dinaComponent = { IN: selectedChildren.join(",") };
          }

          if (groupVal) {
            filters.group = { EQ: groupVal };
          }

          return filters;
        }}
        enableInMemoryFilter={mergedData !== null}
        filterFn={(filterForm, item) => {
          // When using merged data, filter items in memory
          if (mergedData !== null) {
            const groupVal = (filterForm as any)?.group as string | undefined;

            // Check if item is in our merged data
            const isInMergedData = mergedData.some((d) => d.id === item.id);
            if (!isInMergedData) {
              return false;
            }

            // Apply group filter if present
            if (groupVal && item.group !== groupVal) {
              return false;
            }

            return true;
          }
          return true;
        }}
        filterFormchildren={({ submitForm }) => (
          <div className="mb-3">
            <div style={{ width: 300 }}>
              <GroupSelectField
                onChange={() => setImmediate(submitForm)}
                name="group"
                showAnyOption
              />
            </div>
          </div>
        )}
        wrapTable={(children) => (
          <div className={styles.cvGrid}>
            <aside className={styles.cvSidebar} aria-label="Filter by Type">
              <h2 className="h6 mb-2">Filter by Type</h2>

              <TypeFilterSideBarDynamic
                title="Controlled Vocabularies"
                parents={parentOptions}
                selected={typeFilter}
                onChange={setTypeFilter}
                loadChildren={loadChildren}
              />
              {!!cvError && (
                <div className="text-danger small mt-2">
                  Failed to load controlled vocabularies.
                </div>
              )}
            </aside>
            <div className={styles.cvMain}>
              {(cvLoading || isLoadingMergedData) && (
                <LoadingSpinner loading={true} />
              )}
              {children}
            </div>
          </div>
        )}
        queryTableProps={{
          columns: COLUMNS,
          path: "/collection-api/controlled-vocabulary-item"
        }}
      />
    </PageLayout>
  );
}
