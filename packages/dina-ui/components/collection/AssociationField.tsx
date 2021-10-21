import { DinaMessage } from "../../intl/dina-ui-intl";
import { FieldSet, TextField } from "common-ui";
import { CatalogueOfLifeNameField } from ".";
import { MaterialSampleAssociationsField } from "./MaterialSampleAssociationsField";
import { Field } from "formik";

export function AssociationField() {
  return (
    <FieldSet legend={<DinaMessage id="associationLegend" />}>
      <FieldSet legend={<DinaMessage id="hostOrganismLegend" />}>
        <CatalogueOfLifeNameField
          name={"hostOrganism.name"}
          customName="name"
        />
        <TextField
          multiLines={true}
          name="hostOrganism.remarks"
          customName="remarks"
        />
      </FieldSet>
      <MaterialSampleAssociationsField />
    </FieldSet>
  );
}
