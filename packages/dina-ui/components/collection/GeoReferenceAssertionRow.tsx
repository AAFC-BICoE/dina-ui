import {
  DateField,
  NumberField,
  FieldView,
  TextField,
  filterBy,
  ResourceSelectField
} from "common-ui";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { connect } from "formik";
import { get } from "lodash";
import { Person } from "../../types/agent-api/resources/Person";
import { PersistedResource } from "kitsu";

export interface GeoReferenceAssertionRowProps {
  index: number;
  viewOnly?: boolean;
  openAddPersonModal?: () => Promise<PersistedResource<Person> | undefined>;
}

export function GeoReferenceAssertionRow({
  index,
  viewOnly,
  openAddPersonModal
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
              <FieldView
                name={`geoReferenceAssertions[${index}].dwcGeodeticDatum`}
                className={"dwcGeodeticDatum"}
                customName={"dwcGeodeticDatum"}
              />
            </div>
            <div className="col-md-6">
              <FieldView
                name={`geoReferenceAssertions[${index}].literalGeoreferencedBy`}
                className={"literalGeoreferencedBy"}
                label={formatMessage("literalGeoreferencedByLabel")}
              />
              <FieldView
                name={`geoReferenceAssertions[${index}].georeferencedBy`}
                className={"georeferencedBy"}
                label={formatMessage("georeferencedByLabel")}
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
              // Can be null or a valid latitude number:
              isAllowed={({ floatValue: val }) => isValidLatitudeOrBlank(val)}
            />
            <NumberField
              name={`geoReferenceAssertions[${index}].dwcDecimalLongitude`}
              label={formatMessage("decimalLongitude")}
              readOnly={viewOnly}
              className={"dwcDecimalLongitude"}
              // Can be null or a valid longitude number:
              isAllowed={({ floatValue: val }) => isValidLongitudeOrBlank(val)}
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
            <TextField
              name={`geoReferenceAssertions[${index}].dwcGeodeticDatum`}
              className={"dwcGeodeticDatum"}
              customName="dwcGeodeticDatum"
            />
          </div>

          <div className="col-md-6">
            <TextField
              name={`geoReferenceAssertions[${index}].literalGeoreferencedBy`}
              className={"literalGeoreferencedBy"}
              label={formatMessage("literalGeoreferencedByLabel")}
            />

            <ResourceSelectField<Person>
              name={`geoReferenceAssertions[${index}].georeferencedBy`}
              label={formatMessage("georeferencedByLabel")}
              filter={filterBy(["displayName"])}
              model="agent-api/person"
              optionLabel={person => person.displayName}
              isMulti={true}
              asyncOptions={[
                {
                  label: <DinaMessage id="addNewPerson" />,
                  getResource: openAddPersonModal as any
                }
              ]}
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

export function isValidLatitudeOrBlank(val?: number) {
  return !val || (val >= -90 && val <= 90);
}

export function isValidLongitudeOrBlank(val?: number) {
  return !val || (val >= -180 && val <= 180);
}
