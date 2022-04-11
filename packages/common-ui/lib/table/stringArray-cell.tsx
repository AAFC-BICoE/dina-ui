import { get } from "lodash";

/** Renders a string array cell into a tabl in comma seperated format. */
export function stringArrayCell(accessor: string, indexPath?: string) {
  return {
    Cell: ({ original }) => {
      const value = get(original, accessor);
      if (value) {
        const joinedString = value.join(", ");
        return <div className="stringArray-cell">{joinedString}</div>;
      }
      return null;
    },
    accessor,
    indexPath
  };
}
