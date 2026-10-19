/** Finds an aggregation by name, whether or not Elasticsearch prefixed it with its type (e.g. "sterms#by_kingdom"). */
export function findAgg(aggs: any, name: string) {
  if (!aggs) return undefined;
  const key = Object.keys(aggs).find(
    (k) => k === name || k.endsWith(`#${name}`)
  );
  return key ? aggs[key] : undefined;
}
