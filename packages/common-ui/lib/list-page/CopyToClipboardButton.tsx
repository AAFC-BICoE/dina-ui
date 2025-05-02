import { useDinaIntl } from "packages/dina-ui/intl/dina-ui-intl";
import React from "react";

function CopyToClipboardButton() {
  const textToCopy = "Hello, world!";
  const { formatMessage } = useDinaIntl();

  const handleCopyClick = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      alert("Copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button onClick={handleCopyClick}>
      {formatMessage("generateURLButtonText")}
    </button>
  );
}

export default CopyToClipboardButton;
