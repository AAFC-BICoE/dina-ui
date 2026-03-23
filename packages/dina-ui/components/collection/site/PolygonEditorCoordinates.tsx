import { useState } from "react";
import { POLYGON_EDITOR_MODE } from "packages/dina-ui/types/geo/polygon-editor-mode.types";
import { validatePolygon } from "packages/dina-ui/utils/geoUtils";
import { useDinaIntl } from "packages/dina-ui/intl/dina-ui-intl";
import type { PolygonEditorMode } from "packages/dina-ui/types/geo/polygon-editor-mode.types";
import type { GeoPosition } from "packages/dina-ui/types/geo/geo.types";

export default function PolygonEditorCoordinates({
  coords,
  mode,
  onCoordsChange
}: {
  coords: GeoPosition[][];
  mode: PolygonEditorMode;
  onCoordsChange: (coords: GeoPosition[][]) => void;
}) {
  const { formatMessage } = useDinaIntl();
  const [error, setError] = useState<string>("");

  if (mode === POLYGON_EDITOR_MODE.VIEW)
    return <div className="mb-4">{JSON.stringify(coords)}</div>;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let parsed: GeoPosition[][];
    try {
      parsed = JSON.parse(e.target.value);
    } catch (_err) {
      setError(formatMessage("invalidPolygon"));
      return;
    }

    const isValid = validatePolygon(parsed);
    if (isValid) {
      onCoordsChange(parsed);
      setError("");
    } else {
      setError(formatMessage("invalidPolygon"));
    }
  };

  return (
    <>
      {error && <p className="text-danger fw-bold">{error}</p>}
      <textarea
        onChange={handleChange}
        style={{ height: "350px" }}
        className="border mb-4 w-100"
      >
        {coords.length === 0 ? "" : JSON.stringify(coords, null, 2)}
      </textarea>
    </>
  );
}
