import {
  DateField,
  DinaFormSection,
  filterBy,
  NumberField,
  ResourceSelectField,
  TextField,
  CheckBoxField
} from "common-ui";
import { connect, FormikContextType, Field } from "formik";
import { PersistedResource } from "kitsu";
import { get } from "lodash";
import {
  GeoReferenceAssertion,
  GeoreferenceVerificationStatus
} from "../../types/collection-api/resources/GeoReferenceAssertion";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { Person } from "../../types/agent-api/resources/Person";
import { useState } from "react";

export interface GeoReferenceAssertionRowProps {
  index: number;
  viewOnly?: boolean;
  assertion: GeoReferenceAssertion;
  openAddPersonModal?: () => Promise<PersistedResource<Person> | undefined>;
}

export function GeoReferenceAssertionRow({
  index,
  viewOnly,
  assertion,
  openAddPersonModal
}: GeoReferenceAssertionRowProps) {
  const { formatMessage } = useDinaIntl();
  const [georeferenceDisabled, setGeoreferenceDisabled] = useState(
    assertion?.dwcGeoreferenceVerificationStatus ===
      GeoreferenceVerificationStatus.GEOREFERENCING_NOT_POSSIBLE
  );

  function onGeoReferencingImpossibleCheckBoxClick(
    event,
    formik: FormikContextType<{}>
  ) {
    // On checked, set 3 fields editable, rest readonly; unchecked, all fields editable
    const name = `geoReferenceAssertions[${index}].dwcGeoreferenceVerificationStatus`;
    if (event.target.checked === true) {
      formik.setFieldValue?.(
        `geoReferenceAssertions[${index}].dwcDecimalLatitude`,
        null
      );
      formik.setFieldValue?.(
        `geoReferenceAssertions[${index}].dwcDecimalLongitude`,
        null
      );
      formik.setFieldValue?.(
        `geoReferenceAssertions[${index}].dwcCoordinateUncertaintyInMeters`,
        null
      );
      formik.setFieldValue?.(
        `geoReferenceAssertions[${index}].dwcGeodeticDatum`,
        null
      );
      formik.setFieldValue(
        `geoReferenceAssertions[${index}].dwcGeoreferenceProtocol`,
        null
      );
      formik.setFieldValue(
        `geoReferenceAssertions[${index}].dwcGeoreferenceSources`,
        null
      );
      formik.setFieldValue(
        name,
        GeoreferenceVerificationStatus.GEOREFERENCING_NOT_POSSIBLE
      );
      setGeoreferenceDisabled(true);
    } else {
      formik.setFieldValue(
        `geoReferenceAssertions[${index}].dwcDecimalLatitude`,
        undefined
      );
      formik.setFieldValue(
        `geoReferenceAssertions[${index}].dwcDecimalLongitude`,
        undefined
      );
      formik.setFieldValue(
        `geoReferenceAssertions[${index}].dwcCoordinateUncertaintyInMeters`,
        undefined
      );
      formik.setFieldValue(
        `geoReferenceAssertions[${index}].dwcGeodeticDatum`,
        undefined
      );
      formik.setFieldValue(
        `geoReferenceAssertions[${index}].dwcGeoreferenceProtocol`,
        undefined
      );
      formik.setFieldValue(
        `geoReferenceAssertions[${index}].dwcGeoreferenceSources`,
        undefined
      );
      formik.setFieldValue(name, null);
      setGeoreferenceDisabled(false);
    }
  }

  return (
    <div>
      <DinaFormSection horizontal={true}>
        {viewOnly && (
          <ViewInMapButton assertionPath={`geoReferenceAssertions.${index}`} />
        )}
        <Field
          name={`geoReferenceAssertions[${index}].dwcGeoreferenceVerificationStatus`}
        >
          {() => (
            <CheckBoxField
              name={`geoReferenceAssertions[${index}].dwcGeoreferenceVerificationStatus`}
              onCheckBoxClick={onGeoReferencingImpossibleCheckBoxClick}
              disabled={viewOnly}
              customName="dwcGeoreferenceVerificationStatus"
            />
          )}
        </Field>
        <NumberField
          name={`geoReferenceAssertions[${index}].dwcDecimalLatitude`}
          label={formatMessage("decimalLatitude")}
          className={"dwcDecimalLatitude"}
          // Can be null or a valid latitude number:
          isAllowed={({ floatValue: val }) => isValidLatitudeOrBlank(val)}
          readOnly={georeferenceDisabled}
        />
        <NumberField
          name={`geoReferenceAssertions[${index}].dwcDecimalLongitude`}
          label={formatMessage("decimalLongitude")}
          readOnly={georeferenceDisabled}
          className={"dwcDecimalLongitude"}
          // Can be null or a valid longitude number:
          isAllowed={({ floatValue: val }) => isValidLongitudeOrBlank(val)}
        />
        <NumberField
          name={`geoReferenceAssertions[${index}].dwcCoordinateUncertaintyInMeters`}
          label={formatMessage("coordinateUncertaintyInMeters")}
          readOnly={georeferenceDisabled}
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
          readOnly={georeferenceDisabled}
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
          readOnly={georeferenceDisabled}
        />
        <TextField
          name={`geoReferenceAssertions[${index}].dwcGeoreferenceSources`}
          className={"dwcGeoreferenceSources"}
          customName={"dwcGeoreferenceSources"}
          readOnly={georeferenceDisabled}
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
