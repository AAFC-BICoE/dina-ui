import {
  AreYouSureModal,
  FieldSpy,
  filterBy,
  NumberField,
  ResourceSelect,
  SelectField,
  TextField,
  useBulkEditTabContext,
  useBulkGet,
  useDinaFormContext,
  useModal
} from "common-ui";
import { PersistedResource } from "kitsu";
import {
  castArray,
  compact,
  flatMap,
  flatMapDeep,
  get,
  keys,
  uniq
} from "lodash";
import { useState, useRef } from "react";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { ManagedAttribute } from "../../../types/objectstore-api";
import { ManagedAttributesViewer } from "./ManagedAttributesViewer";

export interface ManagedAttributesEditorProps {
  /** Formik path to the ManagedAttribute values field. */
  valuesPath: string;
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

export function ManagedAttributesEditor({
  valuesPath,
  managedAttributeApiPath,
  managedAttributeComponent,
  managedAttributeKeyField = "key",
  attributeSelectorWidth = 6
}: ManagedAttributesEditorProps) {
  const bulkCtx = useBulkEditTabContext();
  const { readOnly } = useDinaFormContext();
  const { formatMessage } = useDinaIntl();

  return (
    <FieldSpy<Record<string, string | null | undefined>> fieldName={valuesPath}>
      {currentValue => {
        const [visibleAttributeKeys, setVisibleAttributeKeys] = useState(() => {
          const managedAttributeMaps = bulkCtx?.sampleHooks.map(sample =>
            get(sample.formRef.current?.values, valuesPath)
          ) || [currentValue];

          // Get all unique ManagedAttribute keys in the given value maps:
          const initialVisibleKeys = uniq(
            flatMap(managedAttributeMaps.map(keys))
          );

          return initialVisibleKeys;
        });

        // Fetch the attributes, but omit any that are missing e.g. were deleted.
        const { dataWithNullForMissing: fetchedAttributes, loading } =
          useBulkGet<ManagedAttribute>({
            ids: visibleAttributeKeys.map(
              key => `${managedAttributeComponent}.${key}`
            ),
            listPath: managedAttributeApiPath
          });

        const lastFetchedAttributes = useRef<
          PersistedResource<ManagedAttribute>[]
        >([]);
        if (fetchedAttributes) {
          lastFetchedAttributes.current = compact(fetchedAttributes);
        }

        const visibleAttributes = lastFetchedAttributes.current;

        return readOnly ? (
          <ManagedAttributesViewer
            values={currentValue}
            managedAttributeApiPath={id => `${managedAttributeApiPath}/${id}`}
          />
        ) : (
          <div className="mb-3 managed-attributes-editor">
            <div className="row">
              <label
                className={`editable-attribute-menu col-sm-${attributeSelectorWidth} mb-3`}
              >
                <strong>
                  <DinaMessage id="field_editableManagedAttributes" />
                </strong>
                <ManagedAttributeMultiSelect
                  valuesPath={valuesPath}
                  managedAttributeApiPath={managedAttributeApiPath}
                  managedAttributeComponent={managedAttributeComponent}
                  managedAttributeKeyField={managedAttributeKeyField}
                  onChange={setVisibleAttributeKeys}
                  visibleAttributes={visibleAttributes}
                />
              </label>
            </div>
            <div className="row">
              {visibleAttributes.map(attribute => {
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

export interface ManagedAttributeMultiSelectProps {
  valuesPath: string;
  managedAttributeComponent?: string;
  managedAttributeApiPath: string;
  managedAttributeKeyField: string;

  onChange: (newValue: string[]) => void;
  visibleAttributes: PersistedResource<ManagedAttribute>[];
}

export function ManagedAttributeMultiSelect({
  valuesPath,
  managedAttributeComponent,
  managedAttributeApiPath,
  managedAttributeKeyField: keyField,
  onChange,
  visibleAttributes
}: ManagedAttributeMultiSelectProps) {
  const { openModal } = useModal();

  return (
    <FieldSpy fieldName={valuesPath}>
      {(_, { form: { setFieldValue } }) => (
        <ResourceSelect<ManagedAttribute>
          filter={input => ({
            ...filterBy(["name"])(input),
            ...(managedAttributeComponent ? { managedAttributeComponent } : {})
          })}
          model={managedAttributeApiPath}
          optionLabel={attribute => managedAttributeLabel(attribute, keyField)}
          isMulti={true}
          onChange={(newValues, actionMeta) => {
            const newAttributes = castArray(newValues);

            const newKeys = newAttributes.map(it => get(it, keyField));

            const removedAttributes = flatMapDeep(
              compact([
                actionMeta?.removedValue?.resource,
                ...(actionMeta?.removedValues?.map(it => it.resource) ?? [])
              ])
            );

            if (removedAttributes.length) {
              openModal(
                <AreYouSureModal
                  actionMessage={
                    <DinaMessage
                      id="removeManagedAttributeValue"
                      values={{
                        attributeNames: removedAttributes
                          .map(it => managedAttributeLabel(it, keyField))
                          .join(", ")
                      }}
                    />
                  }
                  onYesButtonClicked={() => {
                    for (const removedAttribute of removedAttributes) {
                      // Remove the managed attribute value from the value map:
                      const attributeKey = get(removedAttribute, keyField);
                      setFieldValue(`${valuesPath}.${attributeKey}`, undefined);
                    }
                    // Update the visibile attributes list:
                    onChange(newKeys);
                  }}
                />
              );
            } else {
              onChange(newKeys);
            }
          }}
          value={visibleAttributes}
        />
      )}
    </FieldSpy>
  );
}

function managedAttributeLabel(attribute: ManagedAttribute, keyField: string) {
  return (
    get(attribute, "name") || get(attribute, keyField) || get(attribute, "id")
  );
}
