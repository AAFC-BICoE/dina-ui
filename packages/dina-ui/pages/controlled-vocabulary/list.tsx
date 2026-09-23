import {
  ColumnDefinition,
  dateCell,
  descriptionCell,
  ListLayoutFilterType,
  ListPageLayout,
  useApiClient,
  LoadingSpinner,
  SimpleSearchFilterBuilder
} from "common-ui";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo, useCallback, useState, useEffect } from "react";
import { FaPlus } from "react-icons/fa";

import PageLayout from "packages/dina-ui/components/page/PageLayout";
import { DinaMessage, useDinaIntl } from "packages/dina-ui/intl/dina-ui-intl";
import {
  Head,
  GroupSelectField,
  groupCell,
  ModuleTabConfig,
  ModuleTabs,
  TypeFilterState,
  TypeFilterSideBarDynamic,
  SidebarOption
} from "packages/dina-ui/components";

import styles from "./controlled-vocabulary.module.css";

import { useControlledVocabularySidebarData } from "packages/dina-ui/components/controlled-vocabulary/useControlledVocabularySidebarData";
import {
  CONTROLLED_VOCABULARY_APIS,
  ControlledVocabularyApiConfig
} from "packages/dina-ui/components/controlled-vocabulary/controlledVocabularyItemUtils";
import { ControlledVocabularyItem } from "packages/dina-ui/types/collection-api/resources/ControlledVocabularyItem";

const CV_FILTER_ATTRIBUTES = ["name", "key", "unit", "createdBy"];

