/**
 * Using the UUID provided it will find the Material Sample that share a common parent with the
 * culture strain material sample type.
 *
 * For example:
 *
 * CNC-1 (specimen)
 *    CNC-1-A (specimen replicate)
 *    CNC-1-B (culture strain)
 *      CNC-1-B-a (culture strain)
 *
 * If the UUID of `CNC-1` is provided, then the culture strains would be returned: `CNC-1-B` and
 * `CNC-1-B-a`.
 *
 * The `CNC-1-A` is not returned since it's not under the culture strain type.
 *
 * @param uuid The parent UUID to use to return the culture strain children against.
 */
export function materialSampleCultureStrainChildrenQuery(uuid: string): any {
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
                    }
                  ]
                }
              }
            }
          },
          {
            match: {
              "data.attributes.materialSampleType": "CULTURE_STRAIN"
            }
          }
        ]
      }
    }
  };
}
