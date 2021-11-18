import { CheckBoxWithoutWrapper, useDinaFormContext } from "common-ui";
import { Field } from "formik";
import { clamp } from "lodash";
import { ChangeEvent, useRef } from "react";
import { GeoReferenceAssertionRow } from ".";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import {
  CollectingEvent,
  GeoReferenceAssertion
} from "../../types/collection-api";
import { TabbedArrayField } from "./TabbedArrayField";

export function GeoReferenceAssertionField({
  onChangeTabIndex
}: {
  onChangeTabIndex: (newIndex: number) => void;
}) {
  const { isTemplate, initialValues } = useDinaFormContext();
  const { formatMessage } = useDinaIntl();
  const wrapperRef = useRef<HTMLDivElement>(null);

  function onClickIncludeAll(
    e: ChangeEvent<HTMLInputElement>,
    form,
    id: string
  ) {
    wrapperRef.current
      ?.querySelectorAll(`#${id} .templateCheckBox`)
      ?.forEach(field => {
        // tslint:disable-next-line
        form.setFieldValue(field.attributes["name"]?.value, e.target.checked);
      });
  }

  // Open the tab with the Primary geoassertion even if it's not the first one.
  // Defaults to 0 if there's no primary assertion.
  const intialPrimaryAssertionIndex = clamp(
    (
      initialValues as Partial<CollectingEvent>
    ).geoReferenceAssertions?.findIndex(assertion => assertion?.isPrimary) ?? 0,
    0,
    Infinity
  );

  return (
    <div ref={wrapperRef}>
      <TabbedArrayField<GeoReferenceAssertion>
        className="non-strip"
        typeName={formatMessage("geoReferenceAssertion")}
        legend={<DinaMessage id="geoReferencingLegend" />}
        renderAboveTabs={() =>
          isTemplate && (
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
          )
        }
        makeNewElement={({ length }) => ({ isPrimary: length === 0 })}
        name="geoReferenceAssertions"
        sectionId="georeference-assertion-section"
        initialIndex={intialPrimaryAssertionIndex}
        onChangeTabIndex={onChangeTabIndex}
        renderTab={(assertion, index) => (
          <span className="m-3">
            {index + 1}
            {assertion.isPrimary && ` (${formatMessage("primary")})`}
          </span>
        )}
        renderTabPanel={({ elements, index }) => (
          <GeoReferenceAssertionRow assertion={elements[index]} index={index} />
        )}
      />
    </div>
  );
}
