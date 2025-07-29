import {
  LoadingSpinner,
  ResourceSelectField,
  SelectField,
  SimpleSearchFilterBuilder,
  TooltipSelectOption
} from "..";
import { DinaMessage, useDinaIntl } from "../../../dina-ui/intl/dina-ui-intl";
import React, { useState, useEffect, useMemo } from "react";
import { Button } from "react-bootstrap";
import { GeneratorItem } from "./GeneratorItem";
import { GeneratorColumn, GeneratorSelectorProps } from "./GeneratorSelector";
import _ from "lodash";
import { ManagedAttribute } from "packages/dina-ui/types/collection-api";
import { useFormikContext } from "formik";
import QueryRowClassificationSearch, {
  ClassificationSearchStates
} from "../list-page/query-builder/query-builder-value-types/QueryBuilderClassificationSearch";

export interface GeneratorSelectorListProps extends GeneratorSelectorProps {
  loading: boolean;
}

export function GeneratorSelectorList({
  generatorFields,
  displayedColumns,
  setDisplayedColumns,
  loading,
  disabled,
  dynamicFieldsMappingConfig
}: GeneratorSelectorListProps) {
  const { locale, formatMessage } = useDinaIntl();

  const { setValues } = useFormikContext();

  // The selected field from the query field selector.
  const [selectedField, setSelectedField] = useState<GeneratorColumn>();

  // Used for dynamic fields to store the specific dynamic value selected.
  const [dynamicFieldValue, setDynamicFieldValue] = useState<string>();
  const [dynamicFieldLabel, setDynamicFieldLabel] = useState<string>();

  // Used for the "Add column" button to determine if it should be disabled or not.
  const [isValidField, setIsValidField] = useState<boolean>(false);

  // Handle what happens when the user selects an option from the Query Field Selector. If a dynamic
  // field is selected, verify we are at a point where it can be added.
  useEffect(() => {
    if (selectedField && generatorFields) {
      // Check if it's a dynamic type.
      if (selectedField.dynamicConfig) {
        if (dynamicFieldValue) {
          setIsValidField(true);
          return;
        }
      } else {
        // Regular field selected, not dynamic and requires more options.
        setIsValidField(true);
        return;
      }
    }

    setIsValidField(false);
  }, [selectedField, dynamicFieldValue, generatorFields]);

  // Reset the dynamic field value so it doesn't get mixed with another one.
  useEffect(() => {
    setDynamicFieldValue(undefined);
    setDynamicFieldLabel(undefined);

    // Reset the formik values if undefined.
    if (selectedField === undefined) {
      setValues({});
    }
  }, [selectedField]);

  const onGeneratorItemDelete = (columnValue: string) => {
    const newDisplayedColumns = displayedColumns.filter(
      (column) => column.columnValue !== columnValue
    );
    setDisplayedColumns(newDisplayedColumns);
  };

  const onGeneratorItemChangeOrder = (
    direction: "up" | "down",
    columnValue: string
  ) => {
    // Create a copy of the displayedColumns array
    const newDisplayedColumns = [...displayedColumns];

    // Find the index of the column to be moved
    const columnIndex = newDisplayedColumns.findIndex(
      (column) => column.columnValue === columnValue
    );

    // Check if the column exists and the direction is valid
    if (columnIndex !== -1 && (direction === "up" || direction === "down")) {
      // Swap the column with its neighbor based on direction
      const targetIndex =
        direction === "up" ? columnIndex - 1 : columnIndex + 1;

      // Check if the target index is within bounds
      if (targetIndex >= 0 && targetIndex < newDisplayedColumns.length) {
        // Swap elements:
        [newDisplayedColumns[columnIndex], newDisplayedColumns[targetIndex]] = [
          newDisplayedColumns[targetIndex],
          newDisplayedColumns[columnIndex]
        ];
      }
    }

    // Update the displayedColumns state with the modified array
    setDisplayedColumns(newDisplayedColumns);
  };

  const onGeneratorItemChangeAlias = (
    aliasValue: string,
    columnValue: string
  ) => {
    // Create a copy of the displayedColumns array
    const newDisplayedColumns = [...displayedColumns];

    // Find the index of the column to be moved
    const columnIndex = newDisplayedColumns.findIndex(
      (column) => column.columnValue === columnValue
    );

    if (columnIndex !== -1) {
      newDisplayedColumns[columnIndex].columnAlias = aliasValue;
    }

    // Update the displayedColumns state with the modified array
    setDisplayedColumns(newDisplayedColumns);
  };

  const onGeneratorItemInsert = async () => {
    if (isValidField && selectedField && generatorFields) {
      // If the column already exists do not add it again.
      if (
        displayedColumns.find(
          (column) => column.columnValue === selectedField.columnValue
        )
      ) {
        setSelectedField(undefined);
        return;
      }

      // Add new option to the bottom of the list.
      const newDisplayedColumns: GeneratorColumn[] = [
        ...displayedColumns,
        {
          ...selectedField,
          columnValue: dynamicFieldValue
            ? selectedField.columnValue + "." + dynamicFieldValue
            : selectedField.columnValue,
          columnLabel: dynamicFieldLabel ?? selectedField.columnLabel
        }
      ];

      setDisplayedColumns(newDisplayedColumns);
      setSelectedField(undefined);
    }
  };

  const onGeneratorItemSelected = (columnValue: string) => {
    if (generatorFields) {
      generatorFields.forEach((genField) => {
        // If it a relationship field, search the options inside of it.
        if (genField.options && genField.options.length !== 0) {
          genField.options.forEach((parentGenField) => {
            if (parentGenField.value === columnValue) {
              const parts = (parentGenField.value ?? "").split(".") ?? [];
              const extractedValue = parts.splice(1).join(".");
              const newSelectedField: GeneratorColumn = {
                columnLabel: genField.label + " " + parentGenField.label,
                columnValue: parentGenField.value,
                columnAlias: "",
                dynamicConfig:
                  dynamicFieldsMappingConfig?.relationshipFields?.find?.(
                    (dynConfig) =>
                      dynConfig.path ===
                        "included.attributes." + extractedValue &&
                      dynConfig.referencedBy === parentGenField.parentPath
                  )
              };
              setSelectedField(newSelectedField);
            }
          });
        }

        if (genField.value === columnValue) {
          const newSelectedField: GeneratorColumn = {
            columnLabel: genField.label,
            columnValue: genField.value,
            columnAlias: "",
            dynamicConfig: dynamicFieldsMappingConfig?.fields?.find?.(
              (dynConfig) =>
                dynConfig.path === "data.attributes." + genField.value
            )
          };
          setSelectedField(newSelectedField);
        }
      });
    }
  };

  const generatorFieldsFiltered = useMemo(() => {
    if (generatorFields) {
      return generatorFields.filter((mapping) => {
        // Check if it's already been used, does not need to shown again since they are already displaying it.
        const alreadyUsed = displayedColumns?.find(
          (column) => column.columnValue === mapping.value
        );
        if (alreadyUsed) {
          return false;
        }
      });
    }
    return undefined;
  }, [generatorFields, displayedColumns]);

  // Custom styling to indent the group option menus.
  const customStyles = useMemo(
    () => ({
      placeholder: (provided, _) => ({
        ...provided,
        color: "rgb(87,120,94)"
      }),
      menu: (base) => ({ ...base, zIndex: 1050 }),
      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
      control: (base) => ({
        ...base
      }),
      // Grouped options (relationships) should be indented.
      option: (baseStyle, { data }) => {
        if (data?.parentPath) {
          return {
            ...baseStyle,
            paddingLeft: "25px"
          };
        }

        // Default style for everything else.
        return {
          ...baseStyle
        };
      },

      // When viewing a group item, the parent path should be prefixed on to the value.
      singleValue: (baseStyle, { data }) => {
        if (data?.parentPath) {
          return {
            ...baseStyle,
            ":before": {
              content: `'${_.startCase(data.parentPath)} '`
            }
          };
        }

        return {
          ...baseStyle
        };
      }
    }),
    []
  );

  return (
    <>
      {loading || !generatorFieldsFiltered || !generatorFields ? (
        <LoadingSpinner loading={loading} />
      ) : (
        <>
          <strong>
            <DinaMessage id="columnSelector_addNewColumn" />
          </strong>
          <SelectField
            className="flex-fill mb-0"
            name={`insertField`}
            options={generatorFields}
            selectProps={{
              isClearable: true,
              menuPortalTarget: document.body,
              styles: customStyles
            }}
            hideLabel={true}
            onChange={onGeneratorItemSelected}
            disabled={disabled ?? false}
          />
          {selectedField?.dynamicConfig?.type === "managedAttribute" && (
            <>
              <strong>
                <DinaMessage id="columnSelector_selectManagedAttribute" />
              </strong>
              <ResourceSelectField<ManagedAttribute>
                name={`insertManagedAttributeField`}
                hideLabel={true}
                selectProps={{
                  className: "mt-0",
                  menuPortalTarget: document.body,
                  styles: { menuPortal: (base) => ({ ...base, zIndex: 9999 }) }
                }}
                filter={(input) =>
                  SimpleSearchFilterBuilder.create<ManagedAttribute>()
                    .searchFilter("name", input)
                    .where(
                      "managedAttributeComponent",
                      "EQ",
                      selectedField?.dynamicConfig?.component ??
                        "MATERIAL_SAMPLE"
                    )
                    .build()
                }
                isDisabled={disabled}
                omitNullOption={true}
                additionalSort={"name"}
                showGroupCategary={true}
                onChange={(newValue) => {
                  if (newValue) {
                    setDynamicFieldValue((newValue as any)?.key);
                    setDynamicFieldLabel((newValue as any)?.name);
                  }
                }}
                model="collection-api/managed-attribute"
                optionLabel={(ma) => {
                  const multiDescription =
                    ma?.multilingualDescription?.descriptions?.find(
                      (description) => description.lang === locale
                    )?.desc;
                  const unit = ma?.unit;
                  const unitMessage = formatMessage("dataUnit");
                  const tooltipText = unit
                    ? `${multiDescription}\n${unitMessage}${unit}`
                    : multiDescription;
                  const fallbackTooltipText =
                    ma?.multilingualDescription?.descriptions?.find(
                      (description) => description.lang !== locale
                    )?.desc;
                  return (
                    <TooltipSelectOption
                      tooltipText={
                        tooltipText ?? fallbackTooltipText ?? ma.name
                      }
                    >
                      {ma.name}
                    </TooltipSelectOption>
                  );
                }}
              />
            </>
          )}
          {selectedField?.dynamicConfig?.type === "classification" && (
            <>
              <strong>
                <DinaMessage id="columnSelector_selectClassification" />
              </strong>
              <QueryRowClassificationSearch
                setValue={(newValue) => {
                  const parsedValue = JSON.parse(
                    newValue
                  ) as ClassificationSearchStates;
                  setDynamicFieldValue(parsedValue.selectedClassificationRank);
                  setDynamicFieldLabel(
                    _.startCase(parsedValue.selectedClassificationRank)
                  );
                }}
                value={dynamicFieldValue}
                isInColumnSelector={true}
              />
            </>
          )}
          <div className="d-grid">
            <Button
              className="btn btn-primary"
              disabled={!isValidField}
              onClick={onGeneratorItemInsert}
            >
              <DinaMessage id="columnSelector_addColumnButton" />
            </Button>
          </div>

          {displayedColumns.length > 0 && (
            <div className="mt-3">
              <strong>
                <DinaMessage id={"columnSelector_columnsToBeExported"} />
              </strong>
              {displayedColumns.map((column, index) => {
                return (
                  <GeneratorItem
                    key={column.columnValue}
                    column={column}
                    isTop={index === 0}
                    isBottom={index === displayedColumns.length - 1}
                    isDisabled={disabled ?? false}
                    onGeneratorItemDelete={onGeneratorItemDelete}
                    onGeneratorItemChangeOrder={onGeneratorItemChangeOrder}
                    onGeneratorItemChangeAlias={onGeneratorItemChangeAlias}
                  />
                );
              })}
            </div>
          )}
        </>
      )}
    </>
  );
}
