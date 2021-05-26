import {
  CheckBoxField,
  DateField,
  DinaFormSection,
  filterBy,
  FormikButton,
  ResourceSelectField,
  TextField,
  Tooltip
} from "common-ui";
import { connect, Field, FormikContextType } from "formik";
import { PersistedResource } from "kitsu";
import { get } from "lodash";
import { useRef, useState } from "react";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { Person } from "../../types/agent-api/resources/Person";
import {
  GeoReferenceAssertion,
  GeoreferenceVerificationStatus
} from "../../types/collection-api/resources/GeoReferenceAssertion";

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

  const reservedAssertion = useRef({ ...assertion });

  const assertionsPath = "geoReferenceAssertions";
  const assertionPath = `${assertionsPath}[${index}]`;
  const commonRoot = assertionPath + ".";

  function updateReservedAssertion(
    _,
    fieldName: string,
    fieldValue: string | number | null
  ) {
    if (fieldValue !== null)
      reservedAssertion.current[fieldName.replace(commonRoot, "")] = fieldValue;
  }

  function onGeoReferencingImpossibleCheckBoxClick(
    event,
    formik: FormikContextType<{}>
  ) {
    // On checked, set 3 fields editable, rest readonly; unchecked, all fields editable
    const name = commonRoot + "dwcGeoreferenceVerificationStatus";
    const dwcDecimalLatitude = commonRoot + "dwcDecimalLatitude";
    const dwcDecimalLongitude = commonRoot + "dwcDecimalLongitude";
    const dwcCoordinateUncertaintyInMeters =
      commonRoot + "dwcCoordinateUncertaintyInMeters";
    const dwcGeodeticDatum = commonRoot + "dwcGeodeticDatum";
    const dwcGeoreferenceProtocol = commonRoot + "dwcGeoreferenceProtocol";
    const dwcGeoreferenceSources = commonRoot + "dwcGeoreferenceSources";
    if (event.target.checked === true) {
      // setFieldTouched is needed for any fields that previously has no value
      // but need to appear as readOnly after checkbox checked. To do this, needs
      // to simulate the field value is actually changed to trigger
      // the effect of feild properly set as readOnly
      formik.setFieldValue(dwcDecimalLatitude, null);
      formik.setFieldTouched(dwcDecimalLatitude);
      formik.setFieldValue(dwcDecimalLongitude, null);
      formik.setFieldTouched(dwcDecimalLongitude);
      formik.setFieldValue(dwcCoordinateUncertaintyInMeters, null);
      formik.setFieldValue(dwcGeodeticDatum, null);
      formik.setFieldTouched(dwcGeodeticDatum);
      formik.setFieldValue(dwcGeoreferenceProtocol, null);
      formik.setFieldTouched(dwcGeoreferenceProtocol);
      formik.setFieldValue(dwcGeoreferenceSources, null);
      formik.setFieldTouched(dwcGeoreferenceSources);
      formik.setFieldValue(
        name,
        GeoreferenceVerificationStatus.GEOREFERENCING_NOT_POSSIBLE
      );
      setGeoreferenceDisabled(true);
    } else {
      formik.setFieldValue(
        dwcDecimalLatitude,
        reservedAssertion.current?.dwcDecimalLatitude ?? undefined
      );
      formik.setFieldValue(
        dwcDecimalLongitude,
        reservedAssertion.current?.dwcDecimalLongitude ?? undefined
      );
      formik.setFieldValue(
        dwcCoordinateUncertaintyInMeters,
        reservedAssertion.current?.dwcCoordinateUncertaintyInMeters ?? undefined
      );
      formik.setFieldValue(
        dwcGeodeticDatum,
        reservedAssertion.current?.dwcGeodeticDatum ?? undefined
      );
      formik.setFieldValue(
        dwcGeoreferenceProtocol,
        reservedAssertion.current?.dwcGeoreferenceProtocol ?? undefined
      );
      formik.setFieldValue(
        dwcGeoreferenceSources,
        reservedAssertion.current?.dwcGeoreferenceSources ?? undefined
      );
      formik.setFieldValue(name, null);
      setGeoreferenceDisabled(false);
    }
  }

  /** Make this Assertion the Primary. */
  function makePrimary(formik: FormikContextType<any>) {
    const assertions: GeoReferenceAssertion[] =
      get(formik.values, assertionsPath) ?? [];

    assertions.forEach((_, idx) => {
      formik.setFieldValue(`${assertionsPath}[${idx}].isPrimary`, false);
    });
    formik.setFieldValue(`${assertionsPath}[${index}].isPrimary`, true);
  }

  return (
    <div>
      <DinaFormSection horizontal={true}>
        {viewOnly && (
          <ViewInMapButton assertionPath={`geoReferenceAssertions.${index}`} />
        )}
        {!viewOnly && (
          <div className="mb-3">
            <FormikButton
              className="btn btn-primary primary-assertion-button"
              buttonProps={ctx => {
                const isPrimary =
                  get(ctx.values, commonRoot + "isPrimary") ?? false;
                return {
                  disabled: isPrimary,
                  children: isPrimary ? (
                    <DinaMessage id="primary" />
                  ) : (
                    <DinaMessage id="makePrimary" />
                  )
                };
              }}
              onClick={(_, formik) => makePrimary(formik)}
            />
            <Tooltip id="primaryButton_tooltip" />
          </div>
        )}
        <Field name={commonRoot + "dwcGeoreferenceVerificationStatus"}>
          {() => (
            <CheckBoxField
              name={commonRoot + "dwcGeoreferenceVerificationStatus"}
              onCheckBoxClick={onGeoReferencingImpossibleCheckBoxClick}
              disabled={viewOnly}
              customName="dwcGeoreferenceVerificationStatus"
              type={viewOnly && !georeferenceDisabled ? "hidden" : "checkbox"}
              hideLabel={viewOnly && !georeferenceDisabled ? true : false}
            />
          )}
        </Field>
        <TextField
          name={commonRoot + "dwcDecimalLatitude"}
          label={formatMessage("field_dwcDecimalLatitude")}
          className={"dwcDecimalLatitude"}
          readOnly={georeferenceDisabled}
          onChangeExternal={updateReservedAssertion}
        />
        <TextField
          name={commonRoot + "dwcDecimalLongitude"}
          label={formatMessage("field_dwcDecimalLongitude")}
          readOnly={georeferenceDisabled}
          className={"dwcDecimalLongitude"}
          onChangeExternal={updateReservedAssertion}
        />
        <TextField
          name={commonRoot + "dwcCoordinateUncertaintyInMeters"}
          label={formatMessage("field_dwcCoordinateUncertaintyInMeters")}
          readOnly={georeferenceDisabled}
          className={"dwcCoordinateUncertaintyInMeters"}
          onChangeExternal={updateReservedAssertion}
        />
        <DateField
          name={commonRoot + "dwcGeoreferencedDate"}
          className={"dwcGeoreferencedDate"}
          label={formatMessage("georeferencedDateLabel")}
        />
        <TextField
          name={commonRoot + "dwcGeodeticDatum"}
          className={"dwcGeodeticDatum"}
          customName="dwcGeodeticDatum"
          readOnly={georeferenceDisabled}
          onChangeExternal={updateReservedAssertion}
        />
        <TextField
          name={commonRoot + "literalGeoreferencedBy"}
          className={"literalGeoreferencedBy"}
          label={formatMessage("literalGeoreferencedByLabel")}
        />
        <ResourceSelectField<Person>
          name={commonRoot + "georeferencedBy"}
          readOnlyLink="/person/view?id="
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
          name={commonRoot + "dwcGeoreferenceProtocol"}
          className={"dwcGeoreferenceProtocol"}
          customName={"dwcGeoreferenceProtocol"}
          readOnly={georeferenceDisabled}
          onChangeExternal={updateReservedAssertion}
        />
        <TextField
          name={commonRoot + "dwcGeoreferenceSources"}
          className={"dwcGeoreferenceSources"}
          customName={"dwcGeoreferenceSources"}
          readOnly={georeferenceDisabled}
          onChangeExternal={updateReservedAssertion}
        />
        <TextField
          name={commonRoot + "dwcGeoreferenceRemarks"}
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
      <div className="mb-3">
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
