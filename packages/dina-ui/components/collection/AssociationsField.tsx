import { FieldSet, TextField } from "common-ui";
import { CatalogueOfLifeNameField, GlobalNamesField } from ".";
import { HostOrganism } from "../../../dina-ui/types/collection-api";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { MaterialSampleAssociationsField } from "./MaterialSampleAssociationsField";

/** Type-safe object with all hostotganism fields. */
export const HOSTORGANISM_FIELDS_OBJECT: Required<
  Record<keyof HostOrganism, true>
> = {
  name: true,
  remarks: true
};

export const HOSTORGANISM_FIELDS = Object.keys(HOSTORGANISM_FIELDS_OBJECT);

export function AssociationsField() {
  return (
    <FieldSet
      legend={<DinaMessage id="associationsLegend" />}
      id="associations-section"
    >
      <FieldSet
        legend={<DinaMessage id="hostOrganismLegend" />}
        className="non-strip"
      >
        <div className="row">
          <div className="col-md-6">
            <CatalogueOfLifeNameField
              name={"hostOrganism.name"}
              customName="name"
              isDetermination={false}
            />
          </div>
          <div className="col-md-6">
            <TextField
              multiLines={true}
              name="hostOrganism.remarks"
              customName="remarks"
            />
          </div>
        </div>
      </FieldSet>
      <MaterialSampleAssociationsField />
    </FieldSet>
  );
}
