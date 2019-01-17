import { KitsuResource } from "kitsu";
import React from "react";
import ReactTable, { Column } from "react-table";
import "react-table/react-table.css";
import { MetaWithTotal } from "../../types/seqdb-api/meta";
import { JsonApiQuerySpec, Query } from "../api-client/Query";

interface QueryTableProps {
  initialQuery: JsonApiQuerySpec;
  columns: string[];
  pageSize?: number;
}

interface QueryTableState {
  query: JsonApiQuerySpec;
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

    const { initialQuery, pageSize = DEFAULT_PAGE_SIZE } = props;

    this.state = {
      query: {
        ...initialQuery,
        page: { limit: pageSize, offset: 0 }
      }
    };
  }

  onFetchData = reactTableState => {
    const { query } = this.state;
    const { page: pageNumber, sorted } = reactTableState;

    const pageSize = query.page.limit;
    const newOffset = pageNumber * pageSize;

    const sort: string = (sorted as { desc: boolean; id: string }[])
      .map<string>(({ desc, id }) => `${desc ? "-" : ""}${id}`)
      .join();

    this.setState({
      query: {
        ...query,
        // Only add the sort attribute if there is a sort.
        ...(sort.length && { sort }),
        page: {
          limit: pageSize,
          offset: newOffset
        }
      }
    });
  };

  get mappedColumns(): Column[] {
    return this.props.columns.map<Column>(column => ({
      Header: column,
      accessor: column
    }));
  }

  render() {
    const { query } = this.state;

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
              showPageSizeOptions={false}
            />
          );
        }}
      </Query>
    );
  }
}
