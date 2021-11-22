import { FieldSet, TextField } from "common-ui";
import { CatalogueOfLifeNameField } from ".";
import { HostOrganism } from "../../../dina-ui/types/collection-api";
import { DinaMessage } from "../../intl/dina-ui-intl";
import {
  MaterialSampleAssociationsField,
  MATERIALSAMPLE_ASSOCIATION_FIELDS_OBJECT
} from "./MaterialSampleAssociationsField";

/** Type-safe object with all hostotganism fields. */
export const HOSTORGANISM_FIELDS_OBJECT: Required<
  Record<keyof HostOrganism, true>
> = {
  name: true,
  remarks: true
};

export const HOSTORGANISM_FIELDS = Object.keys(HOSTORGANISM_FIELDS_OBJECT);

export const ASSOCIATION_FIELDS_OBJECT = {
  MATERIALSAMPLE_ASSOCIATION_FIELDS_OBJECT,
  HOSTORGANISM_FIELDS_OBJECT
};

/** All fields of the association type. */
export const ASSOCIATION_FIELDS = Object.keys(ASSOCIATION_FIELDS_OBJECT);

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
        <CatalogueOfLifeNameField
          name={"hostOrganism.name"}
          customName="name"
          isDetermination={false}
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
