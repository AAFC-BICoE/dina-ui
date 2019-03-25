import { FilterParam, KitsuResource, KitsuResponse } from "kitsu";
import React, { createRef } from "react";
import ReactTable, { Column } from "react-table";
import "react-table/react-table.css";
import titleCase from "title-case";
import { PageSpec } from "types/seqdb-api/page";
import { MetaWithTotal } from "../../types/seqdb-api/meta";
import { JsonApiQuerySpec, Query } from "../api-client/Query";

/** Object types accepted as a column definition. */
export type ColumnDefinition<TData> = string | Column<TData>;

/** QueryTable component's props. */
export interface QueryTableProps<TData extends KitsuResource> {
  /** JSONAPI resource path. */
  path: string;

  /** JSONAPI filter spec. */
  filter?: FilterParam;

  /** Related resources to include in the request. */
  include?: string;

  /** Default sort attribute. */
  defaultSort?: string;

  /** Default page size. */
  defaultPageSize?: number;

  /** The columns to show in the table. */
  columns: Array<ColumnDefinition<TData>>;
}

/** QueryTable component's state. */
interface QueryTableState {
  /** JSONAPI sort attribute. */
  sort?: string;

  /** JSONAPI page spec. */
  page: PageSpec;
}

const DEFAULT_PAGE_SIZE = 25;

const queryTableStyle = `
  /* Wraps long text instead of shortening it. */
  .rt-td {
    white-space: unset !important;
  }

  /*
   * Hides the page-jump input's spin button, which on this component would not
   * otherwise trigger a page jump.
   */
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0; /* <-- Apparently some margin are still there even though it's hidden */
  }
  input[type=number] {
    -moz-appearance:textfield;
  }
`;

/**
 * Table component that fetches data from the backend API.
 */
export class QueryTable<TData extends KitsuResource> extends React.Component<
  QueryTableProps<TData>,
  QueryTableState
> {
  /** Ref for the div that wraps this component. */
  public divWrapperRef = createRef<HTMLDivElement>();

  constructor(props: QueryTableProps<TData>) {
    super(props);

    const { defaultPageSize, defaultSort } = props;

    // Set defaults for page limit if it is not defined.
    const limit = defaultPageSize || DEFAULT_PAGE_SIZE;

    this.state = {
      page: { limit, offset: 0 },
      sort: defaultSort
    };
  }

  public render() {
    const { filter, include, path } = this.props;
    const { page, sort } = this.state;

    const query: JsonApiQuerySpec = { path, filter, include, page, sort };

    return (
      <div ref={this.divWrapperRef}>
        <style>{queryTableStyle}</style>
        <Query<TData[], MetaWithTotal> query={query}>
          {({ loading, response }) => (
            <ReactTable
              className="-striped"
              columns={this.mappedColumns}
              data={response && response.data}
              defaultPageSize={page.limit}
              loading={loading}
              manual={true}
              onFetchData={this.onFetchData}
              pages={this.getNumberOfPages(response)}
              showPaginationTop={true}
            />
          )}
        </Query>
      </div>
    );
  }

  private onFetchData = reactTableState => {
    const { page: newPageNumber, sorted, pageSize } = reactTableState;

    const newOffset = newPageNumber * pageSize;

    // Get the new sort order in JSONAPI format. e.g. "name,-description".
    const newSort: string = (sorted as Array<{ desc: boolean; id: string }>)
      .map<string>(({ desc, id }) => `${desc ? "-" : ""}${id}`)
      .join();

    // When a new page is requested and the top of the window is below the top of the table,
    // scroll to the top of the table.
    if (
      newOffset !== this.state.page.offset &&
      window.scrollY > this.divWrapperRef.current.offsetTop
    ) {
      window.scrollTo(0, this.divWrapperRef.current.offsetTop);
    }

    this.setState({
      // Only add the sort attribute if there is a sort.
      ...(newSort.length && { sort: newSort }),
      page: {
        limit: pageSize,
        offset: newOffset
      }
    });
  };

  /** Map this component's "columns" prop to react-table's "columns" prop. */
  private get mappedColumns(): Column[] {
    return this.props.columns.map<Column>(column => {
      // The "columns" prop can be a string or a react-table Column type.
      if (typeof column === "string") {
        return {
          Header: titleCase(column),
          accessor: column
        };
      } else {
        return column;
      }
    });
  }

  /** Get the number of pages from the response. */
  private getNumberOfPages(
    response: KitsuResponse<TData[], MetaWithTotal>
  ): number | undefined {
    if (response && response.meta && response.meta.totalResourceCount) {
      return Math.ceil(
        response.meta.totalResourceCount / this.state.page.limit
      );
    } else {
      return undefined;
    }
  }
}
