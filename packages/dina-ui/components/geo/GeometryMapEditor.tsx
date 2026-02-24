import { FormattedMessage } from "react-intl";

type Action = "save" | "erase";
type RequiredAction = "close";

type Props<T extends Action[] = Action[]> = {
  mapRef: React.MutableRefObject<HTMLDivElement | null>;
  buttons: [...T, RequiredAction];
} & (T extends (infer U)[]
  ? "save" extends U
    ? { handleSave: () => void; coordinates: number[][][] | null }
    : { handleSave?: never; coordinates?: never }
  : never) &
  (T extends (infer U)[]
    ? "erase" extends U
      ? { handleErase: () => void }
      : { handleErase?: never }
    : never);

export default function GeometryMapEditor<T extends Action[]>({
  mapRef,
  buttons,
  handleSave,
  coordinates,
  handleErase
}: Props<T>) {
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
        {buttons.includes("save") && (
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
        {buttons.includes("erase") && (
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
