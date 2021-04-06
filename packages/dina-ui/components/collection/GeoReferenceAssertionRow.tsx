import {
  DateField,
  DinaFormSection,
  filterBy,
  NumberField,
  ResourceSelectField,
  TextField
} from "common-ui";
import { connect } from "formik";
import { PersistedResource } from "kitsu";
import { get } from "lodash";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { Person } from "../../types/agent-api/resources/Person";

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
      <DinaFormSection horizontal={true}>
        {viewOnly && (
          <ViewInMapButton assertionPath={`geoReferenceAssertions.${index}`} />
        )}
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
        <TextField
          name={`geoReferenceAssertions[${index}].literalGeoreferencedBy`}
          className={"literalGeoreferencedBy"}
          label={formatMessage("literalGeoreferencedByLabel")}
        />
        <ResourceSelectField<Person>
          name={`geoReferenceAssertions[${index}].georeferencedBy`}
          arrayItemLink="/person/view?id="
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
          multiLines={true}
          className={"dwcGeoreferenceRemarks"}
          customName={"dwcGeoreferenceRemarks"}
        />
      </DinaFormSection>
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
