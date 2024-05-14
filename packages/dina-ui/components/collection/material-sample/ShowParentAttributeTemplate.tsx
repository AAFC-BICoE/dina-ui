import {
  FieldSet,
  SelectField,
  SelectOption,
  filterBy,
  useQuery
} from "common-ui";
import { FieldArray, useFormikContext } from "formik";
import { get, startCase } from "lodash";
import { useLayoutEffect, useEffect, useMemo, useState } from "react";
import { FaMinus, FaPlus } from "react-icons/fa";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  ManagedAttribute,
  SHOW_PARENT_ATTRIBUTES_COMPONENT_NAME
} from "../../../types/collection-api";
import { MATERIAL_SAMPLE_ATTR_NAMES } from "./ShowParentAttributesField";

interface ShowParentAttributeTemplateProps {
  className?: string;
  id?: string;
}
export function ShowParentAttributeTemplate({
  className,
  id
}: ShowParentAttributeTemplateProps) {
  const { locale } = useDinaIntl();
  const { formatMessage } = useDinaIntl();
  const formik = useFormikContext<any>();
  const fieldArrayName = `parentAttributes`;
  const parentAttributes = get(formik.values, fieldArrayName);

  useLayoutEffect(() => {
    toggleIsOptionDisabled();
  }, [parentAttributes]);

  function convertFieldOption(
    parentPath: string,
    fieldName: string,
    label: string
  ) {
    const isDisabled =
      parentAttributes && parentAttributes.indexOf(fieldName) > -1
        ? true
        : false;
    return {
      value: fieldName,
      label,
      parentPath,
      isDisabled
    };
  }

  const maFieldOptions = MATERIAL_SAMPLE_ATTR_NAMES.map((fieldName) =>
    convertFieldOption(
      "materialSample",
      fieldName,
      formatMessage(`field_${fieldName}` as any) ??
        formatMessage(fieldName as any)
    )
  );

  const { response: attrResp } = useQuery<ManagedAttribute[]>({
    path: "collection-api/managed-attribute",
    filter: filterBy([], {
      extraFilters: [
        {
          selector: "managedAttributeComponent",
          comparison: "==",
          arguments: "ORGANISM"
        }
      ]
    })(""),
    page: { limit: 1000 }
  });

  const ogsmManagedAttributesOptions: SelectOption<string>[] = [];
  if (attrResp) {
    attrResp.data.forEach((attr) => {
      const label =
        attr.multilingualDescription?.descriptions?.find(
          (description) => description.lang === locale
        )?.desc ?? attr.name;
      ogsmManagedAttributesOptions.push(
        convertFieldOption("organism.managedAttributes", attr.key, label)
      );
    });
  }

  useEffect(() => {
    setSelectOptions([
      {
        label: formatMessage("materialSample"),
        options: maFieldOptions
      },
      {
        label: `${formatMessage("organism")} ${formatMessage(
          "managedAttributes"
        )}`,
        options: ogsmManagedAttributesOptions
      }
    ]);
  }, [ogsmManagedAttributesOptions]);

  const [selectOptions, setSelectOptions] = useState([
    {
      label: formatMessage("materialSample"),
      options: maFieldOptions
    },
    {
      label: `${formatMessage("organism")} ${formatMessage(
        "managedAttributes"
      )}`,
      options: ogsmManagedAttributesOptions
    }
  ]);

  function toggleIsOptionDisabled() {
    setSelectOptions(
      selectOptions.map((item) => ({
        ...item,
        options: item.options.map((subItem) =>
          parentAttributes?.indexOf(subItem.value) > -1
            ? { ...subItem, isDisabled: true }
            : { ...subItem, isDisabled: false }
        )
      }))
    );
  }

  const singlValueFun = (baseStyle, { data }) => {
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
  };

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
      singleValue: singlValueFun
    }),
    []
  );

  return (
    <FieldSet
      className={className}
      id={id}
      legend={<DinaMessage id="showParentAttributes" />}
      componentName={SHOW_PARENT_ATTRIBUTES_COMPONENT_NAME}
      sectionName="parent-attributes-section"
    >
      <FieldArray
        name={fieldArrayName}
        render={(arrayHelper) => {
          function onAddRow() {
            arrayHelper.push("");
          }
          function onDeleteRow(index: number) {
            arrayHelper.remove(index);
          }
          return (
            <>
              <div className="d-flex justify-content-between">
                <div className="flex-grow-1" />
                <FaPlus
                  className="ms-2"
                  onClick={onAddRow}
                  size="2em"
                  onMouseOver={(event) =>
                    (event.currentTarget.style.color = "blue")
                  }
                  onMouseOut={(event) => (event.currentTarget.style.color = "")}
                />
              </div>

              {parentAttributes?.map((_pa: string, idx: number) => (
                <div key={idx} className="d-flex justify-content-between">
                  <SelectField
                    className="flex-grow-1"
                    hideLabel={true}
                    options={selectOptions}
                    disableTemplateCheckbox={true}
                    name={`${fieldArrayName}[${idx}]`}
                    selectProps={{
                      menuPortalTarget: document.body,
                      styles: customStyles
                    }}
                  />
                  <FaMinus
                    className="ms-2"
                    onClick={() => onDeleteRow(idx)}
                    size="2em"
                    onMouseOver={(event) =>
                      (event.currentTarget.style.color = "blue")
                    }
                    onMouseOut={(event) =>
                      (event.currentTarget.style.color = "")
                    }
                  />
                </div>
              ))}
            </>
          );
        }}
      />
    </FieldSet>
  );
}
