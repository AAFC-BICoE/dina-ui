import {
  AreYouSureModal,
  filterBy,
  NumberField,
  ResourceSelect,
  SelectField,
  TextField,
  useApiClient,
  useDinaFormContext,
  useModal
} from "common-ui";
import { Field } from "formik";
import { PersistedResource } from "kitsu";
import { castArray, get } from "lodash";
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
  const { openModal } = useModal();

  const managedAttributeValues = get(formInitialValues, valuesPath);

  const [editableManagedAttributes, setEditableManagedAttributes] = useState<
    PersistedResource<ManagedAttribute>[]
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

  /** Gets the formik field path for a given Managed Attribute key. */
  function fieldPath(managedAttributeKey: string) {
    // Dot path to the attribute's form field:
    return [valuesPath, managedAttributeKey, valueFieldName]
      .filter(it => it) // Remove undefined
      .join(".");
  }

  return (
    <div className="mb-3 managed-attributes-editor">
      <div className="row">
        <label className="editable-attribute-menu col-sm-6 mb-3">
          <strong>
            <DinaMessage id="field_editableManagedAttributes" />
          </strong>
          <Field>
            {({ form: { setFieldValue } }) => (
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
                onChange={selectedValues => {
                  const newList = castArray(selectedValues);
                  if (newList.length < editableManagedAttributes.length) {
                    const removedAttributes = editableManagedAttributes.filter(
                      attr => !newList.includes(attr)
                    );
                    if (removedAttributes.length) {
                      openModal(
                        <AreYouSureModal
                          actionMessage={
                            <DinaMessage
                              id="removeManagedAttributeValue"
                              values={{
                                attributeNames: removedAttributes
                                  .map(it => it.name)
                                  .join(", ")
                              }}
                            />
                          }
                          onYesButtonClicked={() => {
                            for (const removedAttribute of removedAttributes) {
                              // Remove the managed attribute value from the value map:
                              const attributeKey = get(
                                removedAttribute,
                                managedAttributeKeyField
                              );
                              setFieldValue(
                                `${valuesPath}.${attributeKey}`,
                                undefined
                              );
                            }
                            // Update the visibile attributes list:
                            setEditableManagedAttributes(newList);
                          }}
                        />
                      );
                    }
                  } else {
                    setEditableManagedAttributes(newList);
                  }
                }}
                value={editableManagedAttributes}
              />
            )}
          </Field>
        </label>
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
              name: fieldPath(attributeKey)
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
