/** Shows the multilingual description in all languages. */
export function allLangsDescriptionCell(accessor: string) {
  return {
    Cell: ({ original: { value } }) =>
      value?.descriptions?.map(
        (desc, index) =>
          desc?.desc && (
            <div className="pb-2" key={index}>
              <strong>{desc?.lang}: </strong> {desc?.desc}
            </div>
          )
      ) ?? null,
    accessor
  };
}
