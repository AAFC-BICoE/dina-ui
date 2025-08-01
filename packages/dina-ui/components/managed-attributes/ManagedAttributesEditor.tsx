import {
  FieldSet,
  FieldSetProps,
  FieldSpy,
  ResourceSelect,
  SimpleSearchFilterBuilder,
  useBulkEditTabContext,
  useDinaFormContext
} from "common-ui";
import { PersistedResource } from "kitsu";
import { useEffect, useRef, useState } from "react";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { ManagedAttribute } from "../../types/collection-api";
import { ManagedAttributesSorter } from "./managed-attributes-custom-views/ManagedAttributesSorter";
import { ManagedAttributeFieldWithLabel } from "./ManagedAttributeField";
import { useManagedAttributeQueries } from "./useManagedAttributeQueries";
import _ from "lodash";

export interface ManagedAttributesEditorProps {
  /** Formik path to the ManagedAttribute values field. */
  valuesPath: string;
  managedAttributeApiPath: string;

  /**
   * The target component of the managed attribute e.g. COLLECTING_EVENT.
   */
  managedAttributeComponent?: string;

  /** Bootstrap column width of the "Managed Attributes In Use selector. e.g. 6 or 12. */
  attributeSelectorWidth?: number;

  fieldSetProps?: Partial<FieldSetProps>;

  /**
   * The formik field name for editing a Form Template's managed attributes order.
   * Has no effect in editing an actual resource e.g. in the Material Sample form.
   */
  managedAttributeOrderFieldName?: string;

  /**
   * When this prop is changed, the visible managed attributes state is updated in useEffect.
   * e.g. when the form's custom view is updated.
   */
  visibleAttributeKeys?: string[];

  values?: object;
}

export function ManagedAttributesEditor({
  valuesPath,
  managedAttributeApiPath,
  managedAttributeComponent,
  attributeSelectorWidth = 6,
  fieldSetProps,
  managedAttributeOrderFieldName,
  visibleAttributeKeys: visibleAttributeKeysProp,
  values
}: ManagedAttributesEditorProps) {
  const bulkCtx = useBulkEditTabContext();
  const { readOnly, isTemplate } = useDinaFormContext();

  return (
    <FieldSpy<Record<string, string | null | undefined>> fieldName={valuesPath}>
      {(currentValue) => {
        function getAttributeKeysInUse() {
          const managedAttributeMaps = bulkCtx?.resourceHooks.map((sample) =>
            _.get(sample.formRef.current?.values, valuesPath)
          ) || [currentValue];

          // Get all unique ManagedAttribute keys in the given value maps:
          const initialVisibleKeys = _.uniq(
            _.flatMap(managedAttributeMaps.map(_.keys))
          );

          return initialVisibleKeys;
        }

        const [visibleAttributeKeys, setVisibleAttributeKeys] = useState(
          getAttributeKeysInUse
        );

        // When the visibleAttributeKeys prop changes, update the internal visible keys state:
        useEffect(() => {
          setVisibleAttributeKeys(
            visibleAttributeKeysProp ?? getAttributeKeysInUse()
          );
        }, [visibleAttributeKeysProp]);

        // Fetch the attributes, but omit any that are missing e.g. were deleted.

        const { data: fetchedAttributes, loading } = useManagedAttributeQueries(
          {
            keys: visibleAttributeKeys,
            managedAttributeApiPath,
            managedAttributeComponent,
            disabled: !visibleAttributeKeys.length
          }
        );

        // Store the last fetched Attributes in a ref instead of showing a
        // loading state when the visible attributes change.
        const lastFetchedAttributes = useRef<
          PersistedResource<ManagedAttribute>[]
        >([]);

        if (!visibleAttributeKeys.length) {
          lastFetchedAttributes.current = [];
        } else if (fetchedAttributes) {
          lastFetchedAttributes.current = fetchedAttributes;
        }

        const visibleAttributes = lastFetchedAttributes.current;

        return (
          <>
            {!readOnly && (
              <FieldSet
                legend={<DinaMessage id="managedAttributes" />}
                {...fieldSetProps}
              >
                <div className="mb-3 managed-attributes-editor">
                  {isTemplate && managedAttributeOrderFieldName ? (
                    <ManagedAttributesSorter
                      managedAttributeComponent={managedAttributeComponent}
                      name={managedAttributeOrderFieldName}
                      managedAttributeApiPath={managedAttributeApiPath}
                      valuesPath={valuesPath}
                    />
                  ) : (
                    <div>
                      <div className="row">
                        {visibleAttributes.map((attribute) => (
                          <ManagedAttributeFieldWithLabel
                            key={attribute.key}
                            attribute={attribute}
                            values={values}
                            valuesPath={valuesPath}
                            onRemoveClick={(attributeKey) =>
                              setVisibleAttributeKeys((current) =>
                                current.filter((it) => it != attributeKey)
                              )
                            }
                          />
                        ))}
                      </div>
                      <div className="row">
                        <label
                          className={`visible-attribute-menu col-sm-${attributeSelectorWidth}`}
                        >
                          <ManagedAttributeMultiSelect
                            managedAttributeApiPath={managedAttributeApiPath}
                            managedAttributeComponent={
                              managedAttributeComponent
                            }
                            onChange={setVisibleAttributeKeys}
                            visibleAttributes={visibleAttributes}
                            loading={loading}
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </FieldSet>
            )}
            {readOnly && (
              <div className="row">
                {visibleAttributes.map((attribute) => (
                  <ManagedAttributeFieldWithLabel
                    key={attribute.key}
                    attribute={attribute}
                    values={values}
                    valuesPath={valuesPath}
                  />
                ))}
              </div>
            )}
          </>
        );
      }}
    </FieldSpy>
  );
}

export interface ManagedAttributeMultiSelectProps {
  managedAttributeComponent?: string;
  managedAttributeApiPath: string;

  onChange: (newValue: string[]) => void;
  visibleAttributes: PersistedResource<ManagedAttribute>[];
  loading?: boolean;
}

/** Select input to set the visible Managed Attributes. */
export function ManagedAttributeMultiSelect({
  managedAttributeComponent,
  managedAttributeApiPath,
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
    const newAttributes = _.castArray(newValues);
    const newKeys = newAttributes.map((it) => _.get(it, "key"));
    onChange(newKeys);
  }

  return (
    <ResourceSelect<ManagedAttribute>
      filter={(input: string) =>
        SimpleSearchFilterBuilder.create<ManagedAttribute>()
          .searchFilter("name", input)
          .when(!!managedAttributeComponent, (builder) =>
            builder.where(
              "managedAttributeComponent",
              "EQ",
              managedAttributeComponent
            )
          )
          .build()
      }
      model={managedAttributeApiPath}
      optionLabel={(attribute) => managedAttributeLabel(attribute)}
      isMulti={true}
      isLoading={loading}
      onChange={onChangeInternal}
      value={visibleAttributes}
      selectProps={{
        controlShouldRenderValue: false,
        isClearable: false,
        placeholder: "Add new"
      }}
    />
  );
}

function managedAttributeLabel(attribute: ManagedAttribute) {
  return (
    _.get(attribute, "name") ||
    _.get(attribute, "key") ||
    _.get(attribute, "id") ||
    ""
  );
}
