/** Renders a date cell into a tabl in a user-friendly / readable format. */
export function dateCell(accessor: string) {
  return {
    Cell: ({ original }) => {
      const value = original[accessor];

      if (value) {
        const date = new Date(value);
        const compactLocaleString = date.toLocaleString("en-CA");
        const fullDateString = date.toString();

        return (
          <div className="date-cell" title={fullDateString}>
            {compactLocaleString}
          </div>
        );
      }

      return null;
    },
    accessor
  };
}
