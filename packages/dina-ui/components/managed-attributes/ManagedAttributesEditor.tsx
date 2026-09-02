import {
  FieldSet,
  FieldSetProps,
  FieldSpy,
  GROUP_SCOPE,
  ResourceSelect,
  SimpleSearchFilterBuilder,
  useAccount,
  useBulkEditTabContext,
  useDinaFormContext
} from "common-ui";
import { PersistedResource } from "kitsu";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import {
  ControlledVocabularyItem,
  ManagedAttribute
} from "../../types/collection-api";
import { ManagedAttributesSorter } from "./managed-attributes-custom-views/ManagedAttributesSorter";
import { ManagedAttributeFieldWithLabel } from "./ManagedAttributeField";
import { useManagedAttributeQueries } from "./useManagedAttributeQueries";
import _ from "lodash";
import { COLLECTION_MANAGED_ATTRIBUTE_ID } from "../controlled-vocabulary/controlledVocabularyItemUtils";
import { useIntl } from "react-intl";
import { ManagedAttributesViewer } from "./ManagedAttributesViewer";

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

  /**
   * Whether the managed attributes are from a controlled vocabulary endpoint (e.g. collection-api/controlled-vocabulary-item) or from a regular managed attribute endpoint (e.g. collection-api/managed-attribute).
   * This changes how some of the network requests are performed.
   *
   * Eventually, all managed attributes will be from controlled vocabulary endpoints and this prop can be removed, but for now it is needed to support both the existing managed attributes and the new controlled vocabulary items.
   */
  isControlledVocabulary?: boolean;

  /**
   * Controlled Vocabulary UUID used to scope managed attributes when isControlledVocabulary is true.
   * Defaults to the collection managed attribute vocabulary.
   */
  controlledVocabularyId?: string;
}

interface ManagedAttributesEditorInnerProps
  extends ManagedAttributesEditorProps {
  currentValue: Record<string, string | null | undefined> | null | undefined;
}

// inner component for ManagedAttributesEditor
function ManagedAttributesEditorInner({
  currentValue,
  valuesPath,
  visibleAttributeKeys: visibleAttributeKeysProp, // rename here just like before
  managedAttributeApiPath,
  managedAttributeComponent,
  attributeSelectorWidth = 6,
  fieldSetProps,
  managedAttributeOrderFieldName,
  disableClearButton = false,
  values,
  isControlledVocabulary = false,
  controlledVocabularyId = COLLECTION_MANAGED_ATTRIBUTE_ID
}: ManagedAttributesEditorInnerProps) {
  const bulkCtx = useBulkEditTabContext();
  const { readOnly, isTemplate } = useDinaFormContext();

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

  const { data: fetchedAttributes, loading } = useManagedAttributeQueries({
    keys: visibleAttributeKeys,
    managedAttributeApiPath,
    managedAttributeComponent,
    disabled: readOnly || !visibleAttributeKeys.length,
    isControlledVocabulary,
    controlledVocabularyId
  });

  // Store the last fetched Attributes in a ref instead of showing a
  // loading state when the visible attributes change.
  const lastFetchedAttributes = useRef<
    PersistedResource<ManagedAttribute | ControlledVocabularyItem>[]
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
                      managedAttributeComponent={managedAttributeComponent}
                      onChange={setVisibleAttributeKeys}
                      visibleAttributes={visibleAttributes}
                      loading={loading}
                      isControlledVocabulary={isControlledVocabulary}
                      controlledVocabularyId={controlledVocabularyId}
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        </FieldSet>
      )}
      {readOnly && (
        <ManagedAttributesViewer
          values={currentValue}
          managedAttributeApiPath={managedAttributeApiPath}
          managedAttributeComponent={managedAttributeComponent}
          controlledVocabularyId={
            isControlledVocabulary ? controlledVocabularyId : undefined
          }
        />
      )}
    </>
  );
}

