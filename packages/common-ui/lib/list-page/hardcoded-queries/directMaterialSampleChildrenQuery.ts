import { JsonTree, Utils } from "react-awesome-query-builder";

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
export function generateDirectMaterialSampleChildrenTree(
  uuid: string
): JsonTree {
  return {
    id: Utils.uuid(),
    type: "group",
    children1: {
      [Utils.uuid()]: {
        type: "rule",
        properties: {
          field: "data.attributes.hierarchy",
          operator: "hierarchy",
          value: [uuid]
        }
      }
    }
  };
}
