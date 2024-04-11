import {
  FieldExtensionSelectField,
  TextField,
  Tooltip,
  useDinaFormContext
} from "common-ui";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { FaFileAlt } from "react-icons/fa";

export interface RestrictionWarningProps {
  isRestrictionSelect?: boolean;
  isRestrictionRemarks?: boolean;
}

export function RestrictionWarning(props: RestrictionWarningProps) {
  const { isRestrictionSelect, isRestrictionRemarks } = props;
  const { formatMessage } = useDinaIntl();
  const { readOnly, initialValues } = useDinaFormContext();

  return isRestrictionSelect ? (
    <div className="d-flex flex-row flex-wrap gap-1">
      <FieldExtensionSelectField
        removeLabel={true}
        label={formatMessage("phacAnimalRGLevel")}
        name="phac_animal_rg"
        removeBottomMargin={readOnly}
        query={() => ({
          path: "collection-api/extension/phac_animal_rg"
        })}
      />
      <FieldExtensionSelectField
        name="phac_human_rg"
        removeLabel={true}
        label={formatMessage("phacHumanRGLevel")}
        removeBottomMargin={readOnly}
        query={() => ({
          path: "collection-api/extension/phac_human_rg"
        })}
      />
      <FieldExtensionSelectField
        name="cfia_ppc"
        removeLabel={true}
        label={formatMessage("cfiaPPCLevel")}
        removeBottomMargin={readOnly}
        query={() => ({
          path: "collection-api/extension/cfia_ppc"
        })}
      />
      <FieldExtensionSelectField
        removeLabel={true}
        label={formatMessage("phacContainmentLevel")}
        name="phac_cl"
        removeBottomMargin={readOnly}
        query={() => ({
          path: "collection-api/extension/phac_cl"
        })}
      />
      {readOnly && initialValues.restrictionRemarks && (
        <Tooltip
          visibleElement={(
            <div>
              <div className="card pill py-1 px-2 flex-row align-items-center gap-1 bg-danger">
                <FaFileAlt className="text-white" />
                <span className="text-white">
                  {initialValues.restrictionRemarks}
                </span>
              </div>
            </div>
          )}
          id="field_restrictionRemarks"
          disableSpanMargin={true}
        />
      )}
    </div>
  ) : isRestrictionRemarks && !readOnly ? (
    <div
      className="card text-white bg-danger py-1 px-2"
      style={{ width: "100%" }}
    >
      <TextField name="restrictionRemarks" multiLines={true} hideLabel={true} />
    </div>
  ) : null;
}
