import { useState } from "react";
import {
  DateField,
  FieldWrapperProps,
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
import lodash from "lodash";
import { TypeVisibility } from "./types";
import { QueryPageActions, QueryPageStates } from "./queryPageReducer";

export interface QueryRowProps extends FieldWrapperProps {
  /**
   * Perform actions using the reducer. This is the "brains" of the Query Page.
   */
  dispatch: React.Dispatch<QueryPageActions>;

  /**
   * Retrieve all of the states from the reducer.
   */
  states: QueryPageStates;

  /**
   * The current row number. Each row has a unique number.
   */
  index: number;

  /**
   * The plus button was clicked, callback to QueryBuilder.
   */
  addRow?: () => void;

  /**
   * The minus button was clicked, callback to the QueryBuilder.
   */
  removeRow?: (index) => void;

  /**
   * Formik context for editing/reading the current form.
   */
  formik?: FormikContextType<any>;
}

export interface QueryRowExportProps {
  fieldName: string;
  matchValue?: string;
  fieldRangeStart?: string;
  fieldRangeEnd?: string;
  matchType?: string;
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

const queryRowBooleanOptions = [
  { label: "TRUE", value: "true" },
  { label: "FALSE", value: "false" }
];

export function QueryRow(queryRowProps: QueryRowProps) {
  const formikProps = useFormikContext();
  const { index, addRow, removeRow, name, dispatch, states } = queryRowProps;
  const { indexName, elasticSearchIndex } = states;

  const initState = {
    matchValue: null,
    matchType: "match",
    date: moment().format("YYYY-MM-DD"),
    boolean: "true",
    number: null
  };

  const [fieldName, setFieldName] = useState<string>(
    (formikProps.values as any)?.queryRows?.[index].fieldName
  );

  const dataFromIndexMapping = elasticSearchIndex?.find(
    attribute => attribute.value === fieldName
  );

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
    const newDataFromIndexMapping = elasticSearchIndex.find(
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
  const simpleRowOptions = elasticSearchIndex
    ?.filter(prop => !prop.label.startsWith("group"))
    ?.filter(prop => !prop.parentPath)
    ?.sort((a, b) => a.label.localeCompare(b.label))
    ?.map(prop => ({
      label: prop.label,
      value: prop.value
    }));

  // Get all the relationships for the search dropdown.
  const nestedRowOptions = elasticSearchIndex
    ?.filter(prop => !!prop.parentPath)
    ?.sort((a, b) => a.label.localeCompare(b.label))
    ?.map(prop => {
      return {
        parentName: prop.parentName,
        label: prop.label,
        value: prop.value
      };
    });

  // Using the parent name, group the relationships into sections.
  const groupedNestRowOptions = lodash
    .chain(nestedRowOptions)
    .groupBy(prop => prop.parentName)
    .map((group, key) => {
      return {
        label: key,
        options: group
      };
    })
    .value();

  const queryRowOptions = simpleRowOptions
    ? [...simpleRowOptions, ...groupedNestRowOptions]
    : [];

  function fieldProps(fldName: string, idx: number) {
    return `${name}[${idx}].${fldName}`;
  }

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
                alwaysShowSuggestions={true}
                suggestions={value =>
                  useElasticSearchDistinctTerm({
                    dispatch,
                    states,
                    fieldName:
                      dataFromIndexMapping?.parentPath +
                      "." +
                      dataFromIndexMapping?.path +
                      "." +
                      dataFromIndexMapping?.label,
                    relationshipType: dataFromIndexMapping?.parentName,
                    indexName
                  })?.filter(suggestion =>
                    suggestion?.toLowerCase()?.includes(value?.toLowerCase())
                  )
                }
              />
            </>
          )}
          {typeVisibility.isDate && (
            <DateField
              name={fieldProps("date", index)}
              className="me-1 flex-fill"
              removeLabel={true}
            />
          )}
          {typeVisibility.isBoolean && (
            <SelectField
              name={fieldProps("boolean", index)}
              options={queryRowBooleanOptions}
              className="me-1 flex-fill"
              removeLabel={true}
            />
          )}
          {typeVisibility.isNumber && (
            <NumberField
              name={fieldProps("number", index)}
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
