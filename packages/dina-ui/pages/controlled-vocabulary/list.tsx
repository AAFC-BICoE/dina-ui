
import {
  ColumnDefinition,
  dateCell,
  descriptionCell,
  ListLayoutFilterType,
  ListPageLayout,
  SimpleSearchFilterBuilder,
  useApiClient,
} from "common-ui";
import { useMemo, useCallback, useState } from "react";

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

import { useControlledVocabularySidebarData } from
  "packages/dina-ui/components/controlled-vocabulary/useControlledVocabularySidebarData";
import { ControlledVocabularyItem } from "packages/dina-ui/types/collection-api/resources/ControlledVocabularyItem";

/**
 * Controlled Vocabulary list page (single page, no tabs).
 */
export default function ControlledVocabularyListPage() {
  const { formatMessage } = useDinaIntl();
  const { apiClient } = useApiClient();
  /**
   * 1) Fetch only CVs of type MANAGED_ATTRIBUTE using **FIQL** (no RSQL).
   *    We only need `name` and `key` for the sidebar options.
   */
  const {
    items: cvItems,
    loading: cvLoading,
    error: cvError
  } = useControlledVocabularySidebarData({
    apiBaseUrl: "/collection-api",
    resourcePath: "controlled-vocabulary",
    limit: 1000,
    params: {
      fiql: "type==MANAGED_ATTRIBUTE",
      fields: { "controlled-vocabulary": "id,name,key,type,vocabClass" },
      sort: "name"
    }
  });

  /**
   * 2) Built-in text search attributes:
   */
  const CV_FILTER_ATTRIBUTES = [
    "name",
    "key",
    "unit",
    "createdBy",
    "dinaComponent",
    "vocabularyElementType",
    "managedAttributeComponent"
  ];

  /**
   * 3) Table columns
   */
  const COLUMNS: ColumnDefinition<ControlledVocabularyItem>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row: { original } }) => original.name ?? ""
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
          ? original.acceptedValues.map(v => `"${v}"`).join(", ")
          : ""
    },
    // You can keep using your helper for multilingual description:
    descriptionCell(false, false, "multilingualDescription"),
    groupCell("group"),
    { accessorKey: "createdBy", header: () => <DinaMessage id="field_createdBy" /> },
    dateCell("createdOn")
  ];


  /**
   * 4) Sidebar UI state.
   */

  const [typeFilter, setTypeFilter] = useState<TypeFilterState>({
    parent_cv_ids: [],
    children: [] // (optional) for future child selections
  });

  // 4) Lazy loader for children:
  //    For a given parent CV id, fetch related CV items and return *unique* dinaComponent values (+counts).
  const loadChildren = useCallback(async (parentUuid : string): Promise<SidebarOption[]> => {
    // We can pass fiql for this ad-hoc fetch; the server supports FIQL consistently.
    const resp: any = await apiClient.get("/collection-api/controlled-vocabulary-item", {
      page: { limit: 1000 },
      filter: { "controlledVocabulary.uuid": { EQ: parentUuid } },
      fields: { "controlled-vocabulary-item": "id,dinaComponent" }
    });

    const arr: any[] = Array.isArray(resp?.data) ? resp.data : [];
    // Build unique dinaComponent list with counts:
    const counts = new Map<string, number>();
    for (const it of arr) {
      const comp = it?.attributes?.dinaComponent ?? it?.dinaComponent;
      if (!comp) continue;
      counts.set(comp, (counts.get(comp) ?? 0) + 1);
    }
    return Array.from(counts, ([id, count]) => ({ id, label: id, count }));
  }, [apiClient]);


  /**
   * 5) Build ALL sidebar options dynamically
   *    - Managed Attributes: each CV becomes an option
   */

  const parentOptions = useMemo(
    () =>
      cvItems.map(cv => ({
        // Use the JSON:API id (uuid) so we can filter cv-items by relationship:
        id: String((cv as any).id),
        label: String(cv.name),
        hasChildren: true // show chevron now; you'll wire loadChildren later
      })),
    [cvItems]
  );
  
  /**
   * 6) Page layout with sidebar + table.
   */
  return (
    <PageLayout
      titleId="controlledVocabularyTitle">
      <Head
        title={
          formatMessage("controlledVocabularyTitle" as any) ?? "Controlled Vocabulary"
        }
      />

      <ListPageLayout<ControlledVocabularyItem>
        id="controlled-vocabulary-items-list"
        useFiql={false}
        filterType={ListLayoutFilterType.FILTER_BUILDER}
        filterAttributes={CV_FILTER_ATTRIBUTES}

        additionalFilters={(filterForm) => {
          // Parent selections from the sidebar:
          const selectedParents = typeFilter.parent_cv_ids;

          const selectedChildren = typeFilter.children ?? [];

          // When filtering on relationship paths (e.g., "controlledVocabulary.id"),
          const builder = SimpleSearchFilterBuilder.create<ControlledVocabularyItem>()
            .whereProvided("group" as any, "EQ", (filterForm as any)?.group);

          if (selectedParents?.length) {
            builder.add({
              ["controlledVocabulary.uuid"]: { IN: selectedParents.join(",") }
            } as any);
          }


          // Children (dinaComponent)
          if (selectedChildren.length === 1) {
            builder.where("dinaComponent" as any, "EQ", selectedChildren[0]);
          } else if (selectedChildren.length > 1) {
            // See multi-select options below
            builder.whereIn("dinaComponent" as any, selectedChildren as any);
          }

          return builder.build();
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
                parents={cvLoading ? [] : parentOptions}
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

            <div className={styles.cvMain}>{children}</div>
          </div>
        )}
        queryTableProps={{
          columns: COLUMNS,
          path: "/collection-api/controlled-vocabulary-item",
        }}
      />
    </PageLayout>
  );
}
