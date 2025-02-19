/* eslint-disable @typescript-eslint/no-unused-vars */
import useLocalStorage from "@rehooks/local-storage";
import {
  BackButton,
  CheckBoxField,
  CommonMessage,
  DATA_EXPORT_QUERY_KEY,
  DATA_EXPORT_TOTAL_RECORDS_KEY,
  DinaForm,
  SubmitButton,
  TextField,
  useApiClient
} from "common-ui";
import { useSessionStorage } from "usehooks-ts";
import { useEffect, useState } from "react";
import PageLayout from "packages/dina-ui/components/page/PageLayout";
import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";
import { useIntl } from "react-intl";
import { useRouter } from "next/router";
import Link from "next/link";
import { Card, Spinner } from "react-bootstrap";
import {
  applySourceFilteringString,
  processResults
} from "common-ui/lib/list-page/query-builder/query-builder-elastic-search/QueryBuilderElasticSearchExport";

export default function ExportMolecularAnalysisPage() {
  const { formatNumber } = useIntl();
  const { apiClient } = useApiClient();
  const router = useRouter();

  // Determines where the back button should link to.
  const entityLink = String(router.query.entityLink);

  // ElasticSearch index name to be used for the export.
  const indexName = "dina_material_sample_index";

  // ElasticSearch query to be used to perform the export against.
  const [queryObject] = useLocalStorage<object>(DATA_EXPORT_QUERY_KEY);

  // The total number of results that will be exported.
  const [totalRecords] = useSessionStorage<number>(
    DATA_EXPORT_TOTAL_RECORDS_KEY,
    0
  );

  // Run summaries loaded in from the elastic search query.
  const [runSummaries, setRunSummaries] = useState<any[]>([]);

  const [dataExportError, setDataExportError] = useState<JSX.Element>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!queryObject) {
      router.push("/export/data-export/list");
    }

    retrieveRunItems();
  }, [queryObject]);

  async function retrieveRunItems() {
    setLoading(true);

    // Retrieve the run items based on the query object.
    let queryDSL = queryObject;
    queryDSL = applySourceFilteringString(queryDSL, [
      "included.id",
      "included.type",
      "included.attributes"
    ]);

    elasticSearchRequest(queryDSL)
      .then((result) => {
        const results = result?.hits.map((rslt) => {
          return {
            // Only include run-summary type includes.
            included: rslt._source?.included?.filter(
              (item) => item.type === "run-summary"
            )
          };
        });

        // Retrieve all of the run-summary includes
        const uniqueRunSummaries: any[] = [];
        results.forEach((result) => {
          if (result.included) {
            result.included.forEach((included) => {
              // Check if it's been already added by the id, only display unique run summaries.
              if (uniqueRunSummaries.find((r) => r.id === included.id)) {
                return;
              }

              uniqueRunSummaries.push(included);
            });
          }
        });

        setRunSummaries(uniqueRunSummaries);
      })
      .catch((elasticSearchError) => {
        // Todo - add error handling.
        console.error(elasticSearchError);
      })
      .finally(() => {
        // No matter the end result, loading should stop.
        setLoading(false);
      });
  }

  async function exportData(formik) {
    setLoading(true);

    // Clear error message.
    setDataExportError(undefined);

    // Prepare the query to be used for exporting purposes.
    if (queryObject) {
      delete (queryObject as any)._source;
    }
    const queryString = JSON.stringify(queryObject)?.replace(/"/g, '"');

    // Retrieve options from the formik form.
    const { name, includeQualityControls } = formik.values;
  }

  /**
   * Asynchronous POST request for elastic search. Used to retrieve elastic search results against
   * the indexName in the prop.
   *
   * @param queryDSL query containing filters and pagination.
   * @returns Elastic search response.
   */
  async function elasticSearchRequest(queryDSL) {
    const query = { ...queryDSL };
    const resp = await apiClient.axios.post(
      `search-api/search-ws/search`,
      query,
      {
        params: {
          indexName
        }
      }
    );
    return resp?.data?.hits;
  }

  const LoadingSpinner = (
    <>
      <Spinner
        as="span"
        animation="border"
        size="sm"
        role="status"
        aria-hidden="true"
      />
      <span className="visually-hidden">
        <DinaMessage id="loadingSpinner" />
      </span>
    </>
  );

  return (
    <PageLayout
      titleId="molecularAnalysisExport"
      buttonBarContent={
        <>
          <div className="col-md-6 col-sm-12 mt-2">
            <BackButton
              className="me-auto"
              entityLink={entityLink}
              byPassView={true}
            />
          </div>
          <div className="col-md-6 col-sm-12 d-flex">
            <Link href={`/export/data-export/list?entityLink=${entityLink}`}>
              <a className="btn btn-primary ms-auto">
                <DinaMessage id="viewExportHistoryButton" />
              </a>
            </Link>
          </div>
        </>
      }
    >
      <DinaForm initialValues={{}}>
        {dataExportError}

        <CommonMessage
          id="tableTotalCount"
          values={{ totalCount: formatNumber(totalRecords ?? 0) }}
        />

        <div className="col-md-12">
          <h4 className="mt-3">
            <DinaMessage id="runItemSelection" />
          </h4>
          <Card>
            <Card.Body>
              <div className="row">
                {loading ? (
                  LoadingSpinner
                ) : (
                  <>
                    {runSummaries.map((runSummary, index) => {
                      // console.log(runSummary);
                      return (
                        <div key={index}>
                          <h5>{runSummary?.attributes?.name}</h5>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </Card.Body>
          </Card>
        </div>

        <div className="col-md-12">
          <h4 className="mt-3">
            <DinaMessage id="settingLabel" />
          </h4>
          <Card>
            <Card.Body>
              <div className="row">
                <div className="col-md-4">
                  <TextField
                    name={"name"}
                    customName="exportName"
                    disabled={loading}
                  />
                </div>
                <div className="col-md-4">
                  <CheckBoxField
                    name="includeQualityControls"
                    overridecheckboxProps={{
                      style: {
                        height: "30px",
                        width: "30px"
                      }
                    }}
                  />
                </div>
                <div className="col-md-4">
                  <CheckBoxField
                    name="createFoldersForBlankRunItems"
                    overridecheckboxProps={{
                      style: {
                        height: "30px",
                        width: "30px"
                      }
                    }}
                  />
                </div>
              </div>
            </Card.Body>
            <Card.Footer className="d-flex">
              <div className="me-auto">
                <SubmitButton
                  buttonProps={(formik) => ({
                    style: { width: "8rem" },
                    disabled: loading,
                    onClick: () => {
                      exportData(formik);
                    }
                  })}
                >
                  {loading ? (
                    LoadingSpinner
                  ) : (
                    <DinaMessage id="exportButtonText" />
                  )}
                </SubmitButton>
              </div>
            </Card.Footer>
          </Card>
        </div>
      </DinaForm>
    </PageLayout>
  );
}
