import { SmallSwitch, FieldSpy, useBulkEditTabContext } from "common-ui";

/** Adds an initial parentAttributes if there isn't one already. */

export function ShowParentAttributesSwitch(props) {
  const bulkTabCtx = useBulkEditTabContext();

  return (
    <FieldSpy<string[]> fieldName="parentAttributes">
      {(parentAttributes, { form: { setFieldValue } }) => (
        <SmallSwitch
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
