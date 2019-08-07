import { Field } from "formik";
import { KitsuResource } from "kitsu";
import { noop } from "lodash";
import { useState } from "react";

interface CheckBoxFieldProps<TData extends KitsuResource> {
  resource: TData;
}

export function useGroupedCheckBoxes<TData extends KitsuResource>() {
  const [availableItems, setAvailableItems] = useState<TData[]>([]);
  const [lastCheckedItem, setLastCheckedItem] = useState<TData>();

  function CheckBoxField({ resource }: CheckBoxFieldProps<TData>) {
    const fieldName = `checkedIds[${resource.id}]`;

    return (
      <Field name={fieldName}>
        {({ field: { value }, form: { setFieldValue, setFieldTouched } }) => {
          function onCheckBoxClick(e) {
            setFieldValue(fieldName, e.target.checked);
            setFieldTouched(fieldName);
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
                setFieldValue(`checkedIds[${item.id}]`, checked);
              }
            }
            setLastCheckedItem(resource);
          }

          return (
            <input
              checked={value}
              onClick={onCheckBoxClick}
              onChange={noop}
              style={{ height: "20px", width: "20px" }}
              type="checkbox"
              value={value}
            />
          );
        }}
      </Field>
    );
  }

  return { CheckBoxField, setAvailableItems };
}
