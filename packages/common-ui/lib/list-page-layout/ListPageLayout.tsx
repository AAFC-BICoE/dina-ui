import { useLocalStorage } from "@rehooks/local-storage";
import { FormikProps } from "formik";
import {
  FilterParam,
  KitsuResource,
  KitsuResponse,
  PersistedResource
} from "kitsu";
import { ComponentType, ReactNode } from "react";
import {
  CheckBoxFieldProps,
  ColumnDefinition,
  DinaForm,
  FilterAttribute,
  MetaWithTotal,
  QueryTable,
  QueryTableProps,
  useGroupedCheckBoxes
} from "..";
import { fiql, simpleSearchFilterToFiql } from "../filter-builder/fiql";
import { rsql } from "../filter-builder/rsql";
import {
  BulkDeleteButton,
  BulkDeleteButtonProps,
  BulkEditButton
} from "./bulk-buttons";
import { FilterForm } from "./FilterForm";
import { ColumnSort, SortingState } from "@tanstack/react-table";
import { FreeTextFilterForm } from "./FreeTextFilterForm";

export enum ListLayoutFilterType {
  FREE_TEXT = "FREE_TEXT",
  FILTER_BUILDER = "FILTER_BUILDER"
}

export interface ListPageLayoutProps<TData extends KitsuResource> {
  // if useFiql is true, additionalFilters should be a FIQL string or a function that returns a FIQL string.
  additionalFilters?: FilterParam | ((filterForm: any) => FilterParam);
  defaultSort?: ColumnSort[];
  filterType?: ListLayoutFilterType;
  enableInMemoryFilter?: boolean;
  useFiql?: boolean; // Uses a FIQL string for filtering instead of RSQL.
  filterFn?: (
    filterForm: any,
    value: PersistedResource<TData>,
    index?: number,
    array?: PersistedResource<TData>[]
  ) => boolean;
  filterAttributes?: FilterAttribute[];
  filterFormchildren?: (formik: FormikProps<any>) => React.ReactElement;
  id: string;
  queryTableProps:
    | QueryTableProps<TData>
    | ((context: ListPageLayoutContext<TData>) => QueryTableProps<TData>);
  wrapTable?: (children: ReactNode) => ReactNode;

  /** Adds the bulk edit button and the row checkboxes. */
  bulkEditPath?: string;

  /** Adds the bulk delete button and the row checkboxes. */
  bulkDeleteButtonProps?: BulkDeleteButtonProps;
}

interface ListPageLayoutContext<TData extends KitsuResource> {
  CheckBoxField: ComponentType<CheckBoxFieldProps<TData>>;
}

/**
 * Generic layout component for list pages. Renders a QueryTable with a filter builder.
 * The filter form state is hydrated from localstorage, and is saved in localstorage on form submit.
 */
