import {
  ColumnDefinition,
  CreateButton,
  dateCell,
  descriptionCell,
  ListLayoutFilterType,
  ListPageLayout,
  useApiClient,
  LoadingSpinner,
  SimpleSearchFilterBuilder
} from "common-ui";
import Link from "next/link";
import { useMemo, useCallback, useState, useEffect, useRef } from "react";

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

const CV_FILTER_ATTRIBUTES = ["name", "key", "unit", "createdBy"];

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
  const countsLoadedRef = useRef(false);

  useEffect(() => {
    if (!cvItems || cvItems.length === 0) return;
    if (countsLoadedRef.current) return;
    countsLoadedRef.current = true;

    const fetchAllCounts = async () => {
      const newCounts: Record<string, number> = {};
      const withChildren = new Set<string>();

      await Promise.all(
        cvItems.map(async (cv: any) => {
          try {
            const children = await loadChildren(cv.id);
            if (children.length > 0) {
              withChildren.add(cv.id);
            }

            // Always count *all* items directly — summing child counts
            // from loadChildren would miss items without a dinaComponent.
            const resp: any = await apiClient.get(
              "/collection-api/controlled-vocabulary-item",
              {
                page: { limit: 999 },
                filter: { "controlledVocabulary.uuid": { EQ: cv.id } },
                fields: { "controlled-vocabulary-item": "id" }
              }
            );
            newCounts[cv.id] = resp?.data?.length || 0;
          } catch (e) {
            console.error("Error loading count for CV", cv.id, e);
            // On failure, still record the CV so the sidebar doesn't lose the
            // entry and fall back to children.length.
            newCounts[cv.id] = -1;
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

  // 5. Filter group helpers
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

  // 6. Detect mixed case: some selected parents have dinaComponent children,
  //    some don't, and children are checked.  We pre-filter by parent server-side and
  //    refine dinaComponent client-side via filterFn.

  const selectedParents = typeFilter.parent_cv_ids ?? [];
  const selectedChildren = typeFilter.children ?? [];

  // When children are checked but no parent is explicitly selected,
  // implicitly treat every parent-that-has-children as selected.
  const effectiveParents = useMemo(
    () =>
      selectedParents.length === 0 && selectedChildren.length > 0
        ? Array.from(parentsWithChildren)
        : selectedParents,
    [selectedParents, selectedChildren, parentsWithChildren]
  );

  // 7. Detect mixed case: some selected parents have dinaComponent children,
  //    some don't, and children are checked. We pre-filter by parent
  //    server-side and refine dinaComponent client-side via filterFn.
  const isMixedCase = useMemo(() => {
    if (effectiveParents.length === 0 || selectedChildren.length === 0)
      return false;
    const { needsFilter, withoutFilter } = getParentFilterGroups(
      effectiveParents,
      selectedChildren
    );
    return needsFilter.length > 0 && withoutFilter.length > 0;
  }, [effectiveParents, selectedChildren, getParentFilterGroups]);

  // 8. Mixed case client-side filter
  const mixedCaseFilterFn = useCallback(
    (filterForm: any, item: any) => {
      const cv = item.controlledVocabulary;
      const parentId = typeof cv === "string" ? cv : cv?.id;

      if (typeof parentId === "string" && parentsWithChildren.has(parentId)) {
        if (!selectedChildren.includes(item.dinaComponent)) return false;
      }

      const group = filterForm?.group as string | undefined;
      if (group && item.group !== group) return false;

      return true;
    },
    [parentsWithChildren, selectedChildren]
  );

  // 9. Query table props
  const buildQueryTableProps = useCallback(() => {
    const filter: Record<string, any> = {};

    if (effectiveParents.length > 0) {
      filter["controlledVocabulary.uuid"] = {
        IN: effectiveParents.join(",")
      };
    }

    if (isMixedCase) {
      return {
        columns: COLUMNS,
        path: "/collection-api/controlled-vocabulary-item",
        filter,
        include: "controlledVocabulary",
        defaultPageSize: 1000
      };
    }

    const { needsFilter } = getParentFilterGroups(
      effectiveParents,
      selectedChildren
    );

    if (
      needsFilter.length === effectiveParents.length &&
      selectedChildren.length > 0
    ) {
      filter.dinaComponent = { IN: selectedChildren.join(",") };
    }

    return {
      columns: COLUMNS,
      path: "/collection-api/controlled-vocabulary-item",
      filter
    };
  }, [effectiveParents, selectedChildren, isMixedCase, getParentFilterGroups]);

  return (
    <PageLayout
      titleId="controlledVocabularyTitle"
      buttonBarContent={
        <div className="flex d-flex ms-auto">
          <CreateButton entityLink="/controlled-vocabulary-item" />
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
        filterType={ListLayoutFilterType.FILTER_BUILDER}
        filterAttributes={CV_FILTER_ATTRIBUTES}
        additionalFilters={(filterForm) =>
          SimpleSearchFilterBuilder.create<ControlledVocabularyItem>()
            .whereProvided(
              "group",
              "EQ",
              isMixedCase ? undefined : (filterForm.group as string | undefined)
            )
            .build()
        }
        enableInMemoryFilter={isMixedCase}
        filterFn={isMixedCase ? mixedCaseFilterFn : undefined}
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
              {cvLoading && <LoadingSpinner loading={true} />}
              {children}
            </div>
          </div>
        )}
        queryTableProps={buildQueryTableProps}
      />
    </PageLayout>
  );
}
