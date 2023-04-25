import { transformFieldExtensionToDSL } from "../QueryBuilderFieldExtensionSearch";

describe("QueryBuilderManagedAttributeSearch", () => {
  describe("transformFieldExtensionToDSL function", () => {
    const operators = [
      "exactMatch",
      "partialMatch",
      "notEquals",
      "empty",
      "notEmpty"
    ];

    describe("Attribute level tests", () => {
      test.each(operators)("Using the %s operator.", async (operator) => {
        expect(
          transformFieldExtensionToDSL({
            fieldPath: "", // Not used.
            operation: "", // Not used.
            queryType: "", // Not used.
            value: `{"searchValue":"test123","selectedOperator":"${operator}","selectedExtension":"extension","selectedField":"field"}`,
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
              startsWithSupport: false,
              containsSupport: false,
              endsWithSupport: false
            }
          })
        ).toMatchSnapshot();
      });
    });

    describe("Relationship level tests", () => {
      test.each(operators)("Using the %s operator.", async (operator) => {
        expect(
          transformFieldExtensionToDSL({
            fieldPath: "", // Not used.
            operation: "", // Not used.
            queryType: "", // Not used.
            value: `{"searchValue":"test123","selectedOperator":"${operator}","selectedExtension":"extension","selectedField":"field"}`,
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
              startsWithSupport: false,
              containsSupport: false,
              endsWithSupport: false
            }
          })
        ).toMatchSnapshot();
      });
    });
  });
});
