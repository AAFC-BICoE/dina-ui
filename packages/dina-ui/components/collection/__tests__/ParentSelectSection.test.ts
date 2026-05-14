import { getCustomQueryOptions } from "../ParentSelectSection";

describe("getCustomQueryOptions", () => {
  it("filters out descendants of all bulk-edited samples", () => {
    const bulkEditedSampleIds = ["sample-1", "sample-2", "sample-3"];

    const options = getCustomQueryOptions(bulkEditedSampleIds)("abc");
    const query = options.query("abc");

    expect(query.bool.must_not).toEqual([
      {
        nested: {
          path: "data.attributes.hierarchy",
          query: {
            bool: {
              should: [
                { term: { "data.attributes.hierarchy.uuid": "sample-1" } },
                { term: { "data.attributes.hierarchy.uuid": "sample-2" } },
                { term: { "data.attributes.hierarchy.uuid": "sample-3" } }
              ]
            }
          }
        }
      }
    ]);
  });

  it("does not add descendant exclusion when no sample ids are provided", () => {
    const options = getCustomQueryOptions(undefined)("abc");
    const query = options.query("abc") as any;

    expect(query.bool.must_not).toBeUndefined();
  });
});
