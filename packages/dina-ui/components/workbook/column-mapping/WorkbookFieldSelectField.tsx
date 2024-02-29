import { useFormikContext } from "formik";
import { startCase } from "lodash";
import { useMemo, useState } from "react";
import {
  ResourceSelect,
  ResourceSelectField,
  RsqlFilterObject,
  SelectField,
  filterBy,
  useAccount
} from "../../../../common-ui/lib";
import { ManagedAttribute } from "../../../types/collection-api";
import { WorkbookColumnMappingFields } from "./WorkbookColumnMapping";
import { PersistedResource } from "kitsu";

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
  const [targetKey, setTargetKey] = useState<PersistedResource<ManagedAttribute> | undefined>();
  const { isAdmin, groupNames } = useAccount();
  const groupFilter: RsqlFilterObject[] = !isAdmin
    ? [
        // Restrict the list to just the user's groups:
        {
          selector: "group",
          comparison: "=in=",
          arguments: groupNames || []
        }
      ]
    : [];

  const onFieldMapChanged = (newFieldPath) => {
    setFieldValue(`fieldMap[${columnIndex}].targetKey`, "");
    setTargetKey(undefined);
    onFieldChanged?.(newFieldPath);
  };

  return (
    <div className="d-flex">
      <SelectField
        className="flex-fill"
        name={`fieldMap[${columnIndex}].targetField`}
        options={fieldOptions}
        selectProps={{ isClearable: true }}
        hideLabel={true}
        styles={customStyles}
        onChange={onFieldMapChanged}
      />
      {fieldMap[columnIndex].targetField === "managedAttributes" && (
        <>
          <ResourceSelect<ManagedAttribute>
            selectProps={{ className: "flex-fill ms-2" }}
            filter={filterBy(["name"], {
              extraFilters: [
                {
                  selector: "managedAttributeComponent",
                  comparison: "==",
                  arguments: "MATERIAL_SAMPLE"
                },
                ...groupFilter
              ]
            })}
            model="collection-api/managed-attribute"
            optionLabel={(cm) => cm.name}
            onChange={(resource) => {
              const resourceKey =
                (resource as PersistedResource<ManagedAttribute>)?.key ?? "";
              setTargetKey(resource as any);
              setFieldValue(`fieldMap[${columnIndex}].targetKey`, resourceKey);
              console.log(fieldMap);
            }}
            value={targetKey}
          />
          <input
            type="hidden"
            name={`fieldMap[${columnIndex}].targetKey`}
          />
        </>
      )}

      {fieldMap[columnIndex].targetField === "preparationManagedAttributes" && (
        <>
          <ResourceSelect<ManagedAttribute>
            selectProps={{ className: "flex-fill ms-2" }}
            filter={filterBy(["name"], {
              extraFilters: [
                {
                  selector: "managedAttributeComponent",
                  comparison: "==",
                  arguments: "PREPARATION"
                },
                // Restrict the list to just the user's groups:
                ...groupFilter
              ]
            })}
            model="collection-api/managed-attribute"
            optionLabel={(cm) => cm.name}
            onChange={(resource) => {
              const resourceKey =
                (resource as PersistedResource<ManagedAttribute>)?.key ?? "";
              setFieldValue(`fieldMap[${columnIndex}].targetKey`, resourceKey);
            }}
          />
          <input type="hidden" name={`fieldMap[${columnIndex}].targetKey`} />
        </>
      )}
    </div>
  );
}