function getColumns(
  viewRoute: string
): ColumnDefinition<ControlledVocabularyItem>[] {
  return [
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
        <Link href={`${viewRoute}?id=${original.id}`}>
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
}

const CV_MODULES: Array<ControlledVocabularyApiConfig & { titleKey: string }> =
  [
    {
      titleKey: "collectionListTitle",
      ...CONTROLLED_VOCABULARY_APIS.collection
    },
    {
      titleKey: "objectStoreTitle",
      ...CONTROLLED_VOCABULARY_APIS.objectstore
    },
    {
      titleKey: "seqdbTitle",
      ...CONTROLLED_VOCABULARY_APIS.sequencing
    },
    {
      titleKey: "agentsSectionTitle",
      ...CONTROLLED_VOCABULARY_APIS.agent
    }
  ];

const MODULE_TABS: ModuleTabConfig[] = CV_MODULES.map(({ titleKey }) => ({
  titleKey
}));

const SHARED_CV_PARAMS = {
  fiql: "type==MANAGED_ATTRIBUTE,type==SYSTEM",
  fields: { "controlled-vocabulary": "id,name,key,type,vocabClass" },
  sort: "name"
};

/**
 * Groups raw controlled-vocabulary-items by their dinaComponent value into the
 * SidebarOption shape used by the sidebar (one option per component type, with
 * the number of items using that component).
 */
function groupChildItems(items: ControlledVocabularyItem[]): SidebarOption[] {
  const counts = new Map<string, number>();

  for (const item of items) {
    const comp = (item as any).attributes?.dinaComponent ?? item.dinaComponent;
    if (comp) {
      counts.set(comp, (counts.get(comp) ?? 0) + 1);
    }
  }

  return Array.from(counts, ([id, count]) => ({ id, label: id, count }));
}

export default function ControlledVocabularyListPage() {
  const { formatMessage } = useDinaIntl();
  const { apiClient } = useApiClient();
  const router = useRouter();

  // Tab state
  const [currentTab, setCurrentTab] = useState<number>(() => {
    const tab = Number(router.query.tab);
    return Number.isInteger(tab) && tab > 0 && tab < CV_MODULES.length
      ? tab
      : 0;
  });

  // Sidebar data for each configured module. Hooks are called unconditionally
  // and in a fixed order; add a new entry when a new module is introduced.
  const collectionSidebarData = useControlledVocabularySidebarData({
    apiBaseUrl: CV_MODULES[0].apiBaseUrl,
    limit: 1000,
    params: SHARED_CV_PARAMS
  });
  const objectStoreSidebarData = useControlledVocabularySidebarData({
    apiBaseUrl: CV_MODULES[1].apiBaseUrl,
    limit: 1000,
    params: SHARED_CV_PARAMS
  });
  const seqDBSidebarData = useControlledVocabularySidebarData({
    apiBaseUrl: CV_MODULES[2].apiBaseUrl,
    limit: 1000,
    params: SHARED_CV_PARAMS
  });
  const agentSidebarData = useControlledVocabularySidebarData({
    apiBaseUrl: CV_MODULES[3].apiBaseUrl,
    limit: 1000,
    params: SHARED_CV_PARAMS
  });

  const moduleSidebarData = [
    collectionSidebarData,
    objectStoreSidebarData,
    seqDBSidebarData,
    agentSidebarData
  ];

  const activeModule = CV_MODULES[currentTab];

  // Active tab's data
  const {
    items: cvItems,
    loading: cvLoading,
    error: cvError
  } = moduleSidebarData[currentTab];

  // 2. Filter State
  const [typeFilter, setTypeFilter] = useState<TypeFilterState>({
    parent_cv_ids: [],
    children: []
  });

  // 3. Load Children Helper — uses the active tab's API.
  const loadChildItems = useCallback(
    async (parentUuid: string): Promise<ControlledVocabularyItem[]> => {
      const resp: any = await apiClient.get(
        `${activeModule.apiBaseUrl}/controlled-vocabulary-item`,
        {
          page: { limit: 1000 },
          filter: { "controlledVocabulary.uuid": { EQ: parentUuid } },
          fields: { "controlled-vocabulary-item": "id,dinaComponent" }
        }
      );

      return Array.isArray(resp?.data)
        ? (resp.data as ControlledVocabularyItem[])
        : [];
    },
    [apiClient, activeModule]
  );

  const loadChildren = useCallback(
    async (parentUuid: string): Promise<SidebarOption[]> =>
      groupChildItems(await loadChildItems(parentUuid)),
    [loadChildItems]
  );

  // Fetch all child items for the active module in a single bulk request.
  // The per-parent loadChildItems/loadChildren above is kept only as a
  // fallback for parents whose children were not part of the bulk result.
  const loadAllChildItems = useCallback(async (): Promise<
    ControlledVocabularyItem[]
  > => {
    const resp: any = await apiClient.get(
      `${activeModule.apiBaseUrl}/controlled-vocabulary-item`,
      {
        page: { limit: 1000 },
        include: "controlledVocabulary",
        fields: {
          "controlled-vocabulary-item": "id,dinaComponent",
          "controlled-vocabulary": "id"
        }
      }
    );

    return Array.isArray(resp?.data)
      ? (resp.data as ControlledVocabularyItem[])
      : [];
  }, [apiClient, activeModule]);

  const [parentCounts, setParentCounts] = useState<Record<string, number>>({});
  const [parentsWithChildren, setParentsWithChildren] = useState<Set<string>>(
    new Set()
  );
  const [childrenMap, setChildrenMap] = useState<
    Record<string, SidebarOption[]>
  >({});

  // Load counts and sidebar children whenever the active dataset changes
  // (tab switch / new data). All child items for the active module are fetched
  // in a single bulk request and grouped by parent client-side, avoiding one
  // request per controlled-vocabulary.
  useEffect(() => {
    if (!cvItems || cvItems.length === 0) return;

    const fetchAllCounts = async () => {
      const newCounts: Record<string, number> = {};
      const withChildren = new Set<string>();
      const byParent: Record<string, SidebarOption[]> = {};

      try {
        const allChildItems = await loadAllChildItems();

        const itemsByParent = new Map<string, ControlledVocabularyItem[]>();
        for (const item of allChildItems) {
          const cv = (item as any).controlledVocabulary;
          const parentId =
            typeof cv === "string" ? cv : (cv?.id as string | undefined);
          if (!parentId) continue;

          const items = itemsByParent.get(parentId) ?? [];
          items.push(item);
          itemsByParent.set(parentId, items);
        }

        for (const cv of cvItems) {
          newCounts[String((cv as any).id)] = 0;
        }

        for (const [parentId, items] of itemsByParent) {
          const componentChildren = groupChildItems(items);
          // Only treat a vocabulary as having children when it has at least
          // one component child. Vocabularies whose items have no
          // dinaComponent (e.g. association type) should not show an
          // expand/contract arrow.
          if (componentChildren.length > 0) {
            withChildren.add(parentId);
          }
          newCounts[parentId] = items.length;
          byParent[parentId] = componentChildren;
        }
      } catch (e) {
        console.error("Error loading counts for CV items", e);
        for (const cv of cvItems) {
          newCounts[String((cv as any).id)] = -1;
        }
      }

      setParentCounts(newCounts);
      setParentsWithChildren(withChildren);
      setChildrenMap(byParent);
    };

    fetchAllCounts();
  }, [cvItems, loadAllChildItems, activeModule]);

  // 4. Build Sidebar Options (merged with Counts)
  const parentOptions = useMemo(() => {
    return cvItems.map((cv) => {
      const id = String((cv as any).id);
      return {
        id,
        label: String(cv.name),
        hasChildren: parentsWithChildren.has(id),
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

  const selectedParents = typeFilter.parent_cv_ids ?? [];
  const selectedChildren = typeFilter.children ?? [];

  const effectiveParents = useMemo(
    () =>
      selectedParents.length === 0 && selectedChildren.length > 0
        ? Array.from(parentsWithChildren)
        : selectedParents,
    [selectedParents, selectedChildren, parentsWithChildren]
  );

  const isMixedCase = useMemo(() => {
    if (effectiveParents.length === 0 || selectedChildren.length === 0)
      return false;
    const { needsFilter, withoutFilter } = getParentFilterGroups(
      effectiveParents,
      selectedChildren
    );
    return needsFilter.length > 0 && withoutFilter.length > 0;
  }, [effectiveParents, selectedChildren, getParentFilterGroups]);

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

  // 9. Query table props — API path depends on the active tab.
  const buildQueryTableProps = useCallback(() => {
    const filter: Record<string, any> = {};
    const itemsPath = `${activeModule.apiBaseUrl}/controlled-vocabulary-item`;

    if (effectiveParents.length > 0) {
      filter["controlledVocabulary.uuid"] = {
        IN: effectiveParents.join(",")
      };
    }

    if (isMixedCase) {
      return {
        columns: getColumns(activeModule.viewRoute),
        path: itemsPath,
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
      columns: getColumns(activeModule.viewRoute),
      path: itemsPath,
      ...(Object.keys(filter).length > 0 ? { filter } : {})
    };
  }, [
    effectiveParents,
    selectedChildren,
    isMixedCase,
    getParentFilterGroups,
    activeModule
  ]);

  return (
    <PageLayout
      titleId="controlledVocabularyTitle"
      buttonBarContent={
        <div className="flex d-flex ms-auto">
          <Link
            href={activeModule.editRoute}
            className="btn btn-primary ms-auto"
          >
            <FaPlus className="me-2" />
            <DinaMessage id="createNew" />
          </Link>
        </div>
      }
    >
      <Head
        title={
          formatMessage("controlledVocabularyTitle" as any) ??
          "Controlled Vocabulary"
        }
      />

      <ModuleTabs
        tabs={MODULE_TABS}
        selectedIndex={currentTab}
        onSelect={setCurrentTab}
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
                onChange={() => setTimeout(() => submitForm(), 0)}
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
                childrenMap={childrenMap}
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
