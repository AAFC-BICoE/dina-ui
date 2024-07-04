import { transformRelationshipPresenceToDSL } from "../QueryBuilderRelationshipPresenceSearch";

describe("QueryBuilderRelationshipPresenceSearch", () => {
  describe("transformRelationshipPresenceToDSL function", () => {
    test("Presence operation", async () => {
      expect(
        transformRelationshipPresenceToDSL({
          value: `{"selectedRelationship":"collection","selectedOperator":"presence","selectedValue":0}`,
          fieldPath: "_relationshipPresence",
          operation: "noOperator",
          queryType: "relationshipPresence"
        })
      ).toMatchSnapshot();
    });

    test("Absence operation", async () => {
      expect(
        transformRelationshipPresenceToDSL({
          value: `{"selectedRelationship":"organism","selectedOperator":"absence","selectedValue":0}`,
          fieldPath: "_relationshipPresence",
          operation: "noOperator",
          queryType: "relationshipPresence"
        })
      ).toMatchSnapshot();
    });
  });
});
