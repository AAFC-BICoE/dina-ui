import { FormattedMessage } from "react-intl";
import type { GeoPosition } from "packages/dina-ui/types/geo/geo.types";

type Props = {
  mapRef: React.MutableRefObject<HTMLDivElement | null>;
  buttons?: ("save" | "erase")[];
  coordinates?: GeoPosition[][];
  handleSave?: () => void;
  handleErase?: () => void;
};

export default function GeometryMapEditor({
  mapRef,
  buttons,
  coordinates,
  handleSave,
  handleErase
}: Props) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#1e1e1e",
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
          background: "#2a2a2a"
        }}
      >
        {buttons && (
          <button
            onClick={handleSave}
            disabled={!coordinates}
            style={{
              padding: "8px 16px",
              background: coordinates ? "#007ac2" : "#444",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: coordinates ? "pointer" : "not-allowed"
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
              background: "#555",
              color: "white",
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
            background: "#444",
            color: "white",
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
