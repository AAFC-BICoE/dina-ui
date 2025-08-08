import {
  ListPageLayout,
  ColumnDefinition,
  dateCell,
  useApiClient,
  LoadingSpinner,
  DinaForm,
  BulkDeleteButton
} from "..";
import { DataExport } from "../../../dina-ui/types/dina-export-api";
import { Button } from "react-bootstrap";
import { useState } from "react";
import { useIntl } from "react-intl";
import { downloadDataExport } from "../export/exportUtils";

export interface DataExportListPageLayoutProps {
  username: string | undefined;
}
export function DataExportListPageLayout({
  username
}: DataExportListPageLayoutProps) {
  const { formatMessage } = useIntl();
  const [loading, setLoading] = useState(false);
  const [timestamp, setTimestamp] = useState(Date.now()); // Initial timestamp
  const { apiClient } = useApiClient();
  const handleRefresh = () => {
    // When the button is clicked, update the timestamp to trigger the useEffect.
    setTimestamp(Date.now());
  };
  const TABLE_COLUMNS: ColumnDefinition<DataExport>[] = [
    "id",
    "name",
    "status",
    "createdBy",
    dateCell("createdOn"),
    "exportType",
    {
      id: "download",
      cell: ({ row: { original } }) => {
        return (
          <Button
            disabled={loading || original?.status !== "COMPLETED"}
            className="btn btn-primary mt-2 bulk-edit-button"
            onClick={async () => {
              setLoading(true);
              await downloadDataExport(apiClient, original, original?.name);
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
    <DinaForm initialValues={{}}>
      {" "}
      <ListPageLayout
        bulkDeleteButtonProps={{
          typeName: "data-export",
          apiBaseUrl: "/dina-export-api"
        }}
        additionalFilters={{ createdBy: username || "" }}
        id="data-export-list"
        queryTableProps={{
          columns: TABLE_COLUMNS,
          path: `dina-export-api/data-export/`,
          topRightCorner: (
            <div className="d-flex gap-3">
              {
                <Button
                  disabled={loading}
                  className="btn btn-primary bulk-edit-button"
                  onClick={handleRefresh}
                >
                  {loading ? (
                    <LoadingSpinner loading={loading} />
                  ) : (
                    formatMessage({ id: "refreshButtonText" })
                  )}
                </Button>
              }
              {
                <BulkDeleteButton
                  typeName="data-export"
                  apiBaseUrl="/dina-export-api"
                />
              }
            </div>
          ),
          deps: [timestamp]
        }}
      />
    </DinaForm>
  );
}
