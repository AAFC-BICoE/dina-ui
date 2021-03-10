import { DateField, NumberField, FieldView, TextField } from "common-ui";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { connect } from "formik";
import { get } from "lodash";

export interface GeoReferenceAssertionRowProps {
  index: number;
  viewOnly?: boolean;
}

export function GeoReferenceAssertionRow({
  index,
  viewOnly
}: GeoReferenceAssertionRowProps) {
  const { formatMessage } = useDinaIntl();
  return (
    <div>
      {viewOnly ? (
        <div>
          <ViewInMapButton assertionPath={`geoReferenceAssertions.${index}`} />
          <div className="row">
            <div className="col-md-6">
              <FieldView
                name={`geoReferenceAssertions[${index}].dwcDecimalLatitude`}
                label={formatMessage("decimalLatitude")}
                className={"dwcDecimalLatitude"}
              />
              <FieldView
                name={`geoReferenceAssertions[${index}].dwcDecimalLongitude`}
                label={formatMessage("decimalLongitude")}
                className={"dwcDecimalLongitude"}
              />
              <FieldView
                name={`geoReferenceAssertions[${index}].dwcCoordinateUncertaintyInMeters`}
                label={formatMessage("coordinateUncertaintyInMeters")}
                className={"dwcCoordinateUncertaintyInMeters"}
              />
              <FieldView
                name={`geoReferenceAssertions[${index}].dwcGeoreferencedDate`}
                className={"dwcGeoreferencedDate"}
                label={formatMessage("georeferencedDateLabel")}
              />
            </div>
            <div className="col-md-6">
              <FieldView
                name={`geoReferenceAssertions[${index}].literalGeoreferencedBy`}
                className={"literalGeoreferencedBy"}
                label={formatMessage("literalGeoreferencedByLabel")}
              />
              <FieldView
                name={`geoReferenceAssertions[${index}].dwcGeoreferenceProtocol`}
                className={"dwcGeoreferenceProtocol"}
                customName={"dwcGeoreferenceProtocol"}
              />
              <FieldView
                name={`geoReferenceAssertions[${index}].dwcGeoreferenceSources`}
                className={"dwcGeoreferenceSources"}
                customName={"dwcGeoreferenceSources"}
              />
              <FieldView
                name={`geoReferenceAssertions[${index}].dwcGeoreferenceRemarks`}
                className={"dwcGeoreferenceRemarks"}
                customName={"dwcGeoreferenceRemarks"}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="row">
          <div className="col-md-6">
            <NumberField
              name={`geoReferenceAssertions[${index}].dwcDecimalLatitude`}
              label={formatMessage("decimalLatitude")}
              className={"dwcDecimalLatitude"}
            />
            <NumberField
              name={`geoReferenceAssertions[${index}].dwcDecimalLongitude`}
              label={formatMessage("decimalLongitude")}
              readOnly={viewOnly}
              className={"dwcDecimalLongitude"}
            />
            <NumberField
              name={`geoReferenceAssertions[${index}].dwcCoordinateUncertaintyInMeters`}
              label={formatMessage("coordinateUncertaintyInMeters")}
              readOnly={viewOnly}
              className={"dwcCoordinateUncertaintyInMeters"}
            />
            <DateField
              name={`geoReferenceAssertions[${index}].dwcGeoreferencedDate`}
              className={"dwcGeoreferencedDate"}
              label={formatMessage("georeferencedDateLabel")}
            />
          </div>

          <div className="col-md-6">
            <TextField
              name={`geoReferenceAssertions[${index}].literalGeoreferencedBy`}
              className={"literalGeoreferencedBy"}
              label={formatMessage("literalGeoreferencedByLabel")}
            />
            <TextField
              name={`geoReferenceAssertions[${index}].dwcGeoreferenceProtocol`}
              className={"dwcGeoreferenceProtocol"}
              customName={"dwcGeoreferenceProtocol"}
            />
            <TextField
              name={`geoReferenceAssertions[${index}].dwcGeoreferenceSources`}
              className={"dwcGeoreferenceSources"}
              customName={"dwcGeoreferenceSources"}
            />
            <TextField
              name={`geoReferenceAssertions[${index}].dwcGeoreferenceRemarks`}
              className={"dwcGeoreferenceRemarks"}
              customName={"dwcGeoreferenceRemarks"}
            />
          </div>
        </div>
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
