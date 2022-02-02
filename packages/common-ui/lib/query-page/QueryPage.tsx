import { KitsuResource } from "kitsu";
import { useState } from "react";
import { useIntl } from "react-intl";
import ReactTable, { Column } from "react-table";
import { useApiClient } from "../api-client/ApiClientContext";
import { FieldHeader } from "../field-header/FieldHeader";
import { DinaForm } from "../formik-connected/DinaForm";
import { SubmitButton } from "../formik-connected/SubmitButton";
import { QueryBuilder } from "../query-builder/QueryBuilder";
import { ColumnDefinition } from "../table/QueryTable";
import { transformQueryToDSL } from "../util/transformToDSL";

export interface QueryPageProps<TData extends KitsuResource> {
  columns: ColumnDefinition<TData>[];
  indexName: string;
  initData?: TData[];
}
export function QueryPage<TData extends KitsuResource>({
  indexName,
  columns,
  initData
}: QueryPageProps<TData>) {
  const { apiClient } = useApiClient();
  const { formatMessage } = useIntl();
  const [searchResults, setSearchResults] = useState<TData[]>();

  async function searchES(queryDSL) {
    const query = { ...queryDSL };
    const resp = await apiClient.axios.get(`es/${indexName}/_search`, {
      params: {
        source: query,
        source_content_type: "application/json"
      }
    });
    return resp?.data?.hits.hits.map(hit => hit._source?.data);
  }

  const onSubmit = ({ submittedValues }) => {
    const queryDSL = transformQueryToDSL(submittedValues.queryRows);
    searchES(queryDSL).then(data => {
      setSearchResults(data);
    });
  };

  const mappedColumns = columns.map<Column>(column => {
    // The "columns" prop can be a string or a react-table Column type.
    const { fieldName, customHeader } =
      typeof column === "string"
        ? {
            customHeader: undefined,
            fieldName: column
          }
        : {
            customHeader: column.Header,
            fieldName: String(column.accessor)
          };

    const Header = customHeader ?? <FieldHeader name={fieldName} />;

    return {
      Header,
      ...(typeof column === "string" ? { accessor: column } : { ...column })
    };
  });

  return (
    <DinaForm initialValues={{ queryRows: [{}] }} onSubmit={onSubmit}>
      <QueryBuilder indexName={indexName} name="queryRows" />
      <SubmitButton className="ms-auto">
        {formatMessage({ id: "search" })}
      </SubmitButton>
      <div className="d-flex mt-1">{`Total records: ${searchResults?.length}`}</div>
      <ReactTable
        className="-striped"
        columns={mappedColumns}
        data={searchResults ?? initData}
        minRows={1}
      />
    </DinaForm>
  );
}
