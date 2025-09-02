import {
  BulkEditBadge,
  DateField,
  FormikButton,
  NumberField,
  SelectField,
  StringToggleField,
  TextField,
  Tooltip,
  useBulkEditTabContext,
  useBulkEditTabFieldIndicators,
  useDinaFormContext
} from "common-ui";
import { PersistedResource } from "kitsu";
import { useDinaIntl } from "../../intl/dina-ui-intl";
import { ManagedAttribute } from "../../types/collection-api";
import { FaRegTrashAlt } from "react-icons/fa";
import { useFormikContext } from "formik";
import _ from "lodash";

export interface ManagedAttributeFieldProps {
  attribute: PersistedResource<ManagedAttribute>;
  values?: object;
  valuesPath: string;
}

export interface ManagedAttributeFieldWithLabelProps
  extends ManagedAttributeFieldProps {
  onRemoveClick?: (attributeKey: string) => void;
}

/** Single Managed Attribute Formik-connected field wrapped in a label. */
export function ManagedAttributeFieldWithLabel(
  props: ManagedAttributeFieldWithLabelProps
) {
  const { attribute, valuesPath, onRemoveClick } = props;
  const { readOnly, disableEditAllDelete } = useDinaFormContext();
  const { locale, formatMessage } = useDinaIntl();
  const attributeKey = attribute.key;
  const attributePath = `${valuesPath}.${attributeKey}`;
  const tooltipText = getManagedAttributeTooltipText(
    attribute,
    locale,
    formatMessage
  );

  const { values } = useFormikContext<any>();
  const bulkTab = useBulkEditTabFieldIndicators({
    fieldName: attributePath,
    currentValue: _.get(values, attributePath)
  });
  const bulkCtx = useBulkEditTabContext();

  return (
    <label
      key={attributeKey}
      className={`${attributeKey}-field col-sm-6 mb-3`}
      htmlFor="none"
    >
      <div className="d-flex align-items-center mb-2">
        <strong className="me-auto">
          {attribute.name ?? attributeKey}
          <Tooltip directText={tooltipText} />
        </strong>
        <BulkEditBadge bulkTab={bulkTab} />
        {!readOnly && !bulkTab?.isExplicitlyDeleted && (
          <Tooltip
            directText={"Delete managed attribute."}
            placement="right"
            visibleElement={
              <FormikButton
                className="btn remove-attribute"
                onClick={(_, form) => {
                  // Depending if we are in the bulk edit view, changes the deleted behaviour.
                  if (disableEditAllDelete || !bulkTab) {
                    // Delete the value and hide the managed attribute:
                    form.setFieldValue(attributePath, undefined);
                    onRemoveClick?.(attributeKey);
                  } else {
                    const deleted = new Set(bulkCtx?.deletedFields);
                    deleted.add(attributePath);
                    bulkCtx?.setDeletedFields?.(deleted);
                  }
                }}
              >
                <FaRegTrashAlt size="1.3em" />
              </FormikButton>
            }
          />
        )}
      </div>
      <ManagedAttributeField {...props} />
    </label>
  );
}

export function getManagedAttributeTooltipText(
  attribute: PersistedResource<ManagedAttribute>,
  locale: string,
  formatMessage: any
) {
  const multiDescription =
    attribute?.multilingualDescription?.descriptions?.find(
      (description) => description.lang === locale
    )?.desc;
  const unit = attribute?.unit;

  const unitMessage = formatMessage("dataUnit");

  const tooltipText = unit
    ? `${multiDescription}\n${unitMessage}${unit}`
    : multiDescription;

  const fallbackTooltipText =
    attribute?.multilingualDescription?.descriptions?.find(
      (description) => description.lang !== locale
    )?.desc;
  return tooltipText ?? fallbackTooltipText ?? attribute.name;
}

/** Formik-connected field for a single Managed Attribute. No surrounding label tag. */
export function ManagedAttributeField({
  attribute,
  valuesPath
}: ManagedAttributeFieldProps) {
  const { formatMessage } = useDinaIntl();

  const attributePath = `${valuesPath}.${attribute.key}`;

  const props = {
    removeBottomMargin: true,
    removeLabel: true,
    name: attributePath
  };

  const isSelectAttr = !!(
    attribute.vocabularyElementType === "STRING" &&
    attribute.acceptedValues?.length
  );

  const isIntegerAttr = attribute.vocabularyElementType === "INTEGER";

  const isDateAttr = attribute.vocabularyElementType === "DATE";

  const isBoolAttr = attribute.vocabularyElementType === "BOOL";

  const isDecimalAttr = attribute.vocabularyElementType === "DECIMAL";

  return isSelectAttr ? (
    <SelectField
      {...props}
      options={[
        {
          label: `<${formatMessage("none")}>`,
          value: ""
        },
        ...(attribute.acceptedValues?.map((value) => ({
          label: value,
          value
        })) ?? [])
      ]}
    />
  ) : isIntegerAttr ? (
    <NumberField isInteger={true} {...props} />
  ) : isDateAttr ? (
    <DateField {...props} />
  ) : isBoolAttr ? (
    <StringToggleField {...props} />
  ) : isDecimalAttr ? (
    <NumberField isInteger={false} {...props} />
  ) : (
    <TextField {...props} />
  );
}
