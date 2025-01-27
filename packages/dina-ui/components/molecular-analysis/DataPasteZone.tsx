import React from "react";
import { FieldHeader } from "packages/common-ui/lib";
interface DataPasteZoneProps {
  onDataPaste: (event: React.ClipboardEvent<HTMLTextAreaElement>) => void;
}

export default function DataPasteZone({ onDataPaste }: DataPasteZoneProps) {
  return (
    <div style={{ width: "100%", padding: "1.25rem", boxSizing: "border-box" }}>
      <strong>
        <FieldHeader name={"dataPasteZone"} />
      </strong>
      <textarea
        placeholder="Paste your data here (e.g., copied from Excel)"
        onPaste={onDataPaste}
        style={{
          width: "100%",
          height: "6.25rem",
          marginBottom: "1.25rem",
          padding: "0.625rem",
          borderRadius: "0.3125rem",
          border: "0.0625rem solid #ccc",
          fontSize: "1rem",
          resize: "none"
        }}
      />
    </div>
  );
}
