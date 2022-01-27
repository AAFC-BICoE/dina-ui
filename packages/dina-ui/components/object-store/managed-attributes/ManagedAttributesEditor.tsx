import {
  AreYouSureModal,
  FieldSpy,
  filterBy,
  NumberField,
  ResourceSelect,
  SelectField,
  TextField,
  useApiClient,
  useBulkEditTabContext,
  useModal,
  useDinaFormContext
} from "common-ui";
import { Field } from "formik";
import { PersistedResource } from "kitsu";
import { castArray, get } from "lodash";
import { useEffect, useState } from "react";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { ManagedAttribute } from "../../../types/objectstore-api";
import { getManagedAttributesInUse } from "./getManagedAttributesInUse";
import { ManagedAttributesViewer } from "./ManagedAttributesViewer";

export interface ManagedAttributesEditorProps {
  /** Formik path to the ManagedAttribute values field. */
  valuesPath: string;
  apiBaseUrl: string;
  managedAttributeApiPath: string;
  useKeyInFilter?: boolean;

  /**
   * The target component of the managed attribute e.g. COLLECTING_EVENT.
   */
  managedAttributeComponent?: string;

  /**
   * The key field on the ManagedAttribute to use as the key in the managed attribute map.
   * e.g. "id".
   */
  managedAttributeKeyField?: string;

  /** Bootstrap column width of the "Managed Attributes In Use selector. e.g. 6 or 12. */
  attributeSelectorWidth?: number;
}

/** Set of fields inside a Formik form to edit Managed Attributes. */
export function ManagedAttributesEditor({
  valuesPath,
  managedAttributeApiPath,
  apiBaseUrl,
  managedAttributeComponent,
  useKeyInFilter,
  managedAttributeKeyField = "key",
  attributeSelectorWidth = 6
}: ManagedAttributesEditorProps) {
  const { bulkGet, apiClient } = useApiClient();
  const { formatMessage } = useDinaIntl();
  const { openModal } = useModal();
  const { readOnly } = useDinaFormContext();

  const bulkCtx = useBulkEditTabContext();

  return (
    <FieldSpy<Record<string, string | null | undefined>> fieldName={valuesPath}>
      {currentValue => {
        const managedAttributeValues = bulkCtx?.sampleHooks.map(sample =>
          get(sample.formRef.current?.values, valuesPath)
        ) || [currentValue];

        const [editableManagedAttributes, setEditableManagedAttributes] =
          useState<PersistedResource<ManagedAttribute>[]>([]);

        useEffect(() => {
          (async () => {
            const initialAttributes = await getManagedAttributesInUse(
              managedAttributeValues,
              bulkGet,
              apiClient,
              useKeyInFilter as boolean,
              {
                apiBaseUrl,
                keyPrefix: managedAttributeComponent,
                managedAttributeKeyField
              }
            );
            setEditableManagedAttributes(initialAttributes);
          })();
        }, []);

        if (readOnly) {
          return (
            <ManagedAttributesViewer
              values={currentValue}
              managedAttributeApiPath={id => `${managedAttributeApiPath}/${id}`}
            />
          );
        }

        return (
          <div className="mb-3 managed-attributes-editor">
            <div className="row">
              <label
                className={`editable-attribute-menu col-sm-${attributeSelectorWidth} mb-3`}
              >
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
                        attribute.name ??
                        get(attribute, managedAttributeKeyField)
                      }
                      isMulti={true}
                      onChange={selectedValues => {
                        const newList = castArray(selectedValues);
                        if (newList.length < editableManagedAttributes.length) {
                          const removedAttributes =
                            editableManagedAttributes.filter(
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
            <div className="row">
              {editableManagedAttributes.map(attribute => {
                const attributeKey = get(attribute, managedAttributeKeyField);

                const props = {
                  className: `${attributeKey} ${attributeKey}-field col-sm-6`,
                  key: attributeKey,
                  label: attribute.name ?? attributeKey,
                  name: `${valuesPath}.${attributeKey}`
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
        );
      }}
    </FieldSpy>
  );
}
