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

  const isRestricted = initialValues?.isRestricted ?? false;

  return isRestrictionSelect ? (
    <div className="d-flex flex-row flex-wrap gap-1">
      {initialValues?.restrictionFieldsExtension?.phac_animal_rg && (
        <FieldExtensionSelectField
          removeLabel={true}
          label={formatMessage("phacAnimalRGLevel")}
          name="phac_animal_rg"
          removeBottomMargin={readOnly}
          query={() => ({
            path: "collection-api/extension/phac_animal_rg"
          })}
          isRestricted={isRestricted}
        />
      )}

      {initialValues?.restrictionFieldsExtension?.phac_human_rg && (
        <FieldExtensionSelectField
          name="phac_human_rg"
          removeLabel={true}
          label={formatMessage("phacHumanRGLevel")}
          removeBottomMargin={readOnly}
          query={() => ({
            path: "collection-api/extension/phac_human_rg"
          })}
          isRestricted={isRestricted}
        />
      )}

      {initialValues?.restrictionFieldsExtension?.cfia_ppc && (
        <FieldExtensionSelectField
          name="cfia_ppc"
          removeLabel={true}
          label={formatMessage("cfiaPPCLevel")}
          removeBottomMargin={readOnly}
          query={() => ({
            path: "collection-api/extension/cfia_ppc"
          })}
          isRestricted={isRestricted}
        />
      )}

      {initialValues?.restrictionFieldsExtension?.phac_cl && (
        <FieldExtensionSelectField
          removeLabel={true}
          label={formatMessage("phacContainmentLevel")}
          name="phac_cl"
          removeBottomMargin={readOnly}
          query={() => ({
            path: "collection-api/extension/phac_cl"
          })}
          isRestricted={isRestricted}
        />
      )}

      {readOnly && initialValues.restrictionRemarks && (
        <Tooltip
          visibleElement={
            <div>
              <div
                className={
                  "card pill py-1 px-2 flex-row align-items-center gap-1 mb-2 " +
                  (isRestricted ? "bg-danger" : "bg-warning")
                }
              >
                <FaFileAlt
                  className={isRestricted ? "text-white" : undefined}
                />
                <span className={isRestricted ? "text-white" : undefined}>
                  {initialValues.restrictionRemarks}
                </span>
              </div>
            </div>
          }
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
