import { get } from "lodash";
import { CommonMessage } from "../intl/common-ui-intl";

/**
 * Helper cell function to display boolean values in tables. The true/false value will be displayed
 * with a true/false string (which is also translated)
 *
 * Null/undefined values will be displayed as an empty string.
 *
 * @param label Column header to be used.
 * @param accessor Accessor for elastic search.
 * @returns The cell to be displayed.
 */
export function BooleanCell(label: string, accessor?: string) {
  return {
    Cell: ({ original }) => {
      const booleanValue = get(original, accessor ?? label).toString();
      if (booleanValue === "true") {
        return <CommonMessage id="true" />;
      } else if (booleanValue === "false") {
        return <CommonMessage id="false" />;
      } else {
        return "";
      }
    },
    label,
    isKeyword: false,
    accessor: accessor ?? label
  };
}
