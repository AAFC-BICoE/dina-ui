import { useFormikContext } from "formik";
import _ from "lodash";
import { useMemo } from "react";
import {
  ResourceSelectField,
  SelectField,
  SimpleSearchFilterBuilder,
  TooltipSelectOption
} from "../../../../common-ui/lib";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  ManagedAttribute,
  VocabularyElement
} from "../../../types/collection-api";
import { VocabularyOption } from "../../collection/VocabularySelectField";
import { WorkbookColumnMappingFields } from "./WorkbookColumnMapping";
import { useColumnMapping } from "./useColumnMapping";

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
  disabled: boolean;
  onFieldChanged?: (newFieldPath) => void;
}

export function WorkbookFieldSelectField({
  columnIndex,
  fieldOptions,
  disabled = false,
  onFieldChanged
}: WorkbookFieldSelectFieldProps) {
  const { locale, formatMessage } = useDinaIntl();
  const { taxonomicRanks } = useColumnMapping();
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

  function toOption(value: VocabularyElement): VocabularyOption {
    const label =
      (value?.multilingualTitle?.titles || []).find(
        (item) => item.lang === locale
      )?.title ||
      value.name ||
      "";
    return { label, value: value.key };
  }
  const classificationOptions = taxonomicRanks.map((item) => toOption(item));

  return (
    <div className="d-flex">
      <SelectField
        className="flex-fill"
        name={`fieldMap[${columnIndex}].targetField`}
        options={fieldOptions}
        selectProps={{
          isClearable: true,
          menuPortalTarget: document.body,
          styles: customStyles
        }}
        hideLabel={true}
        onChange={onFieldMapChanged}
        disabled={disabled}
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
            filter={(input: string) =>
              SimpleSearchFilterBuilder.create<ManagedAttribute>()
                .where("managedAttributeComponent", "EQ", "MATERIAL_SAMPLE")
                .searchFilter("name", input)
                .build()
            }
            isDisabled={disabled}
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
            isDisabled={disabled}
            selectProps={{
              className: "flex-fill ms-2",
              menuPortalTarget: document.body,
              styles: { menuPortal: (base) => ({ ...base, zIndex: 9999 }) }
            }}
            filter={(input: string) =>
              SimpleSearchFilterBuilder.create<ManagedAttribute>()
                .where("managedAttributeComponent", "EQ", "PREPARATION")
                .searchFilter("name", input)
                .build()
            }
            model="collection-api/managed-attribute"
            optionLabel={(cm) => cm.name}
          />
        </>
      )}

      {fieldMap[columnIndex]?.targetField ===
        "collectingEvent.managedAttributes" && (
        <>
          <ResourceSelectField<ManagedAttribute>
            name={`fieldMap[${columnIndex}].targetKey`}
            hideLabel={true}
            isDisabled={disabled}
            selectProps={{
              className: "flex-fill ms-2",
              menuPortalTarget: document.body,
              styles: { menuPortal: (base) => ({ ...base, zIndex: 9999 }) }
            }}
            filter={(input: string) =>
              SimpleSearchFilterBuilder.create<ManagedAttribute>()
                .where("managedAttributeComponent", "EQ", "COLLECTING_EVENT")
                .searchFilter("name", input)
                .build()
            }
            model="collection-api/managed-attribute"
            optionLabel={(cm) => cm.name}
          />
        </>
      )}

      {fieldMap[columnIndex]?.targetField ===
        "organism.determination.scientificNameDetails" && (
        <div className="flex-fill">
          <SelectField
            name={`fieldMap[${columnIndex}].targetKey.key`}
            options={classificationOptions}
            hideLabel={true}
            selectProps={{
              className: "ms-2",
              menuPortalTarget: document.body,
              styles: { menuPortal: (base) => ({ ...base, zIndex: 9999 }) }
            }}
          />
        </div>
      )}
    </div>
  );
}
