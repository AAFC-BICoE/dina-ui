import {
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
    <div className="d-flex flex-row flex-wrap gap-2">
      <FieldExtensionSelectField
        removeLabel={true}
        label={formatMessage("phacAnimalRGLevel")}
        name="phac_animal_rg"
        query={() => ({
          path: "collection-api/extension/phac_animal_rg"
        })}
      />
      <FieldExtensionSelectField
        name="phac_human_rg"
        removeLabel={true}
        label={formatMessage("phacHumanRGLevel")}
        query={() => ({
          path: "collection-api/extension/phac_human_rg"
        })}
      />
      <FieldExtensionSelectField
        name="cfia_ppc"
        removeLabel={true}
        label={formatMessage("cfiaPPCLevel")}
        query={() => ({
          path: "collection-api/extension/cfia_ppc"
        })}
      />
      <FieldExtensionSelectField
        removeLabel={true}
        label={formatMessage("phacContainmentLevel")}
        name="phac_cl"
        query={() => ({
          path: "collection-api/extension/phac_cl"
        })}
      />
    </div>
  ) : isRestrictionRemarks ? (
    <div
      className="card text-white bg-danger py-1 px-2"
      style={{ width: "100%" }}
    >
      <TextField name="restrictionRemarks" multiLines={true} hideLabel={true} />
    </div>
  ) : null;
}
