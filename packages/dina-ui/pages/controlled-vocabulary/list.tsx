import {
  ColumnDefinition,
  dateCell,
  descriptionCell,
  ListLayoutFilterType,
  ListPageLayout,
  useApiClient,
} from "common-ui";
import { useMemo, useCallback, useState, useEffect } from "react"; // Added useEffect

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
      fiql: "type==MANAGED_ATTRIBUTE",
      fields: { "controlled-vocabulary": "id,name,key,type,vocabClass" },
      sort: "name"
    }
  });

  const CV_FILTER_ATTRIBUTES = ["name", "key", "unit", "createdBy", "dinaComponent"];

  // 2. Filter State
  const [typeFilter, setTypeFilter] = useState<TypeFilterState>({
    parent_cv_ids: [],
    children: [] 
  });

  // 3. Load Children Helper (Used for both Lazy Load AND Initial Count)
  const loadChildren = useCallback(async (parentUuid : string): Promise<SidebarOption[]> => {
    const resp: any = await apiClient.get("/collection-api/controlled-vocabulary-item", {
      page: { limit: 1000 },
      filter: { "controlledVocabulary.uuid": { EQ: parentUuid } },
      fields: { "controlled-vocabulary-item": "id,dinaComponent" }
    });

    const arr: any[] = Array.isArray(resp?.data) ? resp.data : [];
    const counts = new Map<string, number>();
    for (const it of arr) {
      const comp = it?.attributes?.dinaComponent ?? it?.dinaComponent;
      if (!comp) continue;
      counts.set(comp, (counts.get(comp) ?? 0) + 1);
    }
    return Array.from(counts, ([id, count]) => ({ id, label: id, count }));
  }, [apiClient]);


  const [parentCounts, setParentCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!cvItems || cvItems.length === 0) return;

    // Loop through all parents and fetch their structure to determine counts
    const fetchAllCounts = async () => {
      const newCounts: Record<string, number> = {};
      
      await Promise.all(
        cvItems.map(async (cv: any) => {
          try {
            const children = await loadChildren(cv.id);
            // The sidebar treats the groups (dinaComponents) as children.
            // We count how many groups exist.
            newCounts[cv.id] = children.length;
          } catch (e) {
            console.error("Error loading count for CV", cv.id, e);
          }
        })
      );
      
      setParentCounts(newCounts);
    };

    fetchAllCounts();
  }, [cvItems, loadChildren]);

  // 4. Build Sidebar Options (merged with Counts)
  const parentOptions = useMemo(() => {
    return cvItems.map(cv => {
      const id = String((cv as any).id);
      return {
        id,
        label: String(cv.name),
        hasChildren: true,
        // Inject the pre-calculated count here
        count: parentCounts[id] 
      };
    });
  }, [cvItems, parentCounts]);

  // 5. Helpers for FIQL
  function fiqlOrEq(field: string, values: string[]): string {
    if (!values?.length) return "";
    if (values.length === 1) return `${field}==${values[0]}`;
    return `(${values.map(v => `${field}==${v}`).join(",")})`;
  }

  function fiqlAnd(...parts: (string | undefined)[]): string {
    const nonEmpty = parts.filter(Boolean) as string[];
    if (!nonEmpty.length) return "";
    return nonEmpty.map(p => `(${p})`).join(";");
  }

  // 6. Table Columns
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
    descriptionCell(false, false, "multilingualDescription"),
    groupCell("group"),
    { accessorKey: "createdBy", header: () => <DinaMessage id="field_createdBy" /> },
    dateCell("createdOn")
  ];

  return (
    <PageLayout titleId="controlledVocabularyTitle">
      <Head
        title={formatMessage("controlledVocabularyTitle" as any) ?? "Controlled Vocabulary"}
      />
      <ListPageLayout<ControlledVocabularyItem>
        id="controlled-vocabulary-items-list"
        useFiql={true}
        filterType={ListLayoutFilterType.FILTER_BUILDER}
        filterAttributes={CV_FILTER_ATTRIBUTES}
        
        additionalFilters={(filterForm) => {
          const selectedChildren = typeFilter.children ?? [];
          const groupVal = (filterForm as any)?.group as string | undefined;
          const groupFiql = groupVal ? `group==${groupVal}` : "";
          const childFiql = fiqlOrEq("dinaComponent", selectedChildren);
          return fiqlAnd(groupFiql, childFiql);
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