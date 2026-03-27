import React, { useState } from "react";
import { useIntl } from "react-intl";
import Select from "react-select";
import { useEffect } from "react";
import _ from "lodash";
// import { useQueryBuilderEnterToSearch } from "../query-builder-core-components/useQueryBuilderEnterToSearch";
import { SelectOption } from "packages/common-ui/lib/formik-connected/SelectField";
import { ESIndexMapping, TransformToDSLProps } from "../../types";
import { transformTextSearchToDSL } from "./QueryBuilderTextSearch";

interface QueryBuilderGeoShapeSearchProps {
  /**
   * Retrieve the current value from the Query Builder.
   */
  value?: string;

  /**
   * Pass the selected value to the Query Builder to store.
   */
  setValue?: (fieldPath: string) => void;

  /**
   * If being used in the column selector, operators do not need to be displayed.
   */
  isInColumnSelector: boolean;
}

export interface GeoShapeSearch {
  // ClassificationSearchStates {
  selectedGeoShapeRank: string;

  /** Operator to be used on the classification search. */
  selectedOperator: string;

  /** The value the user wishes to search. */
  searchValue: string;
}

export const SUPPORTED_GEO_SHAPE_OPERATORS = [
  "intersects",
  "within",
  "contains",
  "disjoint"
];

export default function QueryBuilderGeoShapeSearch({
  value,
  setValue,
  isInColumnSelector
}: QueryBuilderGeoShapeSearchProps) {
  const { formatMessage } = useIntl();

  // Used for submitting the query builder if pressing enter on a text field inside of the QueryBuilder.
  // const onKeyDown = useQueryBuilderEnterToSearch(isInColumnSelector);

  const [geoShapeSearch, setGoeShapeSearch] = useState<GeoShapeSearch>(() =>
    value
      ? JSON.parse(value)
      : {
          searchValue: "",
          selectedOperator: "",
          selectedGeoShapeRank: ""
        }
  );

  // Convert the state in this component to a value that can be stored in the Query Builder.
  useEffect(() => {
    if (setValue) {
      setValue(JSON.stringify(geoShapeSearch));
    }
  }, [geoShapeSearch, setValue]);

  // Convert a value from Query Builder into the geoShapeSearch in this component.
  // Dependent on the identifierConfig to indicate when it's changed.
  useEffect(() => {
    if (value) {
      setGoeShapeSearch(JSON.parse(value));
    }
  }, []);

  // Generate the operator options
  const operatorOptions = SUPPORTED_GEO_SHAPE_OPERATORS.map<
    SelectOption<string>
  >((option) => ({
    label: formatMessage({ id: "queryBuilder_operator_" + option }),
    value: option
  }));

  // Currently selected option, if no option can be found just select the first one.
  const selectedOperator = operatorOptions?.find(
    (operator) => operator.value === geoShapeSearch.selectedOperator
  );

  return (
    <div className={isInColumnSelector ? "" : "row"}>
      {/* Operator Selection */}
      <Select<SelectOption<string>>
        options={operatorOptions}
        className={`col me-1 ps-0`}
        value={selectedOperator}
        onChange={(selected) =>
          setGoeShapeSearch({
            ...geoShapeSearch,
            selectedOperator: selected?.value ?? ""
          })
        }
        captureMenuScroll={true}
        menuPlacement={"auto"}
        menuShouldScrollIntoView={false}
        minMenuHeight={600}
        menuPortalTarget={document.body}
        styles={{
          menuPortal: (base) => ({
            ...base,
            zIndex: 9999
          })
        }}
      />
    </div>
  );
}

/**
 * Using the query row for a target organism primary geoShape search, generate the elastic
 * search request to be made.
 */
export function transformGeoShapeToDSL({
  value,
  fieldInfo
}: TransformToDSLProps): any {
  // Parse the geoShape search options. Trim the search value.
  let geoShapeSearch: GeoShapeSearch;
  try {
    geoShapeSearch = JSON.parse(value);
  } catch (e) {
    console.error(e);
    return;
  }
  geoShapeSearch.searchValue = geoShapeSearch.searchValue.trim();

  if (
    geoShapeSearch.selectedOperator !== "empty" &&
    geoShapeSearch.selectedOperator !== "notEmpty"
  ) {
    if (!geoShapeSearch.searchValue) {
      return undefined;
    }
  }

  // The path to search against elastic search. Using the rank to generate this path.
  const fieldPath: string = fieldInfo?.path + "." + geoShapeSearch;

  const commonProps = {
    fieldPath,
    operation: geoShapeSearch.selectedOperator,
    queryType: "",
    value: geoShapeSearch.searchValue,
    fieldInfo: {
      ...fieldInfo,
      distinctTerm: false,

      // All managed attributes have keyword support.
      keywordMultiFieldSupport: true
    } as ESIndexMapping
  };

  return transformTextSearchToDSL({ ...commonProps });
}
