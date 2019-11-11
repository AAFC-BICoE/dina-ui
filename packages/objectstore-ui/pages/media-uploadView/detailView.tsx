import { ApiClientContext } from "common-ui";
import { GetParams } from "kitsu";
import { omitBy } from "lodash";
import withRouter, { WithRouterProps } from "next/dist/client/with-router";
import { useCallback, useContext } from "react";
import { useAsyncRun, useAsyncTask } from "react-hooks-async";
import { FileDownLoadResponseAttributes } from "types/objectstore-api/resources/FileDownLoadResponse";
import { isArray, isUndefined } from "util";
import { Head, Nav } from "../../components";

interface DownloadFileResponse {
  error?: string;
  loading?: boolean;
  response: FileDownLoadResponseAttributes;
}
function useImageQuery(id: string): DownloadFileResponse {
  const { apiClient } = useContext(ApiClientContext);

  // Memoize the callback. Only re-create it when the query spec changes.
  const fetchData = useCallback(() => {
    // Omit undefined values from the GET params, which would otherwise cause an invalid request.
    // e.g. /api/region?fields=undefined
    const getParams = omitBy<GetParams>({}, isUndefined);

    const request = apiClient.axios.get("/v1/file/mybucket/" + id, getParams);
    return request;
  }, [id]);

  // fetchData function should re-run when the query spec changes.
  const task = useAsyncTask(fetchData);
  useAsyncRun(task);

  return {
    error: task.error ? task.error.message : "",
    loading: !!task.pending,
    response: task.result ? task.result.data : undefined
  };
}

export function ObjectStoreDetailsPage({ router }: WithRouterProps) {
  const id = router.query.id;
  const { error, loading, response } = useImageQuery(isArray(id) ? id[0] : id);
  return (
    <div>
      <Head title="Object Store Detailes Page" />
      <Nav />
      <div className="container-fluid">
        <h4>Object Store Details</h4>
        {error.length === 0 &&
          !loading &&
          response &&
          response.status === "200" && (
            <div className="row">
              <img src="${response.body}" />
            </div>
          )}
      </div>
    </div>
  );
}

export default withRouter(ObjectStoreDetailsPage);
