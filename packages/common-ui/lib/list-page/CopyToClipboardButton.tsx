import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";
import React from "react";
import { Button } from "react-bootstrap";
import { FaCheck, FaCopy } from "react-icons/fa";

interface CopyToClipboardButtonProps {
  // Callback function to handle copying URL with query filters to clipboard
  onCopyToClipboard?: () => Promise<void>;

  copiedToClipboard?: boolean;
}

function CopyToClipboardButton({
  copiedToClipboard,
  onCopyToClipboard
}: CopyToClipboardButtonProps) {
  return (
    <Button onClick={onCopyToClipboard} className="me-2">
      <DinaMessage id="generateURLButtonText" />{" "}
      {copiedToClipboard ? (
        <FaCheck style={{ marginBottom: "4px" }} />
      ) : (
        <FaCopy style={{ marginBottom: "4px" }} />
      )}
    </Button>
  );
}

export default CopyToClipboardButton;
