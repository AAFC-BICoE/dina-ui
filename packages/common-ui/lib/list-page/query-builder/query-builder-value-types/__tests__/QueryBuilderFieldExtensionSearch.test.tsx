import { transformFieldExtensionToDSL } from "../QueryBuilderFieldExtensionSearch";

describe("QueryBuilderFieldExtensionSearch", () => {
  describe("transformFieldExtensionToDSL function", () => {
    const operators = [
      "exactMatch",
      "wildcard",
      "startsWith",
      "in",
      "notIn",
      "notEquals",
      "empty",
      "notEmpty"
    ];

    describe("Attribute level tests", () => {
      test.each(operators)("Using the %s operator.", async (operator) => {
        const testValue =
          operator === "in" || operator === "notIn"
            ? "test1, test2,test3"
            : "test123";

        expect(
          transformFieldExtensionToDSL({
            fieldPath: "", // Not used.
            operation: "", // Not used.
            queryType: "", // Not used.
            value: `{"searchValue":"${testValue}","selectedOperator":"${operator}","selectedExtension":"extension","selectedField":"field"}`,
            fieldInfo: {
              dynamicField: {
                type: "fieldExtension",
                label: "fieldExtensions",
                component: "MATERIAL_SAMPLE",
                path: "data.attributes.extensionValues",
                apiEndpoint: "collection-api/extension"
              },
              value: "data.attributes.extensionValues",
              distinctTerm: false,
              label: "fieldExtensions",
              path: "data.attributes.extensionValues",
              type: "extensionValue",
              keywordMultiFieldSupport: true,
              optimizedPrefix: false,
              containsSupport: false,
              endsWithSupport: false,
              hideField: false,
              keywordNumericSupport: false
            }
          })
        ).toMatchSnapshot();
      });
    });

    describe("Relationship level tests", () => {
      test.each(operators)("Using the %s operator.", async (operator) => {
        const testValue =
          operator === "in" || operator === "notIn"
            ? "test1, test2,test3"
            : "test123";

        expect(
          transformFieldExtensionToDSL({
            fieldPath: "", // Not used.
            operation: "", // Not used.
            queryType: "", // Not used.
            value: `{"searchValue":"${testValue}","selectedOperator":"${operator}","selectedExtension":"extension","selectedField":"field"}`,
            fieldInfo: {
              dynamicField: {
                type: "fieldExtension",
                label: "fieldExtensions",
                component: "COLLECTING_EVENT",
                path: "included.attributes.extensionValues",
                referencedBy: "collectingEvent",
                referencedType: "collecting-event",
                apiEndpoint: "collection-api/extension"
              } as any,
              parentName: "collectingEvent",
              parentPath: "included",
              parentType: "collecting-event",
              value: "included.attributes.extensionValues_collectingEvent",
              distinctTerm: false,
              label: "fieldExtensions",
              path: "included.attributes.extensionValues",
              type: "fieldExtension",
              keywordMultiFieldSupport: false,
              optimizedPrefix: false,
              containsSupport: false,
              endsWithSupport: false,
              hideField: false,
              keywordNumericSupport: false
            }
          })
        ).toMatchSnapshot();
      });
    });
  });
});
