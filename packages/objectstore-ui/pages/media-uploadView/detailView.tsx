import { ApiClientContext, LoadingSpinner, Query } from "common-ui";
import { GetParams } from "kitsu";
import { omitBy } from "lodash";
import withRouter, { WithRouterProps } from "next/dist/client/with-router";
import { useCallback, useContext } from "react";
import { useAsyncRun, useAsyncTask } from "react-hooks-async";
import { FileDownLoadResponseAttributes } from "types/objectstore-api/resources/FileDownLoadResponse";
import { Metadata } from "types/objectstore-api/resources/Metadata";
import { isArray, isUndefined } from "util";
import { Head, Nav } from "../../components";
import { GenerateManagedAttributesView } from "../../page-fragments/viewManagedAttributes";
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
      <div>
        <h4>Object Store Details</h4>
        <div className="container-fluid">
          <div className="row">
            {imgResponse &&
            imgResponse.headers["content-type"].indexOf("image") > -1 ? (
              <div className="col-sm-4">
                <img src={`/api/v1/file/mybucket/${id}`} />
              </div>
            ) : imgResponse &&
              imgResponse.headers["content-type"].indexOf("pdf") > -1 ? (
              <div className="col-sm-4">
                <img
                  src={`https://upload.wikimedia.org/wikipedia/commons/8/87/PDF_file_icon.svg`}
                  style={{ width: 400, height: "80%" }}
                />
              </div>
            ) : imgResponse &&
              imgResponse.headers["content-type"].indexOf("/msword") > -1 ? (
              <div className="col-sm-4">
                <img
                  src={`https://cdn2.iconfinder.com/data/icons/flat-file-types-1-1/300/icon_file-DOC_plano-512.png`}
                  style={{ width: 400, height: "80%" }}
                />
              </div>
            ) : imgResponse ? (
              <div className="col-sm-4">
                <img
                  src={`https://ya-webdesign.com/transparent250_/files-icon-png.png`}
                  style={{ width: 400, height: "80%" }}
                />
              </div>
            ) : (
              <p>No File to display</p>
            )}

            <Query<Metadata>
              query={{
                filter: { fileIdentifier: `${id}` },
                include: "acMetadataCreator,managedAttribute",
                path: "metadata/"
              }}
            >
              {({ loading, response }) => (
                <div className="col-sm-8">
                  <LoadingSpinner loading={loading} />
                  {response && (
                    <div>
                      <div style={{ marginBottom: "20px", marginTop: "20px" }}>
                        <h5 style={{ color: "blue" }}>Metadata View</h5>
                      </div>
                      <div>
                        <ViewMetadataFormPage metadata={response.data[0]} />
                      </div>
                      <div style={{ marginBottom: "20px", marginTop: "20px" }}>
                        <h5 style={{ color: "blue" }}>
                          Managed Attribute View
                        </h5>
                      </div>
                      {response.data[0].managedAttribute &&
                        response.data[0].managedAttribute.map(ma => (
                          <GenerateManagedAttributesView ma={ma} />
                        ))}
                    </div>
                  )}
                </div>
              )}
            </Query>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withRouter(ObjectStoreDetailsPage);
