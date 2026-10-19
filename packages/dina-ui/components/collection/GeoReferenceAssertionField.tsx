import {
  CheckBoxWithoutWrapper,
  FieldSet,
  FormikButton,
  useDinaFormContext
} from "common-ui";
import { Field, useFormikContext } from "formik";
import _ from "lodash";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { FaPlus } from "react-icons/fa";
import { GeoReferenceAssertionRow } from "..";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import {
  CollectingEvent,
  COLLECTING_EVENT_COMPONENT_NAME,
  GeoReferenceAssertion
} from "../../types/collection-api";
import { GeoreferenceVerificationStatus } from "../../types/collection-api/resources/GeoReferenceAssertion";
import { ArrayFieldContainer } from "./ArrayFieldContainer";
import styles from "./collecting-event/GeoReferencing.module.css";

export function GeoReferenceAssertionField({
  onChangeTabIndex,
  className
}: {
  onChangeTabIndex: (newIndex: number) => void;
  className?: string;
}) {
  const { isTemplate, initialValues } = useDinaFormContext();
  const { formatMessage } = useDinaIntl();
  const { errors } = useFormikContext();
  const wrapperRef = useRef<HTMLDivElement>(null);

  function onClickIncludeAll(
    e: ChangeEvent<HTMLInputElement>,
    form,
    id: string
  ) {
    wrapperRef.current
      ?.querySelectorAll(`#${id} .templateCheckBox`)
      ?.forEach((field) => {
        form.setFieldValue(field.attributes["name"]?.value, e.target.checked);
      });
  }

  // Open the Primary geoassertion even if it's not the first one.
  // Defaults to 0 if there's no primary assertion.
  const intialPrimaryAssertionIndex = _.clamp(
    (
      initialValues as Partial<CollectingEvent>
    ).geoReferenceAssertions?.findIndex((assertion) => assertion?.isPrimary) ??
      0,
    0,
    Infinity
  );

  const [activeIndex, setActiveIndex] = useState(intialPrimaryAssertionIndex);

  useEffect(() => {
    onChangeTabIndex(activeIndex);
  }, [activeIndex]);

  /** One-line summary shown under each assertion's title. */
  function summary(assertion: GeoReferenceAssertion) {
    if (
      assertion.dwcGeoreferenceVerificationStatus ===
      GeoreferenceVerificationStatus.GEOREFERENCING_NOT_POSSIBLE
    ) {
      return formatMessage("notPossible");
    }
    const { dwcDecimalLatitude: lat, dwcDecimalLongitude: lon } = assertion;
    if (_.isNil(lat) || _.isNil(lon)) {
      return null;
    }
    const uncertainty = assertion.dwcCoordinateUncertaintyInMeters;
    return `${lat}, ${lon}${_.isNil(uncertainty) ? "" : ` ± ${uncertainty} m`}`;
  }

  return (
    <div ref={wrapperRef}>
      <FieldSet
        legend={<DinaMessage id="geoReferencingLegend" />}
        id="geoReferencingLegend"
        componentName={COLLECTING_EVENT_COMPONENT_NAME}
        sectionName="georeferencing-section"
        className={`non-strip ${className ?? ""}`}
      >
        <ArrayFieldContainer<GeoReferenceAssertion>
          className="non-strip"
          name="geoReferenceAssertions"
          sectionId="georeference-assertion-section"
          removePadding={true}
          makeNewElement={({ length }) => ({ isPrimary: length === 0 })}
          onElementAdded={setActiveIndex}
          onElementRemoved={(_index, remaining) =>
            setActiveIndex((current) =>
              _.clamp(current, 0, Math.max(remaining - 1, 0))
            )
          }
        >
          {({ elements, addElement, removeElement, readOnly }) => (
            <>
              {isTemplate && (
                <Field name="includeAllGeoReference">
                  {() => (
                    <CheckBoxWithoutWrapper
                      name="includeAllGeoReference"
                      parentContainerId="geoReferencingLegend"
                      onClickIncludeAll={onClickIncludeAll}
                      includeAllLabel={formatMessage("includeAll")}
                      customLayout={["col-sm-1", "col-sm-4"]}
                    />
                  )}
                </Field>
              )}
              <div className={styles.layout}>
                <div className={styles.assertionList}>
                  {elements.map((assertion, index) => (
                    <button
                      key={index}
                      type="button"
                      aria-pressed={index === activeIndex}
                      className={`${styles.assertionCard} ${
                        index === activeIndex ? styles.active : ""
                      }`}
                      onClick={() => setActiveIndex(index)}
                    >
                      <span className="d-flex align-items-center gap-2">
                        <strong>
                          {formatMessage("assertionNumber", {
                            number: index + 1
                          })}
                        </strong>
                        {assertion.isPrimary && (
                          <span
                            className={`badge rounded-pill ${styles.primaryBadge}`}
                          >
                            {formatMessage("primary")}
                          </span>
                        )}
                      </span>
                      <span className="d-block small text-muted">
                        {summary(assertion)}
                      </span>
                      {!_.isEmpty(
                        _.get(errors, `geoReferenceAssertions[${index}]`)
                      ) && (
                        <span className="d-block small text-danger is-invalid">
                          <DinaMessage id="hasError" />
                        </span>
                      )}
                    </button>
                  ))}
                  {!readOnly && !isTemplate && (
                    <FormikButton
                      className={`btn btn-outline-secondary ${styles.grayButton}`}
                      onClick={addElement}
                    >
                      <FaPlus className="me-2" />
                      <DinaMessage id="addAssertion" />
                    </FormikButton>
                  )}
                </div>
                <div className="flex-grow-1">
                  {elements[activeIndex] && (
                    <GeoReferenceAssertionRow
                      // Remount on switch/removal so inputs don't show stale values:
                      key={`${activeIndex}-${elements.length}`}
                      index={activeIndex}
                      assertion={elements[activeIndex]}
                      onRemove={() => removeElement(activeIndex)}
                    />
                  )}
                </div>
              </div>
            </>
          )}
        </ArrayFieldContainer>
      </FieldSet>
    </div>
  );
}
