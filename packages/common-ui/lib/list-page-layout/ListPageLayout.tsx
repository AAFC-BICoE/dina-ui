import { useLocalStorage } from "@rehooks/local-storage";
import { FormikProps } from "formik";
import { KitsuResource, KitsuResponse, PersistedResource } from "kitsu";
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
import { simpleSearchFilterToFiql } from "../filter-builder/fiql";
import { filterModelToSimpleSearchFilter } from "../filter-builder/filterModelToSimpleSearchFilter";
import {
  SimpleSearchFilter,
  SimpleSearchFilterBuilder
} from "../util/simpleSearchFilterBuilder";
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
  /**
   * Filters combined with the filter form filters using AND. Build them with SimpleSearchFilterBuilder
   * like `.whereProvided("group", "EQ", filterForm.group)`. Raw FIQL strings are ignored.
   */
  additionalFilters?:
    | SimpleSearchFilter
    | ((filterForm: any) => SimpleSearchFilter);
  defaultSort?: ColumnSort[];
  filterType?: ListLayoutFilterType;
  enableInMemoryFilter?: boolean;
  filterFn?: (
    filterForm: any,
    value: PersistedResource<TData>,
    index?: number,
    array?: PersistedResource<TData>[]
  ) => boolean;
  filterAttributes?: FilterAttribute[];
  filterFormchildren?: (formik: FormikProps<any>) => React.ReactElement;

  /* CSS classes added to the filter form's layout wrapper, e.g. "list-filter-panel". */
  filterFormClassName?: string;

  /* Placeholder text for the free-text search input (FREE_TEXT filter type only). */
  filterPlaceholder?: string;

  /**
   * Re-filters the list as the user types in FREE_TEXT searches.
   * Useful for in-memory lists where filtering is cheap.
   */
  liveSearch?: boolean;

  id: string;
  queryTableProps:
    | QueryTableProps<TData>
    | ((context: ListPageLayoutContext<TData>) => QueryTableProps<TData>);
  wrapTable?: (children: ReactNode) => ReactNode;

  /** Adds the bulk edit button and row checkboxes. */
  bulkEditPath?: string;

  /** Adds the bulk delete button and row checkboxes. */
  bulkDeleteButtonProps?: BulkDeleteButtonProps;
}

interface ListPageLayoutContext<TData extends KitsuResource> {
  CheckBoxField: ComponentType<CheckBoxFieldProps<TData>>;
}

/**
 * Generic layout component for list pages rendering a QueryTable with a filter builder.
 * Filter form state is synced with localstorage.
 */
export function ListPageLayout<TData extends KitsuResource>({
  additionalFilters: additionalFiltersProp,
  defaultSort: defaultSortProp,
  filterType = ListLayoutFilterType.FILTER_BUILDER,
  enableInMemoryFilter = false,
  filterFn = () => true,
  filterAttributes,
  filterFormchildren,
  filterFormClassName,
  filterPlaceholder,
  liveSearch,
  id,
  queryTableProps,
  wrapTable = (children) => children,
  bulkDeleteButtonProps,
  bulkEditPath
}: ListPageLayoutProps<TData>) {
  const tablePageSizeKey = `${id}_tablePageSize`;
  const tableSortKey = `${id}_tableSort`;
  const filterformKey = `${id}_filterForm`;

  // Get the filter form state from localstorage and re-render when it changes.
  const [filterForm, setFilterForm] = useLocalStorage<any>(filterformKey, {});

  // Initial sort and page-size which are saved in localstorage upon change.
  const [storedDefaultSort, setStoredDefaultSort] =
    useLocalStorage<SortingState>(tableSortKey);
  const defaultSort = storedDefaultSort ??
    defaultSortProp ?? [{ id: "createdOn", desc: true }];

  const [defaultPageSize, setDefaultPageSize] =
    useLocalStorage<number>(tablePageSizeKey);

  let fiqlFilter: string | undefined;
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
  } else {
    let filterBuilderFilter = {};
    try {
      filterBuilderFilter = filterModelToSimpleSearchFilter(
        filterForm.filterBuilderModel
      );
    } catch (error) {
      // Ignore filter form errors instead of crashing the page.
      console.error(error);
      setImmediate(() => setFilterForm({}));
    }

    const additionalFilters =
      typeof additionalFiltersProp === "function"
        ? additionalFiltersProp(filterForm)
        : additionalFiltersProp;

    // Combine filter form filters with additional filters using AND.
    const filter = SimpleSearchFilterBuilder.create()
      .add(filterBuilderFilter)
      .add(additionalFilters)
      .build();

    fiqlFilter = simpleSearchFilterToFiql(filter) || undefined;
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
      fiql={fiqlFilter}
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
          <FilterForm
            filterAttributes={filterAttributes}
            id={id}
            className={filterFormClassName}
          >
            {filterFormchildren}
          </FilterForm>
        )}
      {filterAttributes && filterType === ListLayoutFilterType.FREE_TEXT && (
        <FreeTextFilterForm
          filterAttributes={filterAttributes}
          id={id}
          className={filterFormClassName}
          placeholder={filterPlaceholder}
          liveSearch={liveSearch}
        >
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
