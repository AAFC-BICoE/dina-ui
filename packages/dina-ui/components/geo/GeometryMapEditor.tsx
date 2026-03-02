import { FormattedMessage } from "react-intl";

type Props = {
  mapRef: React.MutableRefObject<HTMLDivElement | null>;
  buttons?: ("save" | "erase")[];
  handleSave?: () => void;
  handleErase?: () => void;
};

export default function GeometryMapEditor({
  mapRef,
  buttons,
  handleSave,
  handleErase
}: Props) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#f2f2f2",
        display: "flex",
        flexDirection: "column",
        borderRadius: "8px",
        overflow: "hidden"
      }}
    >
      <div ref={mapRef} style={{ flex: 1 }} />
      <div
        style={{
          padding: "12px",
          display: "flex",
          justifyContent: "flex-end",
          gap: "10px",
          background: "#f2f2f2"
        }}
      >
        {buttons && (
          <button
            onClick={handleSave}
            style={{
              padding: "8px 16px",
              background: "#007ac2",
              color: "#ffffff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            <FormattedMessage id="save" />
          </button>
        )}
        {buttons && (
          <button
            onClick={handleErase}
            style={{
              padding: "8px 16px",
              background: "#e2574c",
              color: "#ffffff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            <FormattedMessage id="erase" />
          </button>
        )}
        <button
          onClick={() => window.close()}
          style={{
            padding: "8px 16px",
            background: "#6c757d",
            color: "#ffffff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          <FormattedMessage id="close" />
        </button>
      </div>
    </div>
  );
}
