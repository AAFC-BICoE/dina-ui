import { KitsuResource } from "kitsu";
import React from "react";
import ReactTable, { Column } from "react-table";
import "react-table/react-table.css";
import { JsonApiQuerySpec, Query } from "../api-client/Query";

interface QueryTableProps {
  initialQuery: JsonApiQuerySpec;
  columns: string[];
  pageSize?: number;
}

interface QueryTableState {
  query: JsonApiQuerySpec;
}

const DEFAULT_PAGE_LIMIT = 25;

export class QueryTable<TData extends KitsuResource[]> extends React.Component<
  QueryTableProps,
  QueryTableState
> {
  constructor(props: QueryTableProps) {
    super(props);

    this.state = {
      query: {
        ...props.initialQuery,
        page: { limit: DEFAULT_PAGE_LIMIT, offset: 0 }
      }
    };
  }

  get mappedColumns(): Column[] {
    return this.props.columns.map<Column>(column => ({
      Header: column,
      accessor: column
    }));
  }

  render() {
    const { query } = this.state;

    return (
      <Query<TData> query={query}>
        {({ loading, response }) => (
            <ReactTable
              columns={this.mappedColumns}
              data={response && response.data}
              defaultPageSize={query.page.limit}
              loading={loading}
              manual={true}
              showPageSizeOptions={false}
            />
          )
        }
      </Query>
    );
  }
}
