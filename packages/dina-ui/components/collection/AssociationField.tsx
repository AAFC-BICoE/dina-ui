import { DinaMessage } from "../../intl/dina-ui-intl";
import { FieldSet, TextField } from "common-ui";
import { CatalogueOfLifeNameField } from ".";
import { MaterialSampleAssociationsField } from "./MaterialSampleAssociationsField";

export function AssociationField() {
  return (
    <FieldSet legend={<DinaMessage id="associationLegend" />}>
      <FieldSet legend={<DinaMessage id="hostOrganismLegend" />}>
        <CatalogueOfLifeNameField name={"name"} />
        <TextField multiLines={true} name="remarks" />
      </FieldSet>

      <MaterialSampleAssociationsField />
    </FieldSet>
  );
}
