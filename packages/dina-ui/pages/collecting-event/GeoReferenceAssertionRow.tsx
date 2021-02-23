import { DinaForm, TextField } from "common-ui";
import { useFormikContext } from "formik";
import { GeoReferenceAssertion } from "packages/dina-ui/types/collection-api/resources/GeoReferenceAssertion";
import { DinaMessage, useDinaIntl } from "../../../../intl/dina-ui-intl";

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
      <TextField name={`geoReferenceAssertions[${index}].decimalLatitude`} />
      <TextField name={`geoReferenceAssertions[${index}].decimalLongitude`} />
      <TextField
        name={`geoReferenceAssertions[${index}].coordinateUncertaintyInMeters`}
      />
      <div className="list-inline-item">
        <button
          className="btn btn-primary add-assertion-button"
          type="button"
          onClick={onAddClick}
        >
          +
        </button>
      </div>
      <div className="list-inline-item">
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
