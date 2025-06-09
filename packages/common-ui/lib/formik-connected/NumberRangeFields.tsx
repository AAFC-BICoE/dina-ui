import { useFormikContext } from "formik";
import _ from "lodash";
import { useIntl } from "react-intl";
import { CommonMessage, Tooltip } from "..";
import { useDinaFormContext } from "./DinaForm";
import { MetersField } from "./MetersField";
import { useMemo } from "react";

export interface NumberRangeFieldsProps {
  /** Min and max field names. */
  names: [string, string];
  labelMsg: JSX.Element;
}

export function NumberRangeFields({
  names: [minName, maxName],
  labelMsg
}: NumberRangeFieldsProps) {
  const { formatMessage } = useIntl();
  const { readOnly, isTemplate, formTemplate, componentName, sectionName } =
    useDinaFormContext();

  /** Whether this field should be hidden because the template doesn't specify that it should be shown. */
  const disabledByFormTemplate: {
    minNameVisible: boolean;
    maxNameVisible: boolean;
  } = useMemo(() => {
    if (isTemplate) {
      return { minNameVisible: true, maxNameVisible: true };
    }
    if (!formTemplate || !componentName || !sectionName) {
      return { minNameVisible: false, maxNameVisible: false };
    }
    // First find the component we are looking for.
    const componentFound = _.find(formTemplate?.components, {
      name: componentName
    });
    if (componentFound) {
      // Next find the right section.
      const sectionFound = _.find(componentFound?.sections, {
        name: sectionName
      });
      if (sectionFound) {
        const minNameVisible =
          _.find(sectionFound.items, { name: minName })?.visible ?? false;
        const maxNameVisible =
          _.find(sectionFound.items, { name: maxName })?.visible ?? false;
        return { minNameVisible, maxNameVisible };
      }
    }
    return { minNameVisible: false, maxNameVisible: false };
  }, [formTemplate]);

  if (
    !disabledByFormTemplate.maxNameVisible &&
    !disabledByFormTemplate.minNameVisible
  ) {
    return null;
  }

  const { values } = useFormikContext<any>();

  const minVal = values[minName];
  const maxVal = values[maxName];

  const bothAreDefined = !_.isNil(minVal) && !_.isNil(maxVal);
  const neitherAreDefined = _.isNil(minVal) && _.isNil(maxVal);

  return (
    <label className="w-100">
      <div className="mb-2">
        <strong>{labelMsg}</strong>
        <Tooltip id="metersField_tooltip" />
      </div>
      <div className="mb-3" style={{ minHeight: "25px" }}>
        {readOnly ? (
          bothAreDefined ? (
            <span>
              {minVal}–{maxVal}m
            </span>
          ) : neitherAreDefined ? null : (
            <span>{minVal ?? maxVal ?? ""}m</span>
          )
        ) : (
          <div className="d-flex align-items-center">
            <MetersField
              removeLabel={true}
              removeBottomMargin={true}
              name={minName}
              className="flex-grow-1"
              placeholder={formatMessage({ id: "min" })}
            />
            {disabledByFormTemplate.maxNameVisible && (
              <>
                <span className="mx-3">
                  <CommonMessage id="to" />
                </span>
                <MetersField
                  removeLabel={true}
                  removeBottomMargin={true}
                  name={maxName}
                  className="flex-grow-1"
                  placeholder={formatMessage({ id: "max" })}
                />
              </>
            )}
          </div>
        )}
      </div>
    </label>
  );
}
