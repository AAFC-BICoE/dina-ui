import { connect, Field } from "formik";
import { KitsuResource } from "kitsu";
import { noop, toPairs } from "lodash";
import { useRef, useState } from "react";
import ReactTooltip from "react-tooltip";

interface CheckBoxFieldProps<TData extends KitsuResource> {
  resource: TData;
}

interface GroupedCheckBoxesParams {
  fieldName: string;
}

const CHECK_ALL_TOOLTIP_MESSAGE =
  "Check this header box to check all visible items in this page.";

export function useGroupedCheckBoxes<TData extends KitsuResource>({
  fieldName
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
            <input
              checked={value || false}
              onClick={onCheckBoxClick}
              onChange={noop}
              style={{ height: "20px", width: "20px" }}
              type="checkbox"
              value={value || false}
            />
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
        className="check-all-checkbox"
        onClick={onCheckAllCheckBoxClick}
        style={{ height: "20px", width: "20px" }}
        type="checkbox"
      />
    );
  });

  /** Table column header with a CheckAllCheckBox for the QueryTable. */
  const CheckBoxHeader = connect(({ formik: { values } }) => {
    const totalChecked = toPairs(values[fieldName]).filter(pair => pair[1])
      .length;

    return (
      <div>
        Select <CheckAllCheckBox />
        <img
          src="/static/images/iconInformation.gif"
          data-tip={true}
          data-for={CHECK_ALL_TOOLTIP_MESSAGE}
        />
        <ReactTooltip id={CHECK_ALL_TOOLTIP_MESSAGE}>
          <span>{CHECK_ALL_TOOLTIP_MESSAGE}</span>
        </ReactTooltip>
        <div>({totalChecked} selected)</div>
      </div>
    );
  });

  return { CheckAllCheckBox, CheckBoxField, CheckBoxHeader, setAvailableItems };
}
