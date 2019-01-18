import { KitsuResource } from "kitsu";
import React from "react";
import ReactTable, { Column } from "react-table";
import "react-table/react-table.css";
import titleCase from "title-case";
import { MetaWithTotal } from "../../types/seqdb-api/meta";
import { JsonApiQuerySpec, Query } from "../api-client/Query";

interface QueryTableProps {
  initialQuery: JsonApiQuerySpec;
  columns: string[];
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

    const { initialQuery } = props;

    // Set defaults for page limit and offset if they are not defined.
    const { limit = DEFAULT_PAGE_SIZE, offset = 0 } = initialQuery.page || {};

    this.state = {
      query: {
        ...initialQuery,
        page: { limit, offset }
      }
    };
  }

  onFetchData = reactTableState => {
    const { query } = this.state;
    const { page: pageNumber, sorted, pageSize } = reactTableState;

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
      Header: titleCase(column),
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
            />
          );
        }}
      </Query>
    );
  }
}
