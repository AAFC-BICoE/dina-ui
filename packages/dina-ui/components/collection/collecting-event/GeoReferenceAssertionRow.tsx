import {
  DateField,
  DinaFormSection,
  FieldWrapper,
  FormikButton,
  INLINE_LABEL_WIDTH,
  TextField,
  NumberField,
  Tooltip,
  useDinaFormContext
} from "common-ui";
import { connect, FormikContextType } from "formik";
import _ from "lodash";
import { COLLECTING_EVENT_COMPONENT_NAME } from "../../../types/collection-api";
import { PersonSelectField } from "../..";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  GeoReferenceAssertion,
  GeoreferenceVerificationStatus
} from "../../../types/collection-api/resources/GeoReferenceAssertion";
import { useRef, useState } from "react";
import { FaStar, FaTrash } from "react-icons/fa";
import styles from "./GeoReferencing.module.css";

export interface GeoReferenceAssertionRowProps {
  index: number;
  assertion: GeoReferenceAssertion;
  onRemove?: () => void;
}

export function GeoReferenceAssertionRow({
  index,
  assertion,
  onRemove
}: GeoReferenceAssertionRowProps) {
  const { formatMessage } = useDinaIntl();
  const [georeferenceDisabled, setGeoreferenceDisabled] = useState(
    assertion?.dwcGeoreferenceVerificationStatus ===
      GeoreferenceVerificationStatus.GEOREFERENCING_NOT_POSSIBLE
  );

  const reservedAssertion = useRef({ ...assertion });

  const { isTemplate, readOnly } = useDinaFormContext();

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

  function setGeoreferencingNotPossible(
    notPossible: boolean,
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
    if (notPossible) {
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
      _.get(formik.values, assertionsPath) ?? [];

    assertions.forEach((_, idx) => {
      formik.setFieldValue(`${assertionsPath}[${idx}].isPrimary`, false);
    });
    formik.setFieldValue(`${assertionsPath}[${index}].isPrimary`, true);
  }

  const statusName = commonRoot + "dwcGeoreferenceVerificationStatus";
  const example = (value: string) =>
    georeferenceDisabled ? undefined : formatMessage("exampleValue", { value });

  return (
    <div>
      <DinaFormSection
        horizontal={false}
        componentName={COLLECTING_EVENT_COMPONENT_NAME}
        sectionName="georeferencing-section"
      >
        {readOnly && (
          <ViewInMapButton assertionPath={`geoReferenceAssertions.${index}`} />
        )}

        <DinaFormSection horizontal={INLINE_LABEL_WIDTH} compact={true}>
          {(!readOnly || georeferenceDisabled) && (
            <FieldWrapper
              name={statusName}
              customName="dwcGeoreferenceVerificationStatus"
              label={formatMessage("georeferencingStatus")}
              readOnlyRender={(value) =>
                formatMessage(value ? "notPossible" : "georeferenced")
              }
            >
              {({ formik }) => (
                <div className="btn-group" role="group">
                  {[false, true].map((notPossible) => (
                    <button
                      key={String(notPossible)}
                      type="button"
                      aria-pressed={georeferenceDisabled === notPossible}
                      className={`btn ${
                        georeferenceDisabled === notPossible
                          ? "btn-primary"
                          : "btn-outline-primary"
                      }`}
                      onClick={() =>
                        setGeoreferencingNotPossible(notPossible, formik)
                      }
                    >
                      {formatMessage(
                        notPossible ? "notPossible" : "georeferenced"
                      )}
                    </button>
                  ))}
                </div>
              )}
            </FieldWrapper>
          )}

          <NumberField
            name={commonRoot + "dwcDecimalLatitude"}
            customName="dwcDecimalLatitude"
            className="dwcDecimalLatitude"
            disabled={georeferenceDisabled}
            placeholder={example("45.4215")}
            unit="°"
            onChangeExternal={updateReservedAssertion}
            min={-90}
            max={90}
          />
          <NumberField
            name={commonRoot + "dwcDecimalLongitude"}
            customName="dwcDecimalLongitude"
            className="dwcDecimalLongitude"
            disabled={georeferenceDisabled}
            placeholder={example("-75.6972")}
            unit="°"
            onChangeExternal={updateReservedAssertion}
            min={-180}
            max={180}
          />
          <NumberField
            name={commonRoot + "dwcCoordinateUncertaintyInMeters"}
            tooltipLink="https://aafc-bicoe.github.io/dina-documentation/concepts-glossary/#_coordinate_uncertainty_in_meters"
            tooltipLinkText="fromDinaUserGuide"
            customName="dwcCoordinateUncertaintyInMeters"
            isInteger={true}
            disabled={georeferenceDisabled}
            unit="m"
            className="dwcCoordinateUncertaintyInMeters"
            onChangeExternal={updateReservedAssertion}
          />
          <TextField
            name={commonRoot + "dwcGeodeticDatum"}
            className="dwcGeodeticDatum"
            customName="dwcGeodeticDatum"
            disabled={georeferenceDisabled}
            placeholder={example("WGS84")}
            onChangeExternal={updateReservedAssertion}
          />

          <DateField
            name={commonRoot + "dwcGeoreferencedDate"}
            className="dwcGeoreferencedDate"
            label={formatMessage("georeferencedDateLabel")}
          />
          <TextField
            name={commonRoot + "literalGeoreferencedBy"}
            className="literalGeoreferencedBy"
            label={formatMessage("literalGeoreferencedByLabel")}
          />
          <PersonSelectField
            name={commonRoot + "georeferencedBy"}
            label={formatMessage("georeferencedByLabel")}
            isMulti={true}
          />

          <TextField
            name={commonRoot + "dwcGeoreferenceProtocol"}
            className="dwcGeoreferenceProtocol"
            customName="dwcGeoreferenceProtocol"
            disabled={georeferenceDisabled}
            onChangeExternal={updateReservedAssertion}
          />
          <TextField
            name={commonRoot + "dwcGeoreferenceSources"}
            className="dwcGeoreferenceSources"
            customName="dwcGeoreferenceSources"
            disabled={georeferenceDisabled}
            onChangeExternal={updateReservedAssertion}
          />
          <TextField
            name={commonRoot + "dwcGeoreferenceRemarks"}
            multiLines={true}
            className="dwcGeoreferenceRemarks"
            customName="dwcGeoreferenceRemarks"
          />
        </DinaFormSection>

        {!readOnly && !isTemplate && (
          <div className="d-flex align-items-center justify-content-between border-top pt-3 mt-3">
            <div className="d-flex align-items-center">
              <FormikButton
                className={`btn btn-outline-secondary primary-assertion-button ${styles.grayButton}`}
                buttonProps={(ctx) => {
                  const isPrimary =
                    _.get(ctx.values, commonRoot + "isPrimary") ?? false;
                  return {
                    disabled: isPrimary,
                    children: (
                      <>
                        <FaStar className="me-2" />
                        <DinaMessage
                          id={isPrimary ? "primary" : "makePrimary"}
                        />
                      </>
                    )
                  };
                }}
                onClick={(_, formik) => makePrimary(formik)}
              />
              <Tooltip id="primaryButton_tooltip" />
            </div>
            {onRemove && (
              <FormikButton
                className={`btn ${styles.removeButton}`}
                onClick={onRemove}
              >
                <FaTrash className="me-2" />
                <DinaMessage id="removeAssertionLabel" />
              </FormikButton>
            )}
          </div>
        )}
      </DinaFormSection>
    </div>
  );
}

export const ViewInMapButton = connect<{ assertionPath: string }>(
  ({ assertionPath, formik: { values } }) => {
    const { dwcDecimalLatitude: lat, dwcDecimalLongitude: lon } = _.get(
      values,
      assertionPath
    );

    const showButton = typeof lat === "number" && typeof lon === "number";

    return showButton ? (
      <div className="mb-3">
        <a
          href={`/collection/collecting-event/map?mlat=${lat}&mlon=${lon}`}
          className="btn btn-info"
        >
          <DinaMessage id="viewOnMap" />
        </a>
      </div>
    ) : null;
  }
);
