import {
  ColumnDefinition,
  dateCell,
  descriptionCell,
  ListLayoutFilterType,
  ListPageLayout,
  useApiClient,
  LoadingSpinner,
  SelectField,
  SimpleSearchFilterBuilder,
  simpleSearchFilterToFiql
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
import { VOCABULARY_ELEMENT_TYPE_OPTIONS } from "packages/dina-ui/types/collection-api/resources/VocabularyElementType";

const CV_FILTER_ATTRIBUTES = ["name", "key", "unit", "createdBy"];

/** Key of the Managed Attribute vocabulary in every module's API. */
const MANAGED_ATTRIBUTE_VOCABULARY_KEY = "managed_attribute";

function getColumns(
  viewRoute: string,
  componentLabel: (component: string) => string
): ColumnDefinition<ControlledVocabularyItem>[] {
  return [
    {
      accessorKey: "multilingualTitle",
      header: () => <DinaMessage id="field_multilingualTitle" />,
      cell: ({ row: { original } }) =>
        original.multilingualTitle?.titles?.[0]?.title ?? ""
    },
    {
      accessorKey: "name",
      header: () => <DinaMessage id="field_name" />,
      cell: ({ row: { original } }) => (
        <Link href={`${viewRoute}?id=${original.id}`}>
          {original.name ?? original.id}
        </Link>
      )
    },
    {
      accessorKey: "dinaComponent",
      header: () => <DinaMessage id="field_dinaComponent" />,
      cell: ({ row: { original } }) =>
        original.dinaComponent ? componentLabel(original.dinaComponent) : ""
    },
    {
      accessorKey: "vocabularyElementType",
      header: () => <DinaMessage id="field_vocabularyElementType" />,
      cell: ({ row: { original } }) => {
        const option = VOCABULARY_ELEMENT_TYPE_OPTIONS.find(
          ({ value }) => value === original.vocabularyElementType
        );
        return option ? (
          <DinaMessage id={option.labelKey} />
        ) : (
          original.vocabularyElementType ?? ""
        );
      }
    },
    {
      accessorKey: "unit",
      header: () => <DinaMessage id="field_unit" />,
      cell: ({ row: { original } }) => original.unit ?? ""
    },
    {
      accessorKey: "acceptedValues",
      header: () => <DinaMessage id="field_acceptedValues" />,
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
  fiql: simpleSearchFilterToFiql(
    SimpleSearchFilterBuilder.create<ControlledVocabularyItem>()
      .whereIn("type", ["MANAGED_ATTRIBUTE", "SYSTEM"])
      .build()
  ),
  fields: { "controlled-vocabulary": "id,name,key,type,vocabClass" },
  sort: "name"
};

/**
 * Groups controlled-vocabulary-items by dinaComponent into SidebarOptions
 * representing component types and their item counts.
 * The label is the raw dinaComponent; it is translated when rendered.
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

  // Sidebar data for each module. Hooks are called unconditionally in a fixed order.
  // Add a new entry for new modules.
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

  // 3. Data component label for the sidebar, e.g. "Material Sample" for MATERIAL_SAMPLE.
  const componentLabel = useCallback(
    (component: string) => {
      const labelKey = activeModule.componentTypeLabels[component];
      return labelKey ? formatMessage(labelKey as any) : component;
    },
    [activeModule, formatMessage]
  );

  // Fetch all child items for the active module in a single bulk request.
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

  // Managed Attribute vocabularies, which can also be filtered by data component.
  const managedAttributeIds = useMemo(
    () =>
      new Set(
        cvItems
          .filter((cv) => cv.key === MANAGED_ATTRIBUTE_VOCABULARY_KEY)
          .map((cv) => String((cv as any).id))
      ),
    [cvItems]
  );

  const [parentCounts, setParentCounts] = useState<Record<string, number>>({});
  const [parentsWithChildren, setParentsWithChildren] = useState<Set<string>>(
    new Set()
  );
  const [childrenMap, setChildrenMap] = useState<
    Record<string, SidebarOption[]>
  >({});

  // Load counts and sidebar children on dataset changes. Child items are fetched
  // in a single bulk request and grouped client-side to reduce requests.
  useEffect(() => {
    if (!cvItems || cvItems.length === 0) return;

    // Ignore the result of a load that finishes after the tab was changed.
    let cancelled = false;

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
          newCounts[parentId] = items.length;
          // Only Managed Attribute vocabularies are filtered by data component.
          // Other vocabularies (e.g. Identifier Type) are filtered as a whole even
          // when their items have a dinaComponent.
          if (!managedAttributeIds.has(parentId)) continue;
          const componentChildren = groupChildItems(items);
          if (componentChildren.length > 0) {
            withChildren.add(parentId);
          }
          byParent[parentId] = componentChildren;
        }
      } catch (e) {
        console.error("Error loading counts for CV items", e);
        for (const cv of cvItems) {
          newCounts[String((cv as any).id)] = -1;
        }
      }

      if (cancelled) return;

      setParentCounts(newCounts);
      setParentsWithChildren(withChildren);
      setChildrenMap(byParent);

      // Every vocabulary and data component is selected by default.
      setTypeFilter({
        parent_cv_ids: cvItems.map((cv) => String((cv as any).id)),
        children: Array.from(
          new Set(
            Object.values(byParent)
              .flat()
              .map((c) => c.id)
          )
        )
      });
    };

    fetchAllCounts();
    return () => {
      cancelled = true;
    };
  }, [cvItems, loadAllChildItems, activeModule, managedAttributeIds]);

  // Data components with their translated labels for the sidebar.
  const labelledChildrenMap = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(childrenMap).map(([parentId, components]) => [
          parentId,
          components.map((c) => ({ ...c, label: componentLabel(c.id) }))
        ])
      ),
    [childrenMap, componentLabel]
  );

  // 4. Build Sidebar Options (merged with Counts)
  const parentOptions = useMemo(() => {
    return cvItems.map((cv) => {
      const id = String((cv as any).id);
      return {
        id,
        label: String(cv.name),
        count: parentCounts[id]
      };
    });
  }, [cvItems, parentCounts]);

  // 5. Filter group helpers
  const getParentFilterGroups = useCallback(
    (selectedParents: string[], selectedChildren: string[]) => {
      // A vocabulary is filtered by data component only when some of its components
      // are deselected. With all of them selected, all of its items are shown.
      const needsComponentFilter = (id: string) => {
        const components = childrenMap[id] ?? [];
        return (
          selectedChildren.length > 0 &&
          parentsWithChildren.has(id) &&
          !components.every((c) => selectedChildren.includes(c.id))
        );
      };

      return {
        needsFilter: selectedParents.filter(needsComponentFilter),
        withoutFilter: selectedParents.filter((id) => !needsComponentFilter(id))
      };
    },
    [parentsWithChildren, childrenMap]
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

  const { needsFilter, withoutFilter } = useMemo(
    () => getParentFilterGroups(effectiveParents, selectedChildren),
    [effectiveParents, selectedChildren, getParentFilterGroups]
  );

  const isMixedCase = needsFilter.length > 0 && withoutFilter.length > 0;

  // Everything selected shows every item, the same as nothing selected.
  const isEverythingSelected =
    parentOptions.length > 0 &&
    needsFilter.length === 0 &&
    parentOptions.every((p) => effectiveParents.includes(p.id));

  const mixedCaseFilterFn = useCallback(
    (filterForm: any, item: any) => {
      const cv = item.controlledVocabulary;
      const parentId = typeof cv === "string" ? cv : cv?.id;

      if (typeof parentId === "string" && needsFilter.includes(parentId)) {
        if (!selectedChildren.includes(item.dinaComponent)) return false;
      }

      const group = filterForm?.group as string | undefined;
      if (group && item.group !== group) return false;

      const elementType = filterForm?.vocabularyElementType as
        | string
        | undefined;
      if (elementType && item.vocabularyElementType !== elementType) {
        return false;
      }

      // Same case-insensitive "contains" match as the server-side free-text search.
      const searchText = String(
        filterForm?.filterBuilderModel?.value ?? ""
      ).toLowerCase();
      if (
        searchText &&
        !CV_FILTER_ATTRIBUTES.some((attribute) =>
          String(item[attribute] ?? "")
            .toLowerCase()
            .includes(searchText)
        )
      ) {
        return false;
      }

      return true;
    },
    [needsFilter, selectedChildren]
  );

  const vocabularyElementTypeOptions = useMemo(
    () => [
      { label: "<any>", value: undefined },
      ...VOCABULARY_ELEMENT_TYPE_OPTIONS.map(({ labelKey, value }) => ({
        label: formatMessage(labelKey),
        value
      }))
    ],
    [formatMessage]
  );

  // 9. Query table props with API path depending on active tab.
  const buildQueryTableProps = useCallback(() => {
    const filter: Record<string, any> = {};
    const itemsPath = `${activeModule.apiBaseUrl}/controlled-vocabulary-item`;

    if (effectiveParents.length > 0 && !isEverythingSelected) {
      filter["controlledVocabulary.uuid"] = {
        IN: effectiveParents.join(",")
      };
    }

    if (isMixedCase) {
      return {
        columns: getColumns(activeModule.viewRoute, componentLabel),
        path: itemsPath,
        filter,
        include: "controlledVocabulary",
        defaultPageSize: 1000
      };
    }

    if (
      needsFilter.length === effectiveParents.length &&
      selectedChildren.length > 0
    ) {
      filter.dinaComponent = { IN: selectedChildren.join(",") };
    }

    return {
      columns: getColumns(activeModule.viewRoute, componentLabel),
      path: itemsPath,
      ...(Object.keys(filter).length > 0 ? { filter } : {})
    };
  }, [
    effectiveParents,
    selectedChildren,
    isMixedCase,
    needsFilter,
    isEverythingSelected,
    activeModule,
    componentLabel
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
        onSelect={(tabIndex) => {
          setCurrentTab(tabIndex);
          setTypeFilter({ parent_cv_ids: [], children: [] });
        }}
      />

      <ListPageLayout<ControlledVocabularyItem>
        id="controlled-vocabulary-list"
        filterType={ListLayoutFilterType.FREE_TEXT}
        filterAttributes={CV_FILTER_ATTRIBUTES}
        filterFormClassName={`list-filter-panel ${styles.cvFilterPanel}`}
        filterPlaceholder={formatMessage(
          "controlledVocabularySearchPlaceholder"
        )}
        additionalFilters={(filterForm) =>
          SimpleSearchFilterBuilder.create<ControlledVocabularyItem>()
            .whereProvided(
              "group",
              "EQ",
              isMixedCase ? undefined : (filterForm.group as string | undefined)
            )
            .whereProvided(
              "vocabularyElementType",
              "EQ",
              isMixedCase
                ? undefined
                : (filterForm.vocabularyElementType as string | undefined)
            )
            .build()
        }
        enableInMemoryFilter={isMixedCase}
        filterFn={isMixedCase ? mixedCaseFilterFn : undefined}
        filterFormchildren={({ submitForm }) => (
          <div className="d-flex gap-3 flex-wrap">
            <div className={styles.cvFilterDropdown}>
              <SelectField
                onChange={() => setImmediate(submitForm)}
                name="vocabularyElementType"
                label={formatMessage("field_vocabularyElementType")}
                options={vocabularyElementTypeOptions}
              />
            </div>
            <div className={styles.cvFilterDropdown}>
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
            <aside
              className={styles.cvSidebar}
              aria-label={formatMessage("filterByType")}
            >
              <TypeFilterSideBarDynamic
                parents={parentOptions}
                childrenMap={labelledChildrenMap}
                selected={typeFilter}
                onChange={setTypeFilter}
              />
              {!!cvError && (
                <div className="text-danger small mt-2">
                  <DinaMessage id="controlledVocabulariesLoadError" />
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
