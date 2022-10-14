import { FieldSpy, useBulkEditTabContext } from "common-ui";
import Switch from "react-switch";
import { MaterialSampleAssociation } from "../../../../types/collection-api";

/** The associations switch adds an initial association if there isn't one already. */

export function AssociationsSwitch(props) {
  const bulkTabCtx = useBulkEditTabContext();

  return (
    <FieldSpy<MaterialSampleAssociation[]> fieldName="associations">
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
