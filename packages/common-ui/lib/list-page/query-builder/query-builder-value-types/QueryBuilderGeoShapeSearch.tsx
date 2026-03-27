import React, { useState } from "react";
import { useIntl } from "react-intl";
import Select from "react-select";
import { useEffect } from "react";
import _ from "lodash";
import { SelectOption } from "packages/common-ui/lib/formik-connected/SelectField";
import { TransformToDSLProps } from "../../types";
import PolygonEditorMap from "../../../../../dina-ui/components/collection/site/PolygonEditorMap";
import { GeoPosition } from "packages/dina-ui/types/geo/geo.types";

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

export interface GeoShapeSearchStates {
  /** Operator to be used on the geo search search. */
  selectedOperator: string;

  /** The geo shape to search against. */
  searchShape: GeoPosition[][];
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

  const [geoShapeSearch, setGoeShapeSearch] = useState<GeoShapeSearchStates>(
    () =>
      value
        ? JSON.parse(value)
        : {
            selectedOperator: "intersects",
            searchShape: []
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
    <div className={isInColumnSelector ? "" : ""}>
      {/* Operator Selection */}
      <Select<SelectOption<string>>
        options={operatorOptions}
        className={`col-md-12 me-1 ps-0`}
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

      {/* Map */}
      <PolygonEditorMap
        coords={geoShapeSearch.searchShape}
        mode={"edit"}
        onCoordsChange={(coords) => {
          setGoeShapeSearch({
            ...geoShapeSearch,
            searchShape: coords
          });
        }}
      />
    </div>
  );
}

/**
 * Using the query row for a geoShape search, generate the elastic search request to be made.
 */
export function transformGeoShapeToDSL({
  value,
  fieldPath,
  fieldInfo
}: TransformToDSLProps): any {
  if (!fieldInfo) {
    return {};
  }

  const { parentType } = fieldInfo;

  // Parse the geoShape search options.
  let geoShapeSearch: GeoShapeSearchStates;
  try {
    geoShapeSearch = JSON.parse(value);
  } catch (e) {
    console.error(e);
    return;
  }

  console.warn(geoShapeSearch);
  console.warn(fieldInfo);

  const geoShapeQuery = {
    geo_shape: {
      [fieldPath]: {
        shape: {
          type: "polygon",
          coordinates: geoShapeSearch.searchShape
        },
        relation: geoShapeSearch.selectedOperator
      }
    }
  };

  // Apply the nested query if needed.
  return parentType
    ? {
        nested: {
          path: "included",
          query: geoShapeQuery
        }
      }
    : geoShapeQuery;
}
