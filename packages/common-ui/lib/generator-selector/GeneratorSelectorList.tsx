import { LoadingSpinner, SelectField, useApiClient } from "..";
import { DinaMessage } from "../../../dina-ui/intl/dina-ui-intl";
import React, { useState, useEffect, useMemo } from "react";
import { Button } from "react-bootstrap";
import { GeneratorItem } from "./GeneratorItem";
import { ManagedAttributeSearchStates } from "../list-page/query-builder/query-builder-value-types/QueryBuilderManagedAttributeSearch";
import { FieldExtensionSearchStates } from "../list-page/query-builder/query-builder-value-types/QueryBuilderFieldExtensionSearch";
import { RelationshipPresenceSearchStates } from "../list-page/query-builder/query-builder-value-types/QueryBuilderRelationshipPresenceSearch";
import { IdentifierSearchStates } from "../list-page/query-builder/query-builder-value-types/QueryBuilderIdentifierSearch";
import { GeneratorColumn, GeneratorSelectorProps } from "./GeneratorSelector";
import { startCase } from "lodash";

export interface GeneratorSelectorListProps extends GeneratorSelectorProps {
  loading: boolean;
}

export function GeneratorSelectorList({
  generatorFields,
  displayedColumns,
  setDisplayedColumns,
  loading,
  disabled
}: GeneratorSelectorListProps) {
  const { apiClient } = useApiClient();

  // The selected field from the query field selector.
  const [selectedField, setSelectedField] = useState<GeneratorColumn>();

  // Used for dynamic fields to store the specific dynamic value selected.
  const [dynamicFieldValue, setDynamicFieldValue] = useState<string>();

  // Used for the "Add column" button to determine if it should be disabled or not.
  const [isValidField, setIsValidField] = useState<boolean>(false);

  // Handle what happens when the user selects an option from the Query Field Selector. If a dynamic
  // field is selected, verify we are at a point where it can be added.
  useEffect(() => {
    if (selectedField && generatorFields) {
      // Check if it's a dynamic type.
      if (selectedField.dynamicConfig) {
        if (dynamicFieldValue) {
          switch (selectedField.dynamicConfig.type) {
            case "managedAttribute":
              const managedAttributeValues: ManagedAttributeSearchStates =
                JSON.parse(dynamicFieldValue);
              if (managedAttributeValues?.selectedManagedAttribute?.id) {
                setIsValidField(true);
                return;
              }
              break;
            case "fieldExtension":
              const fieldExtensionValues: FieldExtensionSearchStates =
                JSON.parse(dynamicFieldValue);
              if (
                fieldExtensionValues.selectedExtension &&
                fieldExtensionValues.selectedField
              ) {
                setIsValidField(true);
                return;
              }
              break;
            case "relationshipPresence":
              const relationshipPresenceValues: RelationshipPresenceSearchStates =
                JSON.parse(dynamicFieldValue);
              if (relationshipPresenceValues.selectedRelationship) {
                setIsValidField(true);
                return;
              }
              break;
            case "identifier":
              const identifierValues: IdentifierSearchStates =
                JSON.parse(dynamicFieldValue);
              if (identifierValues?.selectedIdentifier) {
                setIsValidField(true);
                return;
              }
              break;
          }
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
        selectedField
      ];

      setDisplayedColumns(newDisplayedColumns);
      setSelectedField(undefined);
    }
  };

  const onGeneratorItemSelected = (columnValue: string) => {
    if (generatorFields) {
      const generatorField = generatorFields.find(
        (genField) => genField.value === columnValue
      );

      if (generatorField && generatorField.value) {
        // Todo, dynamic config needs to be loaded here.

        const newSelectedField: GeneratorColumn = {
          columnLabel: generatorField.label,
          columnValue: generatorField.value,
          columnAlias: ""
        };
        setSelectedField(newSelectedField);
      }
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
              content: `'${startCase(data.parentPath)} '`
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
            className="flex-fill"
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
          {selectedField?.dynamicConfig?.type === "managedAttribute" && <></>}
          <div className="mt-2 d-grid">
            <Button
              className="btn btn-primary"
              disabled={!isValidField}
              onClick={onGeneratorItemInsert}
            >
              <DinaMessage id="columnSelector_addColumnButton" />
            </Button>
          </div>
          <br />

          {displayedColumns.length > 0 && (
            <>
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
            </>
          )}
        </>
      )}
    </>
  );
}