export function ListPageLayout<TData extends KitsuResource>({
  additionalFilters: additionalFiltersProp,
  defaultSort: defaultSortProp,
  filterType = ListLayoutFilterType.FILTER_BUILDER,
  enableInMemoryFilter = false,
  useFiql = false,
  filterFn = () => true,
  filterAttributes,
  filterFormchildren,
  id,
  queryTableProps,
  wrapTable = (children) => children,
  bulkDeleteButtonProps,
  bulkEditPath
}: ListPageLayoutProps<TData>) {
  const tablePageSizeKey = `${id}_tablePageSize`;
  const tableSortKey = `${id}_tableSort`;
  const filterformKey = `${id}_filterForm`;

  // Use a localStorage hook to get the filter form state,
  // and re-render when the watched localStorage key is changed.
  const [filterForm, setFilterForm] = useLocalStorage<any>(filterformKey, {});

  // Default sort and page-size from the QueryTable. These are only used on the initial
  // QueryTable render, and are saved in localStorage when the table's sort or page-size is changed.
  const [storedDefaultSort, setStoredDefaultSort] =
    useLocalStorage<SortingState>(tableSortKey);
  const defaultSort = storedDefaultSort ??
    defaultSortProp ?? [{ id: "createdOn", desc: true }];

  const [defaultPageSize, setDefaultPageSize] =
    useLocalStorage<number>(tablePageSizeKey);

  let filterParam: FilterParam | undefined;
  let inMemoryFilter:
    | ((
        value: PersistedResource<TData>,
        index?: number,
        array?: PersistedResource<TData>[]
      ) => boolean)
    | undefined;

  if (enableInMemoryFilter) {
    inMemoryFilter = (
      value: PersistedResource<TData>,
      index?: number,
      array?: PersistedResource<TData>[]
    ) => {
      return filterFn(filterForm, value, index, array);
    };
  } else if (useFiql) {
    let filterBuilderFiql = "";
    try {
      filterBuilderFiql = fiql(filterForm.filterBuilderModel);
    } catch (error) {
      // If there is an error, ignore the filter form rsql instead of crashing the page.
      console.error(error);
      setImmediate(() => setFilterForm({}));
    }

  const additionalFilters =
    typeof additionalFiltersProp === "function"
      ? additionalFiltersProp(filterForm)
      : additionalFiltersProp;

  // If the caller returns a string, use it directly (it is already FIQL).
  // Otherwise, convert the simple-filter object to FIQL.
  const additionalFiltersFiql =
    typeof additionalFilters === "string"
      ? (additionalFilters as string)
      : simpleSearchFilterToFiql(additionalFilters);

  if (filterBuilderFiql && additionalFiltersFiql) {
    filterParam = `(${filterBuilderFiql});(${additionalFiltersFiql})`;
  } else if (filterBuilderFiql) {
    filterParam = filterBuilderFiql;
  } else if (additionalFiltersFiql) {
    filterParam = additionalFiltersFiql;
  }
  } else {
    let filterBuilder = "";
    try {
      filterBuilder = rsql(filterForm.filterBuilderModel);
    } catch (error) {
      // If there is an error, ignore the filter form rsql instead of crashing the page.
      console.error(error);
      setImmediate(() => setFilterForm({}));
    }

    const additionalFilters = (
      typeof additionalFiltersProp === "function"
        ? additionalFiltersProp(filterForm)
        : additionalFiltersProp
    ) as Record<string, string>;

    // Combine the inner rsql with the passed additionalFilters?.rsql filter if they are set:
    const combinedFilter = [
      ...(filterBuilder ? [filterBuilder] : []),
      ...(additionalFilters?.rsql ? [additionalFilters?.rsql] : [])
    ].join(" and ");

    // Build the JSONAPI filter param to be sent to the back-end.
    filterParam = {
      ...additionalFilters,
      // Only include rsql if it's not blank:
      ...(combinedFilter && { rsql: combinedFilter })
    };
  }

  const {
    CheckBoxField,
    CheckBoxHeader,
    setAvailableItems: setAvailableSamples
  } = useGroupedCheckBoxes({
    fieldName: "itemIdsToSelect"
  });

  const showRowCheckboxes = Boolean(bulkDeleteButtonProps || bulkEditPath);

  const resolvedQueryTableProps =
    typeof queryTableProps === "function"
      ? queryTableProps({ CheckBoxField })
      : queryTableProps;

  const columns: ColumnDefinition<TData>[] = [
    ...(showRowCheckboxes
      ? [
          {
            cell: ({ row: { original: resource } }) => (
              <CheckBoxField key={resource.id} resource={resource} />
            ),
            header: () => CheckBoxHeader,
            enableSorting: false,
            size: 200,
            id: "checkbox_column"
          }
        ]
      : []),
    ...resolvedQueryTableProps.columns
  ];

  async function onSuccess(response: KitsuResponse<TData[], MetaWithTotal>) {
    setAvailableSamples(response.data);
    return resolvedQueryTableProps.onSuccess?.(response);
  }

  const tableElement = (
    <QueryTable<TData>
      enableInMemoryFilter={enableInMemoryFilter}
      filterFn={inMemoryFilter}
      defaultPageSize={defaultPageSize ?? undefined}
      defaultSort={defaultSort ?? undefined}
      // if useFiql is true, use fiql for filtering:
      filter={useFiql ? undefined : filterParam}
      fiql={useFiql ? (filterParam as string) : undefined}
      onPageSizeChange={(newSize) => setDefaultPageSize(newSize)}
      onSortedChange={(newSort) => setStoredDefaultSort(newSort)}
      topRightCorner={
        <div className="d-flex gap-3">
          {bulkEditPath && <BulkEditButton pathname={bulkEditPath} />}
          {bulkDeleteButtonProps && (
            <BulkDeleteButton {...bulkDeleteButtonProps} />
          )}
        </div>
      }
      {...resolvedQueryTableProps}
      columns={columns}
      onSuccess={onSuccess}
    />
  );

  /** Wrap the table in a form when checkboxes are enabled. */
  const tableWrappedInForm = showRowCheckboxes ? (
    <DinaForm<BulkSelectableFormValues> initialValues={{ itemIdsToSelect: {} }}>
      {tableElement}
    </DinaForm>
  ) : (
    tableElement
  );

  return (
    <div>
      {filterAttributes &&
        filterType === ListLayoutFilterType.FILTER_BUILDER && (
          <FilterForm filterAttributes={filterAttributes} id={id}>
            {filterFormchildren}
          </FilterForm>
        )}
      {filterAttributes && filterType === ListLayoutFilterType.FREE_TEXT && (
        <FreeTextFilterForm filterAttributes={filterAttributes} id={id}>
          {filterFormchildren}
        </FreeTextFilterForm>
      )}
      {wrapTable(tableWrappedInForm)}
    </div>
  );
}

export interface BulkSelectableFormValues {
  itemIdsToSelect: Record<string, boolean>;
}
