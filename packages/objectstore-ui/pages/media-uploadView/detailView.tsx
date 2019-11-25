import { ApiClientContext, LoadingSpinner, Query } from "common-ui";
import { GetParams } from "kitsu";
import { omitBy } from "lodash";
import withRouter, { WithRouterProps } from "next/dist/client/with-router";
import { useCallback, useContext } from "react";
import { useAsyncRun, useAsyncTask } from "react-hooks-async";
import { FileDownLoadResponseAttributes } from "types/objectstore-api/resources/FileDownLoadResponse";
import { isArray, isUndefined } from "util";
import { Head, Nav } from "../../components";
// import { Metadata } from "types/objectstore-api/resources/Metadata";
import ViewMetadataFormPage from "../../page-fragments/viewMetadata";

interface DownloadFileResponse {
  error?: string;
  loading?: boolean;
  imgResponse: FileDownLoadResponseAttributes;
}
function useImageQuery(id: string): DownloadFileResponse {
  const { apiClient } = useContext(ApiClientContext);

  // Memoize the callback. Only re-create it when the query spec changes.
  const fetchData = useCallback(() => {
    const getParams = omitBy<GetParams>({}, isUndefined);

    const downloadResponse = apiClient.axios.get(
      "/v1/file/mybucket/" + id,
      getParams
    );
    return downloadResponse;
  }, [id]);

  // fetchData function should re-run when the query spec changes.
  const task = useAsyncTask(fetchData);
  useAsyncRun(task);

  return {
    error: task.error ? task.error.message : "",
    imgResponse: task.result
      ? {
          body: task.result.data,
          headers: task.result.headers,
          status: task.result.status
        }
      : null,
    loading: !!task.pending
  };
}

export function ObjectStoreDetailsPage({ router }: WithRouterProps) {
  const id = router.query.id;
  const stringId = isArray(id) ? id[0] : id;
  const { imgResponse } = useImageQuery(stringId);

  return (
    <div>
      <Head title="Object Store Detailes Page" />
      <Nav />
      <div className="container-fluid">
        <h4>Object Store Details</h4>
        {imgResponse &&
        imgResponse.headers["content-type"].indexOf("image") > -1 ? (
          <div className="row">
            <img
              src={`/api/v1/file/mybucket/${id}`}
              style={{ width: 400, height: "80%" }}
            />
          </div>
        ) : imgResponse &&
          imgResponse.headers["content-type"].indexOf("pdf") > -1 ? (
          <div className="row">
            <img
              src={`https://upload.wikimedia.org/wikipedia/commons/8/87/PDF_file_icon.svg`}
              style={{ width: 400, height: "80%" }}
            />
          </div>
        ) : imgResponse &&
          imgResponse.headers["content-type"].indexOf("/msword") > -1 ? (
          <div className="row">
            <img
              src={`https://cdn2.iconfinder.com/data/icons/flat-file-types-1-1/300/icon_file-DOC_plano-512.png`}
              style={{ width: 400, height: "80%" }}
            />
          </div>
        ) : imgResponse ? (
          <div className="row">
            <img
              src={`https://ya-webdesign.com/transparent250_/files-icon-png.png`}
              style={{ width: 400, height: "80%" }}
            />
          </div>
        ) : (
          <p>No File to display</p>
        )}
      </div>
      <Query
        query={{
          filter: { fileIdentifier: `${id}` },
          include: "acMetadataCreator,managedAttribute",
          path: "metadata/"
        }}
      >
        {({ loading, response }) => (
          <div>
            <LoadingSpinner loading={loading} />
            {response && <ViewMetadataFormPage metadata={response.data[0]} />}
          </div>
        )}
      </Query>
    </div>
  );
}

export default withRouter(ObjectStoreDetailsPage);
