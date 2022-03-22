import {
  DateField,
  FormikButton,
  NumberField,
  SelectField,
  TextField,
  ToggleField,
  useDinaFormContext
} from "common-ui";
import { PersistedResource } from "kitsu";
import { RiDeleteBinLine } from "react-icons/ri";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { ManagedAttribute } from "../../../types/objectstore-api";

export interface ManagedAttributeFieldProps {
  attribute: PersistedResource<ManagedAttribute>;
  values?: object;
  valuesPath: string;
}

export interface ManagedAttributeFieldWithLabelProps
  extends ManagedAttributeFieldProps {
  onRemoveClick: (attributeKey: string) => void;
}

/** Single Managed Attribute Formik-connected field wrapped in a label. */
export function ManagedAttributeFieldWithLabel(
  props: ManagedAttributeFieldWithLabelProps
) {
  const { attribute, valuesPath, onRemoveClick } = props;
  const { readOnly } = useDinaFormContext();
  const attributeKey = attribute.key;

  const attributePath = `${valuesPath}.${attributeKey}`;

  return (
    <label
      key={attributeKey}
      className={`${attributeKey}-field col-sm-6 mb-3`}
      htmlFor="none"
    >
      <div className="mb-2 d-flex align-items-center">
        <strong className="me-auto">{attribute.name ?? attributeKey}</strong>
        {!readOnly && (
          <FormikButton
            className="btn remove-attribute"
            onClick={(_, form) => {
              // Delete the value and hide the managed attribute:
              form.setFieldValue(attributePath, undefined);
              onRemoveClick(attributeKey);
            }}
          >
            <RiDeleteBinLine size="1.8em" />
          </FormikButton>
        )}
      </div>
      <ManagedAttributeField {...props} />
    </label>
  );
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
    name: attributePath,
  };

  const isSelectAttr = !!(
    attribute.managedAttributeType === "STRING" &&
    attribute.acceptedValues?.length
  );

  const isIntegerAttr = attribute.managedAttributeType === "INTEGER";

  const isDateAttr = attribute.managedAttributeType === "DATE";

  const isBoolAttr = attribute.managedAttributeType === "BOOL";

  return isSelectAttr ? (
    <SelectField
      {...props}
      options={[
        {
          label: `<${formatMessage("none")}>`,
          value: ""
        },
        ...(attribute.acceptedValues?.map(value => ({
          label: value,
          value
        })) ?? [])
      ]}
    />
  ) : isIntegerAttr ? (
    <NumberField {...props} />
  ) : isDateAttr ? (
    <DateField {...props} />
  ) : isBoolAttr ? (
    <ToggleField {...props}/>
  ) : (
    <TextField {...props} />
  );
}
