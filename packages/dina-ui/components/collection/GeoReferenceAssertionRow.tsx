import { NumberField } from "common-ui";
import { connect } from "formik";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { GeoReferenceAssertion } from "../../types/collection-api/resources/GeoReferenceAssertion";
import { get } from "lodash";

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
    <div>
      {viewOnly && (
        <ViewInMapButton assertionPath={`geoReferenceAssertions.${index}`} />
      )}
      <NumberField
        name={`geoReferenceAssertions[${index}].dwcDecimalLatitude`}
        label={formatMessage("decimalLatitudedLabel")}
        readOnly={viewOnly}
        className={"dwcDecimalLatitude"}
      />
      <NumberField
        name={`geoReferenceAssertions[${index}].dwcDecimalLongitude`}
        label={formatMessage("decimalLongitudeLabel")}
        readOnly={viewOnly}
        className={"dwcDecimalLongitude"}
      />
      <NumberField
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

export const ViewInMapButton = connect<{ assertionPath: string }>(
  ({ assertionPath, formik: { values } }) => {
    const { dwcDecimalLatitude: lat, dwcDecimalLongitude: lon } = get(
      values,
      assertionPath
    );

    const showButton = typeof lat === "number" && typeof lon === "number";

    return showButton ? (
      <div className="form-group">
        <a
          href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}`}
          target="_blank"
          className="btn btn-info"
        >
          <DinaMessage id="viewOnMap" />
        </a>
      </div>
    ) : null;
  }
);
