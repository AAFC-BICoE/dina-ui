import { useIntl } from "react-intl";
import { useApiClient } from "../api-client/ApiClientContext";
import { DinaForm } from "../formik-connected/DinaForm";
import { SubmitButton } from "../formik-connected/SubmitButton";
import { QueryBuilder } from "../query-builder/QueryBuilder";
import { transformQueryToDSL } from "../util/transformToDSL";

export function QueryPage({ indexName }) {
  const { apiClient } = useApiClient();
  const { formatMessage } = useIntl();

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
    return searchES(queryDSL);
  };

  return (
    <DinaForm initialValues={{}} onSubmit={onSubmit}>
      <QueryBuilder indexName={indexName} />
      <SubmitButton className="ms-auto">
        {" "}
        {formatMessage({ id: "search" })}
      </SubmitButton>
    </DinaForm>
  );
}
