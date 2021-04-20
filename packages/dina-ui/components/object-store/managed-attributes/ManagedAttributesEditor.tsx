import {
  DinaFormSection,
  FieldWrapper,
  filterBy,
  NumberField,
  ResourceSelect,
  SelectField,
  TextField,
  useApiClient
} from "common-ui";
import { useFormikContext } from "formik";
import { get } from "lodash";
import { useEffect, useState } from "react";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { ManagedAttribute } from "../../../types/objectstore-api";
import { getManagedAttributesInUse } from "./getManagedAttributesInUse";

export interface ManagedAttributesEditorProps {
  /** Formik path to the ManagedAttribute values field. */
  valuesPath: string;
  valueFieldName?: string;
  apiBaseUrl: string;
  managedAttributeApiPath: string;

  /**
   * The target component of the managed attribute e.g. COLLECTING_EVENT.
   * Used for Collection API but not for Object Store API.
   */
  managedAttributeComponent?: string;

  /**
   * The key field on the ManagedAttribute to use as the key in the managed attribute map.
   * e.g. "id".
   */
  managedAttributeKeyField?: string;
}

/** Set of fields inside a Formik form to edit Managed Attributes. */
export function ManagedAttributesEditor({
  valuesPath,
  managedAttributeApiPath,
  valueFieldName = "value",
  apiBaseUrl,
  managedAttributeComponent,
  managedAttributeKeyField = "id"
}: ManagedAttributesEditorProps) {
  const { values: formValues } = useFormikContext<any>();
  const { bulkGet } = useApiClient();
  const { formatMessage } = useDinaIntl();

  const managedAttributeValues = get(formValues, valuesPath);

  const [editableManagedAttributes, setEditableManagedAttributes] = useState<
    ManagedAttribute[]
  >([]);

  useEffect(() => {
    (async () => {
      const initialAttributes = await getManagedAttributesInUse(
        [managedAttributeValues],
        bulkGet,
        {
          apiBaseUrl,
          keyPrefix: managedAttributeComponent,
          managedAttributeKeyField
        }
      );
      setEditableManagedAttributes(initialAttributes);
    })();
  }, []);

  return (
    <div className="form-group managed-attributes-editor">
      <h2>
        <DinaMessage id="metadataManagedAttributesLabel" />
      </h2>
      <div className="row">
        <div className="col-sm-6">
          <FieldWrapper
            name="editableManagedAttributes"
            label={formatMessage("field_editableManagedAttributes")}
          >
            <ResourceSelect<ManagedAttribute>
              filter={input => ({
                ...filterBy(["name"])(input),
                ...(managedAttributeComponent
                  ? { managedAttributeComponent }
                  : {})
              })}
              model={managedAttributeApiPath}
              optionLabel={attribute =>
                attribute.name ?? get(attribute, managedAttributeKeyField)
              }
              isMulti={true}
              onChange={ma =>
                setEditableManagedAttributes(ma as ManagedAttribute[])
              }
              value={editableManagedAttributes}
            />
          </FieldWrapper>
        </div>
        <div className="col-sm-6">
          <div className="alert alert-warning">
            <DinaMessage id="editableManagedAttributesRemoveInfo" />
          </div>
        </div>
      </div>
      <div
        style={{
          minHeight: "25rem" /* Give extra room for the dropdown menus. */
        }}
      >
        <div className="row">
          {editableManagedAttributes.map(attribute => {
            const attributeKey = get(attribute, managedAttributeKeyField);

            const props = {
              className: "col-sm-6",
              key: attributeKey,
              label: attribute.name ?? attributeKey,
              name: `${valuesPath}.${attributeKey}.${valueFieldName}`
            };

            if (
              attribute.managedAttributeType === "STRING" &&
              attribute.acceptedValues?.length
            ) {
              return (
                <SelectField
                  {...props}
                  options={[
                    { label: `<${formatMessage("none")}>`, value: "" },
                    ...attribute.acceptedValues.map(value => ({
                      label: value,
                      value
                    }))
                  ]}
                />
              );
            } else if (attribute.managedAttributeType === "INTEGER") {
              return <NumberField {...props} />;
            } else {
              return (
                <TextField
                  {...props}
                  inputProps={{ type: "search" }} // Adds the 'X' clear button in the text input.
                />
              );
            }
          })}
        </div>
      </div>
    </div>
  );
}
