import { CommonMessage } from "../intl/common-ui-intl";
import {
  FilterDropdownOption,
  FilterRowPredicate,
  FilterRowSearchType
} from "./FilterRow";

/** Predicate dropdown options for filtering on date attributes. */
export const BOOLEAN_PREDICATE_OPTIONS: FilterDropdownOption<FilterRowPredicate>[] =
  [
    {
      label: <CommonMessage id="IS" />,
      value: "IS"
    },
    {
      label: <CommonMessage id="ISNOT" />,
      value: "IS NOT"
    }
  ];

/** Predicate dropdown options for filtering on date attributes. */
export const DATE_PREDICATE_OPTIONS: FilterDropdownOption<FilterRowPredicate>[] =
  [
    {
      label: <CommonMessage id="IS" />,
      value: "IS"
    },
    {
      label: <CommonMessage id="ISNOT" />,
      value: "IS NOT"
    },
    {
      label: <CommonMessage id="filterFrom" />,
      value: "FROM"
    },
    {
      label: <CommonMessage id="filterUntil" />,
      value: "UNTIL"
    },
    {
      label: <CommonMessage id="filterBetween" />,
      value: "BETWEEN"
    }
  ];

/** Search types for String searches */
export const STRING_SEARCH_TYPES: FilterDropdownOption<FilterRowSearchType>[] =
  [
    {
      label: <CommonMessage id="filterPartialMatch" />,
      value: "PARTIAL_MATCH"
    },
    {
      label: <CommonMessage id="filterExactMatch" />,
      value: "EXACT_MATCH"
    },
    {
      label: <CommonMessage id="filterBlankField" />,
      value: "BLANK_FIELD"
    }
  ];

/** Search types for attributes that only support exact matching. */
export const SEARCH_TYPES_EXACT_ONLY: FilterDropdownOption<FilterRowSearchType>[] =
  [
    {
      label: <CommonMessage id="filterExactMatch" />,
      value: "EXACT_MATCH"
    }
  ];
