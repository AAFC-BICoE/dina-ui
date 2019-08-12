import { Field } from "formik";
import { KitsuResource } from "kitsu";
import { noop } from "lodash";
import { useState } from "react";

interface CheckBoxFieldProps<TData extends KitsuResource> {
  resource: TData;
}

interface GroupedCheckBoxesParams {
  fieldName: string;
}

export function useGroupedCheckBoxes<TData extends KitsuResource>({
  fieldName
}: GroupedCheckBoxesParams) {
  const [availableItems, setAvailableItems] = useState<TData[]>([]);
  const [lastCheckedItem, setLastCheckedItem] = useState<TData>();

  function CheckBoxField({ resource }: CheckBoxFieldProps<TData>) {
    const thisBoxFieldName = `${fieldName}[${resource.id}]`;

    return (
      <Field name={thisBoxFieldName}>
        {({ field: { value }, form: { setFieldValue, setFieldTouched } }) => {
          function onCheckBoxClick(e) {
            setFieldValue(thisBoxFieldName, e.target.checked);
            setFieldTouched(thisBoxFieldName);
            setLastCheckedItem(resource);

            if (lastCheckedItem && e.shiftKey) {
              const checked: boolean = (e.target as any).checked;

              const currentIndex = availableItems.indexOf(resource);
              const lastIndex = availableItems.indexOf(lastCheckedItem);

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
            setLastCheckedItem(resource);
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

  return { CheckBoxField, setAvailableItems };
}
