import { useFormikContext } from "formik";
import { startCase } from "lodash";
import { useMemo } from "react";
import {
  ResourceSelectField,
  SelectField,
  TooltipSelectOption,
  filterBy
} from "../../../../common-ui/lib";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { ManagedAttribute } from "../../../types/collection-api";
import { WorkbookColumnMappingFields } from "./WorkbookColumnMapping";

export interface WorkbookFieldSelectFieldProps {
  columnIndex: number;
  fieldOptions: {
    label: string;
    value?: string;
    options?: {
      label: string;
      value: string;
      parentPath: string;
    }[];
  }[];
  onFieldChanged?: (newFieldPath) => void;
}

export function WorkbookFieldSelectField({
  columnIndex,
  fieldOptions,
  onFieldChanged
}: WorkbookFieldSelectFieldProps) {
  const { locale, formatMessage } = useDinaIntl();
  // Custom styling to indent the group option menus.
  const customStyles = useMemo(
    () => ({
      placeholder: (provided, _) => ({
        ...provided,
        color: "rgb(87,120,94)"
      }),
      menu: (base) => ({ ...base, zIndex: 1050 }),
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
  const {
    values: { fieldMap },
    setFieldValue
  } = useFormikContext<WorkbookColumnMappingFields>();

  const onFieldMapChanged = (newFieldPath) => {
    setFieldValue(`fieldMap[${columnIndex}].targetKey`, "");
    setFieldValue(
      `fieldMap[${columnIndex}].skipped`,
      newFieldPath === undefined
    );
    onFieldChanged?.(newFieldPath);
  };

  return (
    <div className="d-flex">
      <SelectField
        className="flex-fill"
        name={`fieldMap[${columnIndex}].targetField`}
        options={fieldOptions}
        selectProps={{
          isClearable: true,
          menuPortalTarget: document.body,
          styles: { menuPortal: (base) => ({ ...base, zIndex: 9999 }) }
        }}
        hideLabel={true}
        styles={customStyles}
        onChange={onFieldMapChanged}
      />
      {fieldMap[columnIndex]?.targetField === "managedAttributes" && (
        <div className="flex-fill">
          <ResourceSelectField<ManagedAttribute>
            name={`fieldMap[${columnIndex}].targetKey`}
            hideLabel={true}
            selectProps={{
              className: "ms-2",
              menuPortalTarget: document.body,
              styles: { menuPortal: (base) => ({ ...base, zIndex: 9999 }) }
            }}
            filter={filterBy(["name"], {
              extraFilters: [
                {
                  selector: "managedAttributeComponent",
                  comparison: "==",
                  arguments: "MATERIAL_SAMPLE"
                }
              ]
            })}
            additionalSort={"name"}
            showGroupCategary={true}
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
                  tooltipText={tooltipText ?? fallbackTooltipText ?? ma.name}
                >
                  {ma.name}
                </TooltipSelectOption>
              );
            }}
          />
        </div>
      )}

      {fieldMap[columnIndex]?.targetField ===
        "preparationManagedAttributes" && (
        <>
          <ResourceSelectField<ManagedAttribute>
            name={`fieldMap[${columnIndex}].targetKey`}
            hideLabel={true}
            selectProps={{
              className: "flex-fill ms-2",
              menuPortalTarget: document.body,
              styles: { menuPortal: (base) => ({ ...base, zIndex: 9999 }) }
            }}
            filter={filterBy(["name"], {
              extraFilters: [
                {
                  selector: "managedAttributeComponent",
                  comparison: "==",
                  arguments: "PREPARATION"
                }
              ]
            })}
            model="collection-api/managed-attribute"
            optionLabel={(cm) => cm.name}
          />
        </>
      )}
    </div>
  );
}
