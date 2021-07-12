import { connect, Field } from "formik";
import { KitsuResource } from "kitsu";
import { noop, toPairs } from "lodash";
import { useRef, useState } from "react";
import { CommonMessage } from "../intl/common-ui-intl";
import { Tooltip } from "../tooltip/Tooltip";

export interface CheckBoxFieldProps<TData extends KitsuResource> {
  resource: TData;
}

export interface GroupedCheckBoxesParams {
  fieldName: string;
  detachTotalSelected?: boolean;
}

export function useGroupedCheckBoxes<TData extends KitsuResource>({
  fieldName,
  detachTotalSelected
}: GroupedCheckBoxesParams) {
  const [availableItems, setAvailableItems] = useState<TData[]>([]);
  const lastCheckedItemRef = useRef<TData>();

  function CheckBoxField({ resource }: CheckBoxFieldProps<TData>) {
    const thisBoxFieldName = `${fieldName}[${resource.id}]`;

    return (
      <Field name={thisBoxFieldName}>
        {({ field: { value }, form: { setFieldValue, setFieldTouched } }) => {
          function onCheckBoxClick(e) {
            setFieldValue(thisBoxFieldName, e.target.checked);
            setFieldTouched(thisBoxFieldName);

            if (lastCheckedItemRef.current && e.shiftKey) {
              const checked: boolean = (e.target as any).checked;

              const currentIndex = availableItems.indexOf(resource);
              const lastIndex = availableItems.indexOf(
                lastCheckedItemRef.current
              );

              const [lowIndex, highIndex] = [currentIndex, lastIndex].sort(
                (a, b) => a - b
              );

              const itemsToToggle = availableItems.slice(
                lowIndex,
                highIndex + 1
              );

              for (const item of itemsToToggle) {
                setFieldValue(`${fieldName}[${item.id}]`, checked);
              }
            }
            lastCheckedItemRef.current = resource;
          }

          return (
            <div className="d-flex">
              <div className="mx-auto">
                <input
                  aria-label="Select"
                  checked={value || false}
                  onClick={onCheckBoxClick}
                  onChange={noop}
                  style={{
                    display: "block",
                    height: "20px",
                    width: "20px"
                  }}
                  type="checkbox"
                  value={value || false}
                />
              </div>
            </div>
          );
        }}
      </Field>
    );
  }

  const CheckAllCheckBox = connect(({ formik: { setFieldValue } }) => {
    function onCheckAllCheckBoxClick(e) {
      const { checked } = e.target;

      for (const item of availableItems) {
        setFieldValue(`${fieldName}[${item.id}]`, checked || undefined);
      }
    }

    return (
      <input
        aria-label="Check All"
        className="check-all-checkbox"
        onClick={onCheckAllCheckBoxClick}
        style={{ height: "20px", width: "20px", marginLeft: "5px" }}
        type="checkbox"
      />
    );
  });

  /** Table column header with a CheckAllCheckBox for the QueryTable. */
  const CheckBoxHeader = connect(({ formik: { values } }) => {
    const totalChecked = toPairs(values[fieldName]).filter(
      pair => pair[1]
    ).length;
    return (
      <div className="grouped-checkbox-header text-center">
        <div>
          <CommonMessage id="select" /> <CheckAllCheckBox />
          <Tooltip id="checkAllTooltipMessage" />
          {!detachTotalSelected && (
            <div>
              ({totalChecked} <CommonMessage id="selected" />)
            </div>
          )}
        </div>
      </div>
    );
  });

  const DetachedTotalSelected = connect(({ formik: { values } }) => {
    const totalChecked = toPairs(values[fieldName]).filter(
      pair => pair[1]
    ).length;
    return (
      <div>
        {totalChecked} <CommonMessage id="selected" />
      </div>
    );
  });

  return {
    CheckAllCheckBox,
    CheckBoxField,
    CheckBoxHeader,
    setAvailableItems,
    DetachedTotalSelected
  };
}
