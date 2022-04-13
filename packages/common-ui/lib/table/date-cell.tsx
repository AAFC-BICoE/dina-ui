import { DateView } from "../date/DateView";
import { get } from "lodash";

/** Renders a date cell into a table in a user-friendly / readable format. */
export function dateCell(label: string, accessor?: string) {
  return {
    Cell: ({ original }) => {
      const value = get(original, accessor ?? label);
      return <DateView date={value} />;
    },
    label,
    keyword: false,
    accessor: accessor ?? label
  };
}