export function ManagedAttributesEditor(props: ManagedAttributesEditorProps) {
  return (
    <FieldSpy<Record<string, string | null | undefined>>
      fieldName={props.valuesPath}
    >
      {(currentValue) => (
        <ManagedAttributesEditorInner {...props} currentValue={currentValue} />
      )}
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

export function DynamicResourceSelect<
  TData extends PersistedResource<TData>
>(props: {
  model: string;
  filter?: (input: string) => any;
  optionLabel?: (
    item: PersistedResource<TData>
  ) => string | React.ReactElement | null;
  value?: PersistedResource<TData> | PersistedResource<TData>[] | null;
  isMulti?: boolean;
  isLoading?: boolean;
  onChange?: (newValue: any, actionMeta?: any) => void;
  onDataLoaded?: (data?: PersistedResource<TData>[]) => void;
  selectProps?: any;
  filterList?: (item?: PersistedResource<TData>) => boolean;
  pageSize?: number;
}) {
  const { groupNames } = useAccount();
  const { formatMessage } = useIntl();

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
    filterProp ?? ((_input) => SimpleSearchFilterBuilder.create<any>().build());

  // Ensure ResourceSelect receives a non-optional optionLabel:
  const defaultOptionLabel = useCallback(
    (r: PersistedResource<TData>) => (r as any)?.name ?? (r as any)?.id ?? "",
    []
  );

  const effectiveOptionLabel:
    | ((r: PersistedResource<TData>) => string | React.ReactElement | null)
    | undefined = optionLabelProp ?? defaultOptionLabel;

  return (
    <ResourceSelect
      {...rest}
      onChange={handleChange}
      onDataLoaded={handleDataLoaded}
      pageSize={20} // Fetch more records to account for filtering
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
      groupBy="group"
      scopes={[GROUP_SCOPE(groupNames ?? [], formatMessage)]}
    />
  );
}

/** Select input to set the visible Managed Attributes. */
export function ManagedAttributeMultiSelect({
  managedAttributeComponent,
  managedAttributeApiPath,
  onChange,
  visibleAttributes,
  loading,
  isControlledVocabulary = false,
  controlledVocabularyId = COLLECTION_MANAGED_ATTRIBUTE_ID
}: {
  managedAttributeComponent?: string;
  managedAttributeApiPath: string;
  onChange: (newKeys: string[]) => void;
  visibleAttributes: PersistedResource<
    ManagedAttribute | ControlledVocabularyItem
  >[];
  loading?: boolean;
  isControlledVocabulary: boolean;
  controlledVocabularyId?: string;
}) {
  const { locale } = useDinaIntl();

  // Memoize the filter function
  const filter = useCallback(
    (input: string) =>
      SimpleSearchFilterBuilder.create<any>()
        .searchFilter("name", input)
        .when(!!managedAttributeComponent, (builder) =>
          builder.where(
            isControlledVocabulary
              ? "dinaComponent"
              : "managedAttributeComponent",
            "EQ",
            managedAttributeComponent!
          )
        )
        .when(isControlledVocabulary, (builder) =>
          builder.where(
            "controlledVocabulary.uuid",
            "EQ",
            controlledVocabularyId
          )
        )
        .build(),
    [managedAttributeComponent, controlledVocabularyId]
  );

  // Memoize the label function
  const optionLabel = useCallback(
    (attribute: ManagedAttribute | ControlledVocabularyItem) => {
      const localizedTitle = (
        attribute as ControlledVocabularyItem
      )?.multilingualTitle?.titles?.find((t) => t.lang === locale)?.title;
      const fallbackTitle = (
        attribute as ControlledVocabularyItem
      )?.multilingualTitle?.titles?.find((t) => t.lang !== locale)?.title;
      return (
        localizedTitle ||
        fallbackTitle ||
        _.get(attribute, "name") ||
        _.get(attribute, "key") ||
        _.get(attribute, "id") ||
        ""
      );
    },
    [locale]
  );

  // Stable onChange handler ( this handles on change for )
  const onChangeInternal = useCallback(
    (
      newValues:
        | PersistedResource<ManagedAttribute | ControlledVocabularyItem>
        | PersistedResource<ManagedAttribute | ControlledVocabularyItem>[]
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
