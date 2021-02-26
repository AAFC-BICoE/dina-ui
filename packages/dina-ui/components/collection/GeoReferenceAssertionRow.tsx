import { TextField, FieldView } from "common-ui";
import { useDinaIntl } from "../../intl/dina-ui-intl";
import { GeoReferenceAssertion } from "../../types/collection-api/resources/GeoReferenceAssertion";

export interface GeoReferenceAssertionRowProps {
  index: number;
  assertion?: GeoReferenceAssertion;
  onAddClick?: () => void;
  onRemoveClick?: () => void;
  viewOnly?: boolean;
}

export function GeoReferenceAssertionRow({
  index,
  onAddClick,
  onRemoveClick,
  viewOnly
}: GeoReferenceAssertionRowProps) {
  const { formatMessage } = useDinaIntl();
  return (
    <div className="list-inline">
      <TextField
        name={`geoReferenceAssertions[${index}].dwcDecimalLatitude`}
        label={formatMessage("decimalLatitudedLabel")}
        readOnly={viewOnly}
        className={"dwcDecimalLatitude"}
      />
      <TextField
        name={`geoReferenceAssertions[${index}].dwcDecimalLongitude`}
        label={formatMessage("decimalLongitudeLabel")}
        readOnly={viewOnly}
        className={"dwcDecimalLongitude"}
      />
      <TextField
        name={`geoReferenceAssertions[${index}].dwcCoordinateUncertaintyInMeters`}
        label={formatMessage("coordinateUncertaintyInMetersLabel")}
        readOnly={viewOnly}
        className={"dwcCoordinateUncertaintyInMeters"}
      />
      {!viewOnly && (
        <>
          <div className="list-inline-item d-none">
            <button
              className="btn btn-primary add-assertion-button"
              type="button"
              onClick={onAddClick}
            >
              +
            </button>
          </div>
          <div className="list-inline-item d-none">
            <button
              className="btn btn-primary"
              type="button"
              onClick={onRemoveClick}
            >
              -
            </button>
          </div>{" "}
        </>
      )}
    </div>
  );
}
