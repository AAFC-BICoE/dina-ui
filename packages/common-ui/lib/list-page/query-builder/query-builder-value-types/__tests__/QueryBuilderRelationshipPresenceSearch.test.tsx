import { transformRelationshipPresenceToDSL } from "../QueryBuilderRelationshipPresenceSearch";

describe("QueryBuilderRelationshipPresenceSearch", () => {
  describe("transformRelationshipPresenceToDSL function", () => {
    test("Presence operation", async () => {
      expect(
        transformRelationshipPresenceToDSL({
          value: `{"selectedRelationship":"collection","selectedOperator":"presence","selectedValue":""}`,
          fieldPath: "_relationshipPresence",
          operation: "noOperator",
          queryType: "relationshipPresence"
        })
      ).toMatchSnapshot();
    });

    test("Absence operation", async () => {
      expect(
        transformRelationshipPresenceToDSL({
          value: `{"selectedRelationship":"organism","selectedOperator":"absence","selectedValue":""}`,
          fieldPath: "_relationshipPresence",
          operation: "noOperator",
          queryType: "relationshipPresence"
        })
      ).toMatchSnapshot();
    });

    test("UUID operation", async () => {
      expect(
        transformRelationshipPresenceToDSL({
          value: `{"selectedRelationship":"organism","selectedOperator":"uuid","selectedValue":"897201dd-f10b-42a7-ad7f-fb3e6d4f8ee2"}`,
          fieldPath: "_relationshipPresence",
          operation: "noOperator",
          queryType: "relationshipPresence"
        })
      ).toMatchSnapshot();
    });
  });
});
