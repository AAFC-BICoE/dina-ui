import { TextField } from "../../../common-ui";
import { useDinaIntl } from "../../../dina-ui/intl/dina-ui-intl";
import { GeoReferenceAssertion } from "../../../dina-ui/types/collection-api/resources/GeoReferenceAssertion";

export interface GeoReferenceAssertionRowProps {
  index: number;
  assertion: GeoReferenceAssertion;
  onAddClick: () => void;
  onRemoveClick: () => void;
}

export function GeoReferenceAssertionRow({
  index,
  onAddClick,
  onRemoveClick
}: GeoReferenceAssertionRowProps) {
  const { formatMessage } = useDinaIntl();
  return (
    <div className="list-inline">
      <TextField
        name={`geoReferenceAssertions[${index}].dwcDecimalLatitude`}
        label={formatMessage("decimalLatitudedLabel")}
      />
      <TextField
        name={`geoReferenceAssertions[${index}].dwcDecimalLongitude`}
        label={formatMessage("decimalLongitudeLabel")}
      />
      <TextField
        name={`geoReferenceAssertions[${index}].dwcCoordinateUncertaintyInMeters`}
        label={formatMessage("coordinateUncertaintyInMetersLabel")}
      />
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
      </div>
    </div>
  );
}
