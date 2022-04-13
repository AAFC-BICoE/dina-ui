import { get } from "lodash";

/** Renders a string array cell into a table in comma separated format. */
export function stringArrayCell(label: string, accessor?: string) {
  return {
    Cell: ({ original }) => {
      const value = get(original, accessor ?? label);
      if (value) {
        const joinedString = value.join(", ");
        return <div className="stringArray-cell">{joinedString}</div>;
      }
      return null;
    },
    label,
    keyword: true,
    accessor: accessor ?? label
  };
}
