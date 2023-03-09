/**
 * The rank number which represents the parent.
 *
 * The hierarchy displays `1` as the current Material Sample you are viewing and `2` as the
 * parent of what you are viewing.
 */
const PARENT_HIERARCHY_RANK = 2;

/**
 * Using the UUID provided it will find the Material Sample that are direct children.
 *
 * For example:
 *
 * CNC-1 (specimen)
 *    CNC-1-A (specimen replicate)
 *    CNC-1-B (substrain)
 *      CNC-1-B-a (substrain)
 *
 * If the UUID of `CNC-1` is provided, then the direct children returned would be `CNC-1-A` and
 * `CNC-1-B`.
 *
 * The `CNC-1-B-a` is not returned since it's not a direct child of `CNC-1`.
 *
 * @param uuid The parent UUID to use to return the children against.
 */
export function generateDirectMaterialSampleChildrenTree(uuid: string): any {
  return {
    query: {
      bool: {
        must: [
          {
            nested: {
              path: "data.attributes.hierarchy",
              query: {
                bool: {
                  must: [
                    {
                      match: {
                        "data.attributes.hierarchy.uuid": uuid
                      }
                    },
                    {
                      match: {
                        "data.attributes.hierarchy.rank": PARENT_HIERARCHY_RANK
                      }
                    }
                  ]
                }
              }
            }
          }
        ]
      }
    }
  };
}
