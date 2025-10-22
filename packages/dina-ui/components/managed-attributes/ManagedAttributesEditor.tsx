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
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
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

        // Fetch the attributes (to display on the form, not the multiselect list), but omit any that are missing e.g. were deleted.

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

export function DynamicResourceSelect<TData extends PersistedResource<TData>>(props: {
  model: string;
  filter?: (input: string) => any;
  optionLabel?: (item: PersistedResource<TData>) => string | React.ReactElement | null;
  value?: PersistedResource<TData> | PersistedResource<TData>[] | null;
  isMulti?: boolean;
  isLoading?: boolean;
  onChange?: (newValue: any, actionMeta?: any) => void;
  onDataLoaded?: (data?: PersistedResource<TData>[]) => void;
  selectProps?: any;
  filterList?: (item?: PersistedResource<TData>) => boolean;
  pageSize?: number;
}) {
  const {
    onChange,
    onDataLoaded,
    value,
    filter: filterProp,
    optionLabel: optionLabelProp,
    ...rest
  } = props;

  const [fetchedRecords, setFetchedRecords] = useState<
    PersistedResource<TData>[]
  >([]);

  // Stable onInputChange (no dependency on changing object literals)
  const selectPropsRef = useRef(rest.selectProps);
  useEffect(() => {
    selectPropsRef.current = rest.selectProps;
  }, [rest.selectProps]);

  const handleInputChange = useCallback((newVal: string, { action }: any) => {
    if (action !== "set-value") {
      // Just pass through to the original onInputChange if it exists
      selectPropsRef.current?.onInputChange?.(newVal, { action });
    }
  }, []);

  const handleChange = (newValue: any, actionMeta: any) => {
    onChange?.(newValue, actionMeta);
  };

  const handleDataLoaded = useCallback(
    (data?: PersistedResource<TData>[]) => {
      if (data?.length) {
        // Clear previous records and use only the new search results
        // This ensures fresh results for each search
        setFetchedRecords(data);
      }
      onDataLoaded?.(data);
    },
    [onDataLoaded]
  );

  // ---- filtering, memoized ----
  const selectedIds = useMemo(
    () => _.castArray(value ?? []).map((v) => v?.id),
    [value]
  );

  const unselectedRecords = useMemo(
    () =>
      fetchedRecords.filter(
        (item) => item?.id && !selectedIds.includes(item.id)
      ),
    [fetchedRecords, selectedIds]
  );

  // Limit to 6 records AFTER filtering out selected items
  // This ensures up to 6 available options are always shown
  const limitedRecords = useMemo(
    () => unselectedRecords.slice(0, 6),
    [unselectedRecords]
  );

  const filterList = useCallback(
    (item?: PersistedResource<TData>) =>
      !!item?.id && limitedRecords.some((r) => r.id === item.id),
    [limitedRecords]
  );

  // Ensure ResourceSelect receives a non-optional filter function:
  const effectiveFilter: (input: string) => any =
    filterProp ??
    ((_input) => SimpleSearchFilterBuilder.create<any>().build());

  // Ensure ResourceSelect receives a non-optional optionLabel:
  const defaultOptionLabel = useCallback(
    (r: PersistedResource<TData>) =>
      (r as any)?.name ?? (r as any)?.id ?? "",
    []
  );
  
  const effectiveOptionLabel: 
    ((r: PersistedResource<TData>) => string | React.ReactElement | null) | undefined 
    = optionLabelProp ?? defaultOptionLabel;

  return (
    <ResourceSelect
      {...rest}
      onChange={handleChange}
      onDataLoaded={handleDataLoaded}
      pageSize={20}  // Fetch more records to account for filtering
      // normalize null -> undefined (ResourceSelect doesn't accept null)
      value={value ?? undefined}
      filter={effectiveFilter}
      filterList={filterList}
      optionLabel={effectiveOptionLabel}
      selectProps={{
        ...rest.selectProps,
        isSearchable: true,
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

  // Stable onChange handler ( this handles on change for )
  const onChangeInternal = useCallback(
    (
      newValues:
        | PersistedResource<ManagedAttribute>
        | PersistedResource<ManagedAttribute>[]
    ) => {
      const newAttributes = _.castArray(newValues); // Ensure it's always an array
      const newKeys = newAttributes.map((it) => _.get(it, "key")); // Extract just the keys
      onChange(newKeys); // Call the external onChange with the new keys
    },
    [onChange]
  );

  const selectProps = useMemo(
    () => ({
      isSearchable: true,
      controlShouldRenderValue: false,
      isClearable: false,
      placeholder: "Add new",
      noOptionsMessage: () => "No matching attributes found"
    }),
    []
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
      selectProps={selectProps}
    />
  );
}
