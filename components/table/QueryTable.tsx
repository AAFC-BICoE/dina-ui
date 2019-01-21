import { FilterParam, KitsuResource } from "kitsu";
import React from "react";
import ReactTable, { Column } from "react-table";
import "react-table/react-table.css";
import titleCase from "title-case";
import { PageSpec } from "types/seqdb-api/page";
import { MetaWithTotal } from "../../types/seqdb-api/meta";
import { JsonApiQuerySpec, Query } from "../api-client/Query";

/** QueryTable component's props. */
export interface QueryTableProps {
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
  columns: string[];
}

/** QueryTable component's state. */
interface QueryTableState {
  /** JSONAPI sort attribute. */
  sort?: string;

  /** JSONAPI page spec. */
  page: PageSpec;
}

const DEFAULT_PAGE_SIZE = 25;

/**
 * Table component that fetches data from the backend API.
 */
export class QueryTable<TData extends KitsuResource[]> extends React.Component<
  QueryTableProps,
  QueryTableState
> {
  constructor(props: QueryTableProps) {
    super(props);

    const { defaultPageSize, defaultSort } = props;

    // Set defaults for page limit if it is not defined.
    const limit = defaultPageSize || DEFAULT_PAGE_SIZE;

    this.state = {
      sort: defaultSort,
      page: { limit, offset: 0 }
    };
  }

  onFetchData = reactTableState => {
    const { page: newPageNumber, sorted, pageSize } = reactTableState;

    const newOffset = newPageNumber * pageSize;

    const newSort: string = (sorted as { desc: boolean; id: string }[])
      .map<string>(({ desc, id }) => `${desc ? "-" : ""}${id}`)
      .join();

    this.setState({
      // Only add the sort attribute if there is a sort.
      ...(newSort.length && { sort: newSort }),
      page: {
        limit: pageSize,
        offset: newOffset
      }
    });
  };

  get mappedColumns(): Column[] {
    return this.props.columns.map<Column>(column => ({
      Header: titleCase(column),
      accessor: column
    }));
  }

  render() {
    const { filter, include, path } = this.props;
    const { page, sort } = this.state;

    const query: JsonApiQuerySpec = { path, filter, include, page, sort };

    return (
      <Query<TData, MetaWithTotal> query={query}>
        {({ loading, response }) => {
          let numberOfPages: number = undefined;
          if (response && response.meta && response.meta.totalResourceCount) {
            numberOfPages = Math.ceil(
              response.meta.totalResourceCount / query.page.limit
            );
          }

          return (
            <ReactTable
              columns={this.mappedColumns}
              data={response && response.data}
              defaultPageSize={query.page.limit}
              loading={loading}
              manual={true}
              onFetchData={this.onFetchData}
              pages={numberOfPages}
            />
          );
        }}
      </Query>
    );
  }
}
