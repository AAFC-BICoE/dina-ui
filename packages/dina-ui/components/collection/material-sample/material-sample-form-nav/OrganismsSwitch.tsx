import { FieldSpy, useBulkEditTabContext, useDinaFormContext } from "common-ui";
import Switch from "react-switch";
import { Organism } from "../../../../types/collection-api";

/** The organisms switch adds an initial organism if there isn't one already. */

export function OrganismsSwitch(props) {
  const bulkTabCtx = useBulkEditTabContext();
  const { isTemplate } = useDinaFormContext();

  return (
    <FieldSpy<Organism[]> fieldName="organism">
      {(organism, { form: { setFieldValue } }) => (
        <Switch
          {...props}
          onChange={(newVal) => {
            props.onChange?.(newVal);
            if (!bulkTabCtx && newVal && !organism?.length) {
              setFieldValue("organism", [
                isTemplate ? { determination: [{}] } : {}
              ]);
              setFieldValue("organismsQuantity", 1);
            }
          }}
        />
      )}
    </FieldSpy>
  );
}
