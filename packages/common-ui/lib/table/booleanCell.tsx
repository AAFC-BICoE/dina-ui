import { get } from "lodash";
import { FaCheckSquare, FaRegSquare } from "react-icons/fa";

/**
 * Helper cell function to display boolean values in tables. It will display a checkbox icon that
 * changes depending on if it's true/false.
 *
 * Null/undefined values will be displayed as an empty string.
 *
 * @param label Column header to be used.
 * @param accessor Accessor for elastic search.
 * @returns The cell to be displayed.
 */
export function booleanCell(label: string, accessor?: string) {
  return {
    Cell: ({ original }) => {
      const booleanValue = get(original, accessor ?? label)?.toString();
      if (booleanValue === "true") {
        return <FaCheckSquare />;
      } else if (booleanValue === "false") {
        return <FaRegSquare />;
      } else {
        return <></>;
      }
    },
    label,
    isKeyword: false,
    accessor: accessor ?? label
  };
}
