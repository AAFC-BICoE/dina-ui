import {
  FieldExtensionSelectField,
  FieldSet,
  TextField,
  ToggleField
} from "common-ui";
import { InputResource } from "kitsu";
import { DinaMessage, useDinaIntl } from "../../..//intl/dina-ui-intl";
import {
  MaterialSample,
  RESTRICTION_COMPONENT_NAME
} from "../../..//types/collection-api";

export const RESTRICTIONS_FIELDS = [
  "phac_animal_rg",
  "phac_human_rg",
  "cfia_ppc",
  "phac_cl",
  "isRestricted",
  "restrictionRemarks",
  "restrictionFieldsExtension"
] as const;

/** Blank values for all Preparation fields. */
export const BLANK_RESTRICTION: Pick<
  InputResource<MaterialSample>,
  typeof RESTRICTIONS_FIELDS[number]
> = Object.seal({
  isRestricted: false,
  restrictionRemarks: null,
  restrictionFieldsExtension: null
});

export function RestrictionField({ id }: { id?: string }) {
  const { formatMessage } = useDinaIntl();
  return (
    <FieldSet
      id={id}
      legend={<DinaMessage id="restrictions" />}
      componentName={RESTRICTION_COMPONENT_NAME}
      sectionName="restriction-general-section"
    >
      <div className="row">
        <FieldExtensionSelectField
          name="phac_animal_rg"
          label={formatMessage("phacAnimalRGLevel")}
          className="col-md-6"
          query={() => ({
            path: "collection-api/extension/phac_animal_rg"
          })}
        />
        <FieldExtensionSelectField
          name="phac_human_rg"
          label={formatMessage("phacHumanRGLevel")}
          className="col-md-6"
          query={() => ({
            path: "collection-api/extension/phac_human_rg"
          })}
        />
      </div>
      <div className="row">
        <FieldExtensionSelectField
          name="cfia_ppc"
          label={formatMessage("cfiaPPCLevel")}
          className="col-md-6"
          query={() => ({
            path: "collection-api/extension/cfia_ppc"
          })}
        />
        <FieldExtensionSelectField
          className="col-md-6"
          label={formatMessage("phacContainmentLevel")}
          name="phac_cl"
          query={() => ({
            path: "collection-api/extension/phac_cl"
          })}
        />
      </div>
      <ToggleField name="isRestricted" label={formatMessage("restricted")} />
      <div>
        <TextField name="restrictionRemarks" multiLines={true} />
      </div>
    </FieldSet>
  );
}
