import { Notification } from "../types";
import { Button } from "react-bootstrap";
import { FaDownload, FaFileExcel } from "react-icons/fa";
import { useQuery } from "../../api-client/useQuery";
import { DataExport } from "packages/dina-ui/types/dina-export-api/resources/DataExport";
import { LoadingSpinner } from "../../loading-spinner/LoadingSpinner";
import { downloadDataExport, useApiClient } from "../..";
import { ObjectExport } from "packages/dina-ui/types/objectstore-api";
import { FaFileZipper } from "react-icons/fa6";
import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";

export const NOTIFICATION_TYPE_DATA_EXPORT_READY = "DATA_EXPORT_READY";
export const NOTIFICATION_TYPE_OBJECT_EXPORT_READY = "OBJECT_EXPORT_READY";

interface ExportReadyNotificationProps {
  notification: Notification;

  /**
   * Can the user see the notification currently or is it out of view?
   * This is used to determine whether to trigger the data export API call to fetch export details.
   */
  isVisible?: boolean;
}

export function ExportReadyNotification({
  notification,
  isVisible
}: ExportReadyNotificationProps) {
  const { apiClient } = useApiClient();
  const id = notification.notificationParams?.id;
  const { loading, error, response } = useQuery<DataExport>(
    {
      path: `dina-export-api/data-export/${id}`,
      fields: {
        "data-export": "name,createdOn,exportOptions,exportType"
      }
    },
    {
      disabled: !id || !isVisible
    }
  );

  if (loading) {
    return <LoadingSpinner loading={true} />;
  }

  // Sanity check: Make sure we have the necessary notification params to fetch the export
  if (!id) {
    return (
      <div className="alert alert-danger">
        Missing export ID in notification parameters.
      </div>
    );
  }

  // Sanity check: Ensure the notification type is correct
  if (
    notification.type !== NOTIFICATION_TYPE_DATA_EXPORT_READY &&
    notification.type !== NOTIFICATION_TYPE_OBJECT_EXPORT_READY
  ) {
    return (
      <div className="alert alert-danger">
        Invalid notification type for DataExportReadyNotification.
      </div>
    );
  }

  if (error) {
    console.error("Error fetching data export details: ", error);
    return (
      <div className="alert alert-danger">
        <DinaMessage id="errorFetchingExport" />
      </div>
    );
  }

  const exportName =
    response?.data?.name || response?.data?.createdOn || "Exported Data";

  const handleDownload = () => {
    downloadDataExport(
      apiClient,
      response?.data as DataExport | ObjectExport,
      exportName
    );
  };

  return (
    <div className="d-flex align-items-center justify-content-between gap-3 p-2">
      {/* Export file info */}
      <div className="d-flex align-items-center gap-2 text-truncate">
        {notification.type === NOTIFICATION_TYPE_DATA_EXPORT_READY ? (
          <FaFileExcel className="text-success flex-shrink-0" />
        ) : (
          <FaFileZipper className="text-primary flex-shrink-0" />
        )}
        <span className="text-truncate small fw-semibold">{exportName}</span>
      </div>

      {/* Download button */}
      <Button
        variant="primary"
        size="sm"
        className="d-flex align-items-center gap-1 flex-shrink-0"
        onClick={handleDownload}
      >
        <FaDownload />
        <DinaMessage id="downloadFile" />
      </Button>
    </div>
  );
}
