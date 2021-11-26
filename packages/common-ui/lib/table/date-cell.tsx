import { DateView } from "../date/DateView";
import { get } from "lodash";

/** Renders a date cell into a tabl in a user-friendly / readable format. */
export function dateCell(accessor: string) {
  return {
    Cell: ({ original }) => {
      const value = get(original, accessor);
      return <DateView date={value} />;
    },
    accessor
  };
}
