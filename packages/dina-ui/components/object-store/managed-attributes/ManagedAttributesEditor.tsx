import {
  FieldSet,
  FieldSetProps,
  FieldSpy,
  filterBy,
  NumberField,
  ResourceSelect,
  SelectField,
  TextField,
  Tooltip,
  useBulkEditTabContext,
  useBulkGet,
  useDinaFormContext
} from "common-ui";
import { PersistedResource } from "kitsu";
import { castArray, compact, flatMap, get, keys, uniq } from "lodash";
import { useRef, useState } from "react";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  CustomView,
  managedAttributesViewSchema
} from "../../../types/collection-api";
import { ManagedAttribute } from "../../../types/objectstore-api";
import { ManagedAttributesViewer } from "./ManagedAttributesViewer";
import { ManagedAttributesViewSelect } from "./ManagedAttributesViewSelect";

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

  fieldSetProps?: Partial<FieldSetProps>;
}

export function ManagedAttributesEditor({
  valuesPath,
  managedAttributeApiPath,
  managedAttributeComponent,
  managedAttributeKeyField = "key",
  attributeSelectorWidth = 6,
  fieldSetProps
}: ManagedAttributesEditorProps) {
  const bulkCtx = useBulkEditTabContext();
  const { readOnly } = useDinaFormContext();
  const { formatMessage } = useDinaIntl();

  const [customView, setCustomView] = useState<PersistedResource<CustomView>>();
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

        /** Put the Custom View into the dropdown and update the visible attribute keys.  */
        function updateCustomView(newView?: PersistedResource<CustomView>) {
          setCustomView(newView);

          if (
            newView?.id &&
            managedAttributesViewSchema.isValidSync(newView.viewConfiguration)
          ) {
            const newKeys = newView.viewConfiguration.attributeKeys;
            if (newKeys) {
              setVisibleAttributeKeys(newKeys);
            }
          }
        }

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

        return (
          <FieldSet
            legend={<DinaMessage id="managedAttributes" />}
            {...fieldSetProps}
            wrapLegend={legend => (
              <div className="row">
                <div className="col-sm-6">{legend}</div>
                <div className="col-sm-6">
                  <ManagedAttributesViewSelect
                    value={customView}
                    onChange={updateCustomView}
                  />
                </div>
              </div>
            )}
          >
            {readOnly ? (
              <ManagedAttributesViewer
                values={currentValue}
                managedAttributeApiPath={id =>
                  `${managedAttributeApiPath}/${id}`
                }
              />
            ) : (
              <div className="mb-3 managed-attributes-editor">
                <div className="row">
                  <label
                    className={`visible-attribute-menu col-sm-${attributeSelectorWidth} mb-3`}
                  >
                    <div className="mb-2">
                      <strong>
                        <DinaMessage id="field_visibleManagedAttributes" />
                      </strong>
                      <Tooltip id="field_visibleManagedAttributes_tooltip" />
                    </div>
                    <ManagedAttributeMultiSelect
                      managedAttributeApiPath={managedAttributeApiPath}
                      managedAttributeComponent={managedAttributeComponent}
                      managedAttributeKeyField={managedAttributeKeyField}
                      onChange={setVisibleAttributeKeys}
                      visibleAttributes={visibleAttributes}
                      loading={loading}
                    />
                  </label>
                </div>
                <div className="row">
                  {visibleAttributes.map(attribute => {
                    const attributeKey = get(
                      attribute,
                      managedAttributeKeyField
                    );

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
            )}
          </FieldSet>
        );
      }}
    </FieldSpy>
  );
}

export interface ManagedAttributeMultiSelectProps {
  managedAttributeComponent?: string;
  managedAttributeApiPath: string;
  managedAttributeKeyField: string;

  onChange: (newValue: string[]) => void;
  visibleAttributes: PersistedResource<ManagedAttribute>[];
  loading?: boolean;
}

/** Select input to set the visible Managed Attributes. */
export function ManagedAttributeMultiSelect({
  managedAttributeComponent,
  managedAttributeApiPath,
  managedAttributeKeyField: keyField,
  onChange,
  visibleAttributes,
  loading
}: ManagedAttributeMultiSelectProps) {
  /** Call onChange with the new keys (string array) */
  function onChangeInternal(
    newValues:
      | PersistedResource<ManagedAttribute>
      | PersistedResource<ManagedAttribute>[]
  ) {
    const newAttributes = castArray(newValues);
    const newKeys = newAttributes.map(it => get(it, keyField));
    onChange(newKeys);
  }

  return (
    <ResourceSelect<ManagedAttribute>
      filter={input => ({
        ...filterBy(["name"])(input),
        ...(managedAttributeComponent ? { managedAttributeComponent } : {})
      })}
      model={managedAttributeApiPath}
      optionLabel={attribute => managedAttributeLabel(attribute, keyField)}
      isMulti={true}
      isLoading={loading}
      onChange={onChangeInternal}
      value={visibleAttributes}
    />
  );
}

function managedAttributeLabel(attribute: ManagedAttribute, keyField: string) {
  return (
    get(attribute, "name") || get(attribute, keyField) || get(attribute, "id")
  );
}
