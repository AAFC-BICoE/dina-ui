import {
  FormikButton,
  NumberField,
  SelectField,
  TextField,
  useDinaFormContext
} from "common-ui";
import { PersistedResource } from "kitsu";
import { RiDeleteBinLine } from "react-icons/ri";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { ManagedAttribute } from "../../../types/objectstore-api";

export interface ManagedAttributeFieldProps {
  attribute: PersistedResource<ManagedAttribute>;
  valuesPath: string;
  onRemoveClick: (attributeKey: string) => void;
}

/** Formik-connected field for a single Managed Attribute. */
export function ManagedAttributeField({
  attribute,
  valuesPath,
  onRemoveClick
}: ManagedAttributeFieldProps) {
  const { readOnly } = useDinaFormContext();
  const attributeKey = attribute.key;
  const { formatMessage } = useDinaIntl();

  const attributePath = `${valuesPath}.${attributeKey}`;
  const props = {
    removeBottomMargin: true,
    removeLabel: true,
    name: attributePath
  };

  const isSelectAttr = !!(
    attribute.managedAttributeType === "STRING" &&
    attribute.acceptedValues?.length
  );

  const isIntegerAttr = attribute.managedAttributeType === "INTEGER";

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
      {isSelectAttr ? (
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
      ) : (
        <TextField {...props} />
      )}
    </label>
  );
}
