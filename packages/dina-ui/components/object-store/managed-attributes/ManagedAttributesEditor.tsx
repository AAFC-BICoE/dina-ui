import {
  FieldSet,
  FieldSetProps,
  filterBy,
  ResourceSelect,
  Tooltip,
  useBulkGet,
  useDinaFormContext
} from "common-ui";
import { PersistedResource } from "kitsu";
import { castArray, compact, get } from "lodash";
import { getFormTemplateSection } from "common-ui/lib/form-template/formTemplateUtils";
import { useEffect, useRef, useState } from "react";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { ManagedAttribute } from "../../../types/objectstore-api";
import { ManagedAttributesSorter } from "./managed-attributes-custom-views/ManagedAttributesSorter";
import { ManagedAttributeFieldWithLabel } from "./ManagedAttributeField";

export interface ManagedAttributesEditorProps {
  /**
   * Formik path to the ManagedAttribute values field.
   */
  valuesPath: string;

  /**
   * Formik Values.
   */
  values?: object;

  /**
   * The API end point to use in order to find the managed attribute information.
   * Such as the values allowed in a pick list.
   */
  managedAttributeApiPath: string;

  /**
   * The target component of the managed attribute e.g. COLLECTING_EVENT.
   */
  managedAttributeComponent?: string;

  /** Bootstrap column width of the "Managed Attributes In Use selector. e.g. 6 or 12. */
  attributeSelectorWidth?: number;

  /**
   * The FieldSet is the card group to display in the form. Information like the legend and the
   * form template details should be stored here.
   */
  fieldSetProps?: Partial<FieldSetProps>;

  /**
   * What component is currently storing the managed attributes. (Form Template)
   */
  componentName?: string;

  /**
   * What section is currently storing the managed attributes. (Form Template)
   */
  sectionName?: string;
}

export function ManagedAttributesEditor({
  valuesPath,
  values,
  managedAttributeApiPath,
  managedAttributeComponent,
  attributeSelectorWidth = 6,
  fieldSetProps,
  componentName,
  sectionName
}: ManagedAttributesEditorProps) {
  const { readOnly, isTemplate, formTemplate, initialValues } =
    useDinaFormContext();

  const [visibleAttributeKeys, setVisibleAttributeKeys] = useState<string[]>(
    []
  );

  // When the form template has changed, then the visible managed attributes need to be
  // changed.
  useEffect(() => {
    // If no form template is applied, just list all the managed attributes attached to the entity.
    if (!formTemplate) {
      setVisibleAttributeKeys(Object.keys(initialValues?.[valuesPath] ?? []));
      return;
    }

    const sectionFound = getFormTemplateSection(
      formTemplate,
      componentName,
      sectionName
    );

    if (sectionFound) {
      // Now, get a list of all of the managed attributes to be displayed.
      setVisibleAttributeKeys(
        sectionFound.items
          ?.filter((item) => item.visible)
          ?.map<string>((item) => item?.name?.split(".")[1] ?? "") ?? []
      );
    }
  }, [formTemplate]);

  // Fetch the attributes, but omit any that are missing e.g. were deleted.
  const { dataWithNullForMissing: fetchedAttributes, loading } =
    useBulkGet<ManagedAttribute>({
      ids: visibleAttributeKeys.map((key) =>
        // Use the component prefix if needed by the back-end:
        compact([managedAttributeComponent, key]).join(".")
      ),
      listPath: managedAttributeApiPath
    });

  // Store the last fetched Attributes in a ref instead of showing a
  // loading state when the visible attributes change.
  const lastFetchedAttributes = useRef<PersistedResource<ManagedAttribute>[]>(
    []
  );
  if (fetchedAttributes) {
    lastFetchedAttributes.current = compact(fetchedAttributes);
  }

  const visibleAttributes = lastFetchedAttributes.current;

  return (
    <FieldSet
      legend={<DinaMessage id="managedAttributes" />}
      {...fieldSetProps}
    >
      <div className="mb-3 managed-attributes-editor">
        {isTemplate ? (
          <ManagedAttributesSorter
            managedAttributeComponent={managedAttributeComponent}
            managedAttributeApiPath={managedAttributeApiPath}
            valuesPath={valuesPath}
          />
        ) : (
          <>
            {!readOnly && !formTemplate && (
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
                    onChange={setVisibleAttributeKeys}
                    visibleAttributes={visibleAttributes}
                    loading={loading}
                  />
                </label>
              </div>
            )}
            {!!visibleAttributes.length && <hr />}
            <div className="row">
              {visibleAttributes.map((attribute) => (
                <ManagedAttributeFieldWithLabel
                  key={attribute.key}
                  attribute={attribute}
                  values={values}
                  valuesPath={valuesPath}
                  onRemoveClick={(attributeKey) =>
                    setVisibleAttributeKeys((current) =>
                      current.filter((it) => it !== attributeKey)
                    )
                  }
                />
              ))}
            </div>
          </>
        )}
      </div>
    </FieldSet>
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
    const newAttributes = castArray(newValues);
    const newKeys = newAttributes.map((it) => get(it, "key"));
    onChange(newKeys);
  }

  return (
    <ResourceSelect<ManagedAttribute>
      filter={(input) => ({
        ...filterBy(["name"])(input),
        ...(managedAttributeComponent ? { managedAttributeComponent } : {})
      })}
      model={managedAttributeApiPath}
      optionLabel={(attribute) => managedAttributeLabel(attribute)}
      isMulti={true}
      isLoading={loading}
      onChange={onChangeInternal}
      value={visibleAttributes}
    />
  );
}

function managedAttributeLabel(attribute: ManagedAttribute) {
  return (
    get(attribute, "name") ||
    get(attribute, "key") ||
    get(attribute, "id") ||
    ""
  );
}
