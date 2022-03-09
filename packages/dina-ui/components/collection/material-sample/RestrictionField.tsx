import { FieldExtensionSelectField, FieldSet, TextField } from "common-ui";
import { DinaMessage } from "../../..//intl/dina-ui-intl";
import { MaterialSample } from "../../..//types/collection-api";

export const MATERIALSAMPLE_FIELDSET_FIELDS: (keyof MaterialSample)[] = [
  "materialSampleRemarks",
  "materialSampleState",
  "materialSampleType"
];

export function RestrictionField({ id }: { id?: string }) {
  return (
    <FieldSet id={id} legend={<DinaMessage id="materialSampleInfo" />}>
      <div className="row">
        <div className="col-md-6">
          <FieldExtensionSelectField
            name="phac_human_rg"
            query={() => ({
              path: "collection-api/extension/phac_human_rg"
            })}
          />
          <FieldExtensionSelectField
            name="phac_cl"
            query={() => ({
              path: "collection-api/extension/phac_cl"
            })}
          />
          <FieldExtensionSelectField
            name="phac_animal_rg"
            query={() => ({
              path: "collection-api/extension/phac_animal_rg"
            })}
          />
          <FieldExtensionSelectField
            name="cfia_ppc"
            query={() => ({
              path: "collection-api/extension/cfia_ppc"
            })}
          />
        </div>
        <div className="col-md-6">
          <TextField name="materialSampleRemarks" multiLines={true} />
        </div>
      </div>
    </FieldSet>
  );
}
