import React, { useMemo } from "react";
import { useIntl } from "react-intl";
import Select from "react-select";
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
  selectedOperator: GeoShapeOperator;

  /** The geo shape to search against. */
  searchShape: GeoPosition[][];
}

export function parseGeoShapeValue(
  value: string | undefined
): GeoShapeSearchStates | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value);

    if (
      typeof parsed?.selectedOperator !== "string" ||
      !SUPPORTED_GEO_SHAPE_OPERATORS.includes(parsed.selectedOperator) ||
      !Array.isArray(parsed?.searchShape)
    ) {
      console.warn("Invalid GeoShapeSearch value:", parsed);
      return null;
    }

    return parsed as GeoShapeSearchStates;
  } catch (e) {
    console.error("Failed to parse GeoShapeSearch value:", e);
    return null;
  }
}

// Operators supported for the geoshape search
export const SUPPORTED_GEO_SHAPE_OPERATORS = [
  "intersects",
  "within",
  "contains",
  "disjoint"
] as const;
export type GeoShapeOperator = (typeof SUPPORTED_GEO_SHAPE_OPERATORS)[number];

export default function QueryBuilderGeoShapeSearch({
  value,
  setValue
}: QueryBuilderGeoShapeSearchProps) {
  const { formatMessage } = useIntl();

  const geoShapeSearch = parseGeoShapeValue(value) ?? {
    selectedOperator: "intersects" as GeoShapeOperator,
    searchShape: []
  };

  const updateSearch = (updated: GeoShapeSearchStates) => {
    setValue?.(JSON.stringify(updated));
  };

  const operatorOptions = useMemo(
    () =>
      SUPPORTED_GEO_SHAPE_OPERATORS.map<SelectOption<string>>((option) => ({
        label: formatMessage({ id: "queryBuilder_operator_" + option }),
        value: option
      })),
    [formatMessage]
  );

  const selectedOperator = operatorOptions.find(
    (operator) => operator.value === geoShapeSearch.selectedOperator
  );

  return (
    <div>
      <Select<SelectOption<string>>
        options={operatorOptions}
        className="col-md-12 me-1 ps-0"
        value={selectedOperator}
        onChange={(selected) =>
          updateSearch({
            ...geoShapeSearch,
            selectedOperator: selected?.value as GeoShapeOperator
          })
        }
        captureMenuScroll={true}
        menuPlacement="auto"
        menuShouldScrollIntoView={false}
        minMenuHeight={600}
        menuPortalTarget={document.body}
        styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
      />

      <PolygonEditorMap
        coords={geoShapeSearch.searchShape}
        mode="edit"
        onCoordsChange={(coords) =>
          updateSearch({
            ...geoShapeSearch,
            searchShape: coords
          })
        }
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

  // Parse the geoShape states to get the values out of it.
  const geoShapeSearch = parseGeoShapeValue(value);

  // Don't build a query with an empty shape
  if (!geoShapeSearch || geoShapeSearch.searchShape.length === 0) {
    return {};
  }

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
