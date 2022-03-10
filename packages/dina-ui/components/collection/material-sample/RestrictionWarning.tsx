import {
  DinaFormSection,
  FieldExtensionSelectField,
  TextField
} from "../../../../common-ui/lib";
import { useDinaIntl } from "../../../intl/dina-ui-intl";

export interface RestrictionWarningProps {
  isRestrictionSelect?: boolean;
  isRestrictionRemarks?: boolean;
}

export function RestrictionWarning(props: RestrictionWarningProps) {
  const { isRestrictionSelect, isRestrictionRemarks } = props;
  const { formatMessage } = useDinaIntl();

  return isRestrictionSelect ? (
    <>
      <DinaFormSection horizontal={"flex"}>
        <div className="d-flex flex-row flex-nowrap">
          <FieldExtensionSelectField
            hideLabel={true}
            label={formatMessage("phacAnimalRGLevel")}
            name="phac_animal_rg"
            query={() => ({
              path: "collection-api/extension/phac_animal_rg"
            })}
          />
          <FieldExtensionSelectField
            hideLabel={true}
            label={formatMessage("phacContainmentLevel")}
            name="phac_cl"
            query={() => ({
              path: "collection-api/extension/phac_cl"
            })}
          />
        </div>
      </DinaFormSection>
    </>
  ) : isRestrictionRemarks ? (
    <div className="card text-white bg-danger mb-3 p-2">
      <TextField name="restrictionRemarks" multiLines={true} hideLabel={true} />
    </div>
  ) : null;
}
