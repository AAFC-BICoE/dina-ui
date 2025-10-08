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
import { useEffect, useRef, useState, useCallback } from "react";
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

  /** Whether to show a clear button beside the managed attribute selector. Default false. */
  disableClearButton?: boolean;
}

export function ManagedAttributesEditor({
  valuesPath,
  managedAttributeApiPath,
  managedAttributeComponent,
  attributeSelectorWidth = 6,
  fieldSetProps,
  managedAttributeOrderFieldName,
  visibleAttributeKeys: visibleAttributeKeysProp,
  disableClearButton = false,
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
                            disableClearButton={disableClearButton}
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
                    disableClearButton={disableClearButton}
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

export function DynamicResourceSelect<TData extends PersistedResource<TData>>(
  props
) {
  const {
    pageSize: initialPageSize = 6,
    onChange,
    onDataLoaded,
    value,
    ...rest
  } = props;

  const [pageSize, setPageSize] = useState<number>(initialPageSize);
  const [fetchedRecords, setFetchedRecords] = useState<
    PersistedResource<TData>[]
  >([]);

  const handleInputChange = useCallback(
    (newVal: string, { action }: any) => {
      if (action !== "set-value") {
        rest.selectProps?.onInputChange?.(newVal, { action }); // preserve any existing behavior
      }
    },
    [rest.selectProps]
  );

  // Handle selection and increase pageSize
  const handleChange = (newValue, actionMeta) => {
    setPageSize((prev) => prev + 1);
    onChange?.(newValue, actionMeta);
  };

  // Store fetched records for reuse
  const handleDataLoaded = (data?: PersistedResource<TData>[]) => {
    if (data) {
      setFetchedRecords((prev) => _.uniqBy([...prev, ...data], "id"));
    }
    onDataLoaded?.(data);
  };

  // Filter out selected items from fetchedRecords
  const selectedIds = _.castArray(value).map((v) => v?.id);
  const filteredRecords = fetchedRecords.filter(
    (item) => item?.id && !selectedIds.includes(item.id)
  );

  // Use filteredRecords in filterList to restrict dropdown options
  const filterList = (item?: PersistedResource<TData>) => {
    return filteredRecords.some((r) => r.id === item?.id);
  };

  return (
    <ResourceSelect
      {...rest}
      pageSize={pageSize}
      onChange={handleChange}
      onDataLoaded={handleDataLoaded}
      value={value}
      filterList={filterList}
      selectProps={{
        ...rest.selectProps,
        onInputChange: handleInputChange
      }}
    />
  );
}

/** Select input to set the visible Managed Attributes. */
export function ManagedAttributeMultiSelect({
  managedAttributeComponent,
  managedAttributeApiPath,
  onChange,
  visibleAttributes,
  loading
}: {
  managedAttributeComponent?: string;
  managedAttributeApiPath: string;
  onChange: (newKeys: string[]) => void;
  visibleAttributes: PersistedResource<ManagedAttribute>[];
  loading?: boolean;
}) {
  // Memoize the filter function
  const filter = useCallback(
    (input: string) =>
      SimpleSearchFilterBuilder.create<ManagedAttribute>()
        .searchFilter("name", input)
        .when(!!managedAttributeComponent, (builder) =>
          builder.where(
            "managedAttributeComponent",
            "EQ",
            managedAttributeComponent!
          )
        )
        .build(),
    [managedAttributeComponent]
  );

  // Memoize the label function
  const optionLabel = useCallback(
    (attribute: ManagedAttribute) =>
      _.get(attribute, "name") ||
      _.get(attribute, "key") ||
      _.get(attribute, "id") ||
      "",
    []
  );

  // Stable onChange handler
  const onChangeInternal = useCallback(
    (
      newValues:
        | PersistedResource<ManagedAttribute>
        | PersistedResource<ManagedAttribute>[]
    ) => {
      const newAttributes = _.castArray(newValues);
      const newKeys = newAttributes.map((it) => _.get(it, "key"));
      onChange(newKeys);
    },
    [onChange]
  );

  return (
    <DynamicResourceSelect
      model={managedAttributeApiPath}
      filter={filter}
      optionLabel={optionLabel}
      value={visibleAttributes}
      onChange={onChangeInternal}
      isMulti={true}
      isLoading={loading}
      selectProps={{
        controlShouldRenderValue: false,
        isClearable: false,
        placeholder: "Add new",
        noOptionsMessage: () => "No matching attributes found"
      }}
    />
  );
}
