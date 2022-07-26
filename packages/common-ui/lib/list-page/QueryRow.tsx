import { useState } from "react";
import {
  DateField,
  NumberField,
  QueryLogicSwitchField,
  SelectField,
  TextField
} from "..";
import { useElasticSearchDistinctTerm } from "./useElasticSearchDistinctTerm";
import { AutoSuggestTextField } from "../formik-connected/AutoSuggestTextField";
import { FaPlus, FaMinus } from "react-icons/fa";
import moment from "moment";
import { FormikContextType, useFormikContext } from "formik";
import lodash, { startCase } from "lodash";
import { ESIndexMapping, TypeVisibility } from "./types";
import { useIntl } from "react-intl";

export interface QueryRowProps {
  /** Index name passed from the QueryPage component. */
  indexName: string;

  esIndexMapping: ESIndexMapping[];
  index: number;
  addRow?: () => void;
  removeRow?: (index) => void;
  name: string;
  formik?: FormikContextType<any>;
}

export interface QueryRowExportProps {
  fieldName: string;
  matchValue?: string;
  fieldRangeStart?: string;
  fieldRangeEnd?: string;
  matchType?: string;
  numericalMatchType?: string;
  compoundQueryType?: string;
  number?: string;
  date?: string;
  boolean?: string;
  type?: string;
  parentName?: string;
  parentPath?: string;
  distinctTerm?: boolean;
}

const queryRowMatchOptions = [
  { label: "PARTIAL_MATCH", value: "match" },
  { label: "EXACT_MATCH", value: "term" }
];

const queryRowNumericalMatchOptions = (isDateField: boolean) => {
  const options = [
    { label: "Equal to", value: "equal" },
    { label: "Greater than", value: "greaterThan" },
    { label: "Greater than or equal to", value: "greaterThanEqual" },
    { label: "Less than", value: "lessThan" },
    { label: "Less than or equal to", value: "lessThanEqual" }
  ];

  // Only the data field should contain this.
  if (isDateField) {
    options.splice(1, 0, { label: "Contains", value: "contains" });
  }

  return options;
};

const queryRowBooleanOptions = [
  { label: "TRUE", value: "true" },
  { label: "FALSE", value: "false" }
];

