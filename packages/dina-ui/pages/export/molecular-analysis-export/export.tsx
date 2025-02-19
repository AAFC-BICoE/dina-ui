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
  TextField
} from "common-ui";
import { useSessionStorage } from "usehooks-ts";
import { useState } from "react";
import PageLayout from "packages/dina-ui/components/page/PageLayout";
import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";
import { useIntl } from "react-intl";
import { useRouter } from "next/router";
import Link from "next/link";
import { Card, Spinner } from "react-bootstrap";

export default function ExportMolecularAnalysisPage() {
  const { formatNumber } = useIntl();
  const router = useRouter();

  // Determines where the back button should link to.
  const entityLink = String(router.query.entityLink);

  // ElasticSearch query to be used to perform the export against.
  const [queryObject] = useLocalStorage<object>(DATA_EXPORT_QUERY_KEY);

  // The total number of results that will be exported.
  const [totalRecords] = useSessionStorage<number>(
    DATA_EXPORT_TOTAL_RECORDS_KEY,
    0
  );

  const [dataExportError, setDataExportError] = useState<JSX.Element>();
  const [loading, setLoading] = useState(false);

  async function exportData(formik) {
    setLoading(true);

    // Clear error message.
    setDataExportError(undefined);

    // Prepare the query to be used for exporting purposes.
    if (queryObject) {
      delete (queryObject as any)._source;
    }
    const queryString = JSON.stringify(queryObject)?.replace(/"/g, '"');
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
              <div className="row"></div>
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
