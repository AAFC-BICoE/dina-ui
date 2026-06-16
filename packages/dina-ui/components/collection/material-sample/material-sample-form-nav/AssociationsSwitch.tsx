import { FieldSpy, useBulkEditTabContext } from "common-ui";
import { Association } from "@dina-ui/types/collection-api/resources/Association";
import Switch from "react-switch";

/** The associations switch adds an initial association if there isn't one already. */
export function AssociationsSwitch(props) {
  const bulkTabCtx = useBulkEditTabContext();

  return (
    <FieldSpy<Association[]> fieldName="associations">
      {(associations, { form: { setFieldValue } }) => (
        <Switch
          {...props}
          onChange={(newVal) => {
            props.onChange?.(newVal);
            if (!bulkTabCtx && newVal && !associations?.length) {
              setFieldValue("associations", [{}]);
            }
          }}
        />
      )}
    </FieldSpy>
  );
}
