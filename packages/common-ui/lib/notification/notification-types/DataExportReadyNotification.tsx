import { Notification } from "../types";
import { Button } from "react-bootstrap";
import { FaFileExport, FaDownload } from "react-icons/fa";

export const NOTIFICATION_TYPE_DATA_EXPORT_READY = "DATA_EXPORT_READY";

interface DataExportReadyNotificationProps {
  notification: Notification;
}

export function DataExportReadyNotification({
  notification
}: DataExportReadyNotificationProps) {
  const exportName =
    "Sample Export " + new Date(notification.createdOn).toLocaleDateString();
  const handleDownload = () => {
    console.warn("Downloading export...", notification.id);
  };

  return (
    <div className="d-flex align-items-center justify-content-between gap-3 p-2">
      {/* Export file info */}
      <div className="d-flex align-items-center gap-2 text-truncate">
        <FaFileExport className="text-primary flex-shrink-0" />
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
        Download
      </Button>
    </div>
  );
}
