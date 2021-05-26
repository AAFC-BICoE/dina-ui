import {
  filterBy,
  NumberField,
  ResourceSelect,
  SelectField,
  TextField,
  useApiClient,
  useDinaFormContext
} from "common-ui";
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
  valuesPath = "managedAttributeValues",
  managedAttributeApiPath,
  valueFieldName,
  apiBaseUrl,
  managedAttributeComponent,
  managedAttributeKeyField = "key"
}: ManagedAttributesEditorProps) {
  const { initialValues: formInitialValues } = useDinaFormContext();
  const { bulkGet } = useApiClient();
  const { formatMessage } = useDinaIntl();

  const managedAttributeValues = get(formInitialValues, valuesPath);

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
    <div className="mb-3 managed-attributes-editor">
      <div className="row">
        <label className="col-sm-6">
          <strong>
            <DinaMessage id="field_editableManagedAttributes" />
          </strong>
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
        </label>
        <div className="col-sm-6">
          <div
            className="alert alert-warning"
            role="region"
            aria-label="Editable attribute removal info"
          >
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
              className: `${attributeKey} col-sm-6`,
              key: attributeKey,
              label: attribute.name ?? attributeKey,
              name: `${valuesPath}.${attributeKey}${
                valueFieldName ? `.${valueFieldName}` : ""
              }`
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