export function QueryRow(queryRowProps: QueryRowProps) {
  const formikProps = useFormikContext();
  const { esIndexMapping, index, addRow, removeRow, name, indexName } =
    queryRowProps;
  const { formatMessage, messages } = useIntl();

  const initState = {
    matchValue: null,
    matchType: "match",
    numericalMatchType: "equal",
    date: moment().format("YYYY-MM-DD"),
    boolean: "true",
    number: null
  };

  const [fieldName, setFieldName] = useState<string>(
    (formikProps.values as any)?.queryRows?.[index].fieldName
  );

  const dataFromIndexMapping = esIndexMapping?.find(
    attribute => attribute.value === fieldName
  );

  const selectedGroups: string[] = (formikProps.values as any)?.group;

  // Depending on the type, it changes what fields need to be displayed.
  const typeVisibility: TypeVisibility = {
    isText:
      dataFromIndexMapping?.type === "text" &&
      dataFromIndexMapping?.distinctTerm !== true,
    isSuggestedText: dataFromIndexMapping?.distinctTerm === true,
    isBoolean: dataFromIndexMapping?.type === "boolean",
    isNumber:
      dataFromIndexMapping?.type === "long" ||
      dataFromIndexMapping?.type === "short" ||
      dataFromIndexMapping?.type === "integer" ||
      dataFromIndexMapping?.type === "byte" ||
      dataFromIndexMapping?.type === "double" ||
      dataFromIndexMapping?.type === "float" ||
      dataFromIndexMapping?.type === "half_float" ||
      dataFromIndexMapping?.type === "scaled_float" ||
      dataFromIndexMapping?.type === "unsigned",
    isDate: dataFromIndexMapping?.type === "date"
  };

  function onSelectionChange(value) {
    const newDataFromIndexMapping = esIndexMapping.find(
      attribute => attribute.value === value
    );

    formikProps.setFieldValue(`${name}[${index}]`, {
      ...initState,
      fieldName: value,
      type: newDataFromIndexMapping?.type ?? "text",
      parentPath: newDataFromIndexMapping?.parentPath,
      parentName: newDataFromIndexMapping?.parentName,
      distinctTerm: newDataFromIndexMapping?.distinctTerm
    });

    setFieldName(value);
  }

  // Get all of the attributes from the index for the filter dropdown.
  const simpleRowOptions = esIndexMapping
    ?.filter(prop => !prop.parentPath)
    ?.map(prop => ({
      label: messages["field_" + prop.label]
        ? formatMessage({ id: "field_" + prop.label })
        : startCase(prop.label),
      value: prop.value
    }))
    ?.sort((aProp, bProp) => aProp.label.localeCompare(bProp.label));

  // Get all the relationships for the search dropdown.
  const nestedRowOptions = esIndexMapping
    ?.filter(prop => !!prop.parentPath)
    ?.map(prop => {
      return {
        parentName: prop.parentName,
        label: messages["field_" + prop.label]
          ? formatMessage({ id: "field_" + prop.label })
          : startCase(prop.label),
        value: prop.value
      };
    })
    ?.sort((aProp, bProp) => aProp.label.localeCompare(bProp.label));

  // Using the parent name, group the relationships into sections.
  const groupedNestRowOptions = lodash
    .chain(nestedRowOptions)
    .groupBy(prop => prop.parentName)
    .map((group, key) => {
      return {
        label: messages["title_" + key]
          ? formatMessage({ id: "title_" + key })
          : startCase(key),
        options: group
      };
    })
    .sort((aProp, bProp) => aProp.label.localeCompare(bProp.label))
    .value();

  const queryRowOptions = simpleRowOptions
    ? [...simpleRowOptions, ...groupedNestRowOptions]
    : [];

  function fieldProps(fldName: string, idx: number) {
    return `${name}[${idx}].${fldName}`;
  }

  // Custom styling to indent the group option menus.
  const customStyles = {
    // Grouped options (relationships) should be indented.
    option: (baseStyle, { data }) => {
      if (data?.parentName) {
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

    // When viewing a group item, the parent name should be prefixed on to the value.
    singleValue: (baseStyle, { data }) => {
      if (data?.parentName) {
        return {
          ...baseStyle,
          ":before": {
            content: `'${startCase(data.parentName)} '`
          }
        };
      }

      return {
        ...baseStyle
      };
    }
  };

  return (
    <div className="row">
      <div className="col-md-6 d-flex">
        {index > 0 && (
          <div style={{ width: index > 0 ? "8%" : "100%" }}>
            <QueryLogicSwitchField
              name={fieldProps("compoundQueryType", index)}
              removeLabel={true}
              className={"compoundQueryType" + index}
            />
          </div>
        )}
        <div style={{ width: index > 0 ? "92%" : "100%" }}>
          <SelectField
            name={fieldProps("fieldName", index)}
            options={queryRowOptions as any}
            onChange={onSelectionChange}
            className={`flex-grow-1 me-2 ps-0`}
            removeLabel={true}
            styles={customStyles}
          />
        </div>
      </div>
      <div className="col-md-6">
        <div className="d-flex">
          {typeVisibility.isText && (
            <>
              <TextField
                name={fieldProps("matchValue", index)}
                className="me-1 flex-fill"
                removeLabel={true}
              />
              <SelectField
                name={fieldProps("matchType", index)}
                options={queryRowMatchOptions}
                className="me-1 flex-fill"
                removeLabel={true}
              />
            </>
          )}
          {typeVisibility.isSuggestedText && (
            <>
              <AutoSuggestTextField
                name={fieldProps("matchValue", index)}
                removeLabel={true}
                className="me-1 flex-fill"
                blankSearchBackend={"preferred"}
                customOptions={value =>
                  useElasticSearchDistinctTerm({
                    fieldName:
                      dataFromIndexMapping?.parentPath +
                      "." +
                      dataFromIndexMapping?.path +
                      "." +
                      dataFromIndexMapping?.label,
                    groups: selectedGroups,
                    relationshipType: dataFromIndexMapping?.parentName,
                    indexName
                  })?.filter(suggestion =>
                    suggestion?.toLowerCase()?.includes(value?.toLowerCase())
                  )
                }
              />
            </>
          )}

          {/* Number and Date have there own set of numerical match types */}
          {(typeVisibility.isDate || typeVisibility.isNumber) && (
            <SelectField
              name={fieldProps("numericalMatchType", index)}
              options={queryRowNumericalMatchOptions(typeVisibility.isDate)}
              className="me-2 col-sm-5"
              removeLabel={true}
            />
          )}

          {/* Date picker type */}
          {typeVisibility.isDate && (
            <DateField
              name={fieldProps("date", index)}
              className="me-2 flex-fill"
              removeLabel={true}
              partialDate={true}
            />
          )}

          {/* Number type */}
          {typeVisibility.isNumber && (
            <NumberField
              name={fieldProps("number", index)}
              className="me-2 flex-fill"
              removeLabel={true}
            />
          )}

          {/* Boolean field (Dropdown with TRUE/FALSE) */}
          {typeVisibility.isBoolean && (
            <SelectField
              name={fieldProps("boolean", index)}
              options={queryRowBooleanOptions}
              className="me-1 flex-fill"
              removeLabel={true}
            />
          )}
          {/* Disabled text field when no search filter is selected. */}
          {!fieldName && (
            <TextField
              name={fieldProps("matchValue", index)}
              className="me-1 flex-fill"
              removeLabel={true}
              readOnly={true}
            />
          )}

          {/* Plus / Minus Buttons */}
          {index === 0 ? (
            <>
              {fieldName && (
                <FaPlus
                  onClick={addRow as any}
                  size="2em"
                  style={{ cursor: "pointer" }}
                  name={fieldProps("addRow", index)}
                />
              )}
            </>
          ) : (
            <FaMinus
              onClick={() => removeRow?.(index)}
              size="2em"
              style={{ cursor: "pointer" }}
              name={fieldProps("removeRow", index)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
