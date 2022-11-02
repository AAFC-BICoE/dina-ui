import { FieldSet, TextField } from "common-ui";
import {
  ASSOCIATIONS_COMPONENT_NAME,
  HostOrganism
} from "../../../dina-ui/types/collection-api";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { AssociationsHostField } from "./AssociationsHostField";
import { MaterialSampleAssociationsField } from "./MaterialSampleAssociationsField";

/** Type-safe object with all host organism fields. */
export const HOST_ORGANISM_FIELDS_OBJECT: Required<
  Record<keyof HostOrganism, true>
> = {
  name: true,
  remarks: true
};

export const HOST_ORGANISM_FIELDS = Object.keys(HOST_ORGANISM_FIELDS_OBJECT);

export function AssociationsField({ id = ASSOCIATIONS_COMPONENT_NAME }) {
  return (
    <FieldSet
      legend={<DinaMessage id="associationsLegend" />}
      id={id}
      componentName={ASSOCIATIONS_COMPONENT_NAME}
    >
      <FieldSet
        legend={<DinaMessage id="hostOrganismLegend" />}
        className="non-strip"
        sectionName="associations-host-organism-section"
      >
        <div className="row">
          <div className="col-md-6">
            <AssociationsHostField
              name={"hostOrganism.name"}
              customName="host"
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
