import { TextField } from "common-ui";
import { GeoReferenceAssertion } from "packages/dina-ui/types/collection-api/resources/GeoReferenceAssertion";

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
  return (
    <div className="list-inline">
      <TextField name={`geoReferenceAssertions[${index}].dwcDecimalLatitude`} />
      <TextField
        name={`geoReferenceAssertions[${index}].dwcDecimalLongitude`}
      />
      <TextField
        name={`geoReferenceAssertions[${index}].dwcCoordinateUncertaintyInMeters`}
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
