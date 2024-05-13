import { FieldSpy, useBulkEditTabContext } from "common-ui";
import Switch from "react-switch";

/** Adds an initial parentAttributes if there isn't one already. */

export function ShowParentAttributesSwitch(props) {
  const bulkTabCtx = useBulkEditTabContext();

  return (
    <FieldSpy<string[]> fieldName="parentAttributes">
      {(parentAttributes, { form: { setFieldValue } }) => (
        <Switch
          {...props}
          onChange={(newVal) => {
            props.onChange?.(newVal);
            if (!bulkTabCtx && newVal && !parentAttributes?.length) {
              setFieldValue("parentAttributes", []);
            }
          }}
        />
      )}
    </FieldSpy>
  );
}
