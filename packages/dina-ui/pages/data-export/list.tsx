import {
  useAccount,
  ListPageLayout,
  ColumnDefinition,
  dateCell,
  useApiClient,
  LoadingSpinner,
  downloadDataExport,
  BackButton
} from "../../../common-ui/lib";
import PageLayout from "../../components/page/PageLayout";
import { DataExport } from "packages/dina-ui/types/dina-export-api";
import { Button } from "react-bootstrap";
import { useState } from "react";
import { useIntl } from "react-intl";
import { useRouter } from "next/router";

export default function DataExportListPage() {
  const { username } = useAccount();
  const { apiClient } = useApiClient();
  const { formatMessage } = useIntl();
  const [loading, setLoading] = useState(false);
  const [timestamp, setTimestamp] = useState(Date.now()); // Initial timestamp
  const router = useRouter();
  const entityLink = String(router.query.entityLink);

  const handleRefresh = () => {
    // When the button is clicked, update the timestamp to trigger the useEffect.
    setTimestamp(Date.now());
  };
  const TABLE_COLUMNS: ColumnDefinition<DataExport>[] = [
    "id",
    "status",
    "createdBy",
    dateCell("createdOn"),
    {
      id: "download",
      cell: ({ row: { original } }) => {
        return (
          <Button
            disabled={loading || original?.status !== "COMPLETED"}
            className="btn btn-primary mt-2 bulk-edit-button"
            onClick={async () => {
              setLoading(true);
              await downloadDataExport(apiClient, original?.id);
              setLoading(false);
            }}
          >
            {loading ? (
              <LoadingSpinner loading={loading} />
            ) : (
              formatMessage({ id: "field_downloadExport" })
            )}
          </Button>
        );
      },
      header: ""
    }
  ];
  return (
    <PageLayout
      titleId="dataExports"
      buttonBarContent={<BackButton entityLink={entityLink} />}
    >
      <ListPageLayout
        additionalFilters={{
          rsql: `createdBy==${username}`
        }}
        id="data-export-list"
        queryTableProps={{
          columns: TABLE_COLUMNS,
          path: `dina-export-api/data-export/`,
          topRightCorner: (
            <Button
              disabled={loading}
              className="btn btn-primary mt-2 bulk-edit-button"
              onClick={handleRefresh}
            >
              {loading ? (
                <LoadingSpinner loading={loading} />
              ) : (
                formatMessage({ id: "refreshButtonText" })
              )}
            </Button>
          ),
          deps: [timestamp]
        }}
      />
    </PageLayout>
  );
}
