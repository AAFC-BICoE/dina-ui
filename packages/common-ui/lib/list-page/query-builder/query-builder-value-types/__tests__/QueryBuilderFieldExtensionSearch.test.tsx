import { transformFieldExtensionToDSL } from "../QueryBuilderFieldExtensionSearch";

interface TestValueStructure {
  type: string;
  testValue: (operator: string) => string;
  operators: string[];
  useKeywordMultiField: boolean;
  useKeywordNumericField: boolean;
}

/**
 * This test will loop through all of the possible type and operator combinations and create a
 * snapshot of it.
 *
 * Snapshots are used to ensure the query being performed in elastic search doesn't change unless
 * it was intended.
 */
describe("QueryBuilderFieldExtensionSearch", () => {
  describe("transformFieldExtensionToDSL function", () => {
    const testValues: TestValueStructure[] = [
      {
        type: "STRING",
        testValue: (operator) => {
          switch (operator) {
            case "in":
            case "notIn":
              return "stringValue1, stringValue2,stringValue3";
            default:
              return "stringValue";
          }
        },
        operators: [
          "exactMatch",
          "wildcard",
          "in",
          "notIn",
          "startsWith",
          "notEquals",
          "empty",
          "notEmpty"
        ],
        useKeywordMultiField: true,
        useKeywordNumericField: false
      },
      {
        type: "DATE",
        testValue: (operator) => {
          switch (operator) {
            case "in":
            case "notIn":
              return "1998-05-19, 2020-01-01,2024-04-08";
            default:
              return "1998-05-19";
          }
        },
        operators: [
          "equals",
          "notEquals",
          "containsDate",
          "in",
          "notIn",
          "greaterThan",
          "greaterThanOrEqualTo",
          "lessThan",
          "lessThanOrEqualTo",
          "empty",
          "notEmpty"
        ],
        useKeywordMultiField: false,
        useKeywordNumericField: false
      },
      {
        type: "INTEGER",
        testValue: (operator) => {
          switch (operator) {
            case "in":
            case "notIn":
              return "1, 2,4";
            case "between":
              return '{\\"low\\":1,\\"high\\":5}';
            default:
              return "42";
          }
        },
        operators: [
          "equals",
          "notEquals",
          "in",
          "notIn",
          "between",
          "greaterThan",
          "greaterThanOrEqualTo",
          "lessThan",
          "lessThanOrEqualTo",
          "empty",
          "notEmpty"
        ],
        useKeywordMultiField: false,
        useKeywordNumericField: false
      },
      {
        type: "DECIMAL",
        testValue: (operator) => {
          switch (operator) {
            case "in":
            case "notIn":
              return "3, 3.1,12.5";
            case "between":
              return '{\\"low\\":1.5,\\"high\\":10.5}';
            default:
              return "3.5";
          }
        },
        operators: [
          "equals",
          "notEquals",
          "in",
          "notIn",
          "between",
          "greaterThan",
          "greaterThanOrEqualTo",
          "lessThan",
          "lessThanOrEqualTo",
          "empty",
          "notEmpty"
        ],
        useKeywordMultiField: false,
        useKeywordNumericField: false
      },
      {
        type: "PICK_LIST",
        testValue: (operator) => {
          switch (operator) {
            case "in":
            case "notIn":
              return "option1, option2,option3";
            default:
              return "option1";
          }
        },
        operators: ["equals", "notEquals", "in", "notIn", "empty", "notEmpty"],
        useKeywordMultiField: true,
        useKeywordNumericField: false
      },
      {
        type: "BOOL",
        testValue: () => "true",
        operators: ["equals", "empty", "notEmpty"],
        useKeywordMultiField: true,
        useKeywordNumericField: false
      }
    ];

    describe.each(testValues.map((value) => [value.type, value]))(
      "%s based field extension tests",
      (_, testValue: TestValueStructure) => {
        describe("Attribute level tests", () => {
          testValue.operators.forEach((operator) => {
            const testName = `Using the ${operator} operator`;

            test(testName, async () => {
              expect(
                transformFieldExtensionToDSL({
                  fieldPath: "", // Not used.
                  operation: "", // Not used.
                  queryType: "", // Not used.
                  value: `{"searchValue":"${(
                    testValue as TestValueStructure
                  ).testValue(
                    operator
                  )}","selectedOperator":"${operator}","selectedExtension":"extension","selectedField":"field","selectedType":"${
                    (testValue as TestValueStructure).type
                  }"}`,
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
                    keywordMultiFieldSupport: (testValue as TestValueStructure)
                      .useKeywordMultiField,
                    optimizedPrefix: false,
                    containsSupport: false,
                    endsWithSupport: false,
                    hideField: false,
                    keywordNumericSupport: (testValue as TestValueStructure)
                      .useKeywordNumericField
                  }
                })
              ).toMatchSnapshot();
            });
          });
        });

        describe("Relationship level tests", () => {
          testValue.operators.forEach((operator) => {
            const testName = `Using the ${operator} operator`;

            test(testName, async () => {
              expect(
                transformFieldExtensionToDSL({
                  fieldPath: "", // Not used.
                  operation: "", // Not used.
                  queryType: "", // Not used.
                  value: `{"searchValue":"${(
                    testValue as TestValueStructure
                  ).testValue(
                    operator
                  )}","selectedOperator":"${operator}","selectedExtension":"extension","selectedField":"field","selectedType":"${
                    (testValue as TestValueStructure).type
                  }"}`,
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
                    value:
                      "included.attributes.extensionValues_collectingEvent",
                    distinctTerm: false,
                    label: "fieldExtensions",
                    path: "included.attributes.extensionValues",
                    type: "fieldExtension",
                    keywordMultiFieldSupport: (testValue as TestValueStructure)
                      .useKeywordMultiField,
                    optimizedPrefix: false,
                    containsSupport: false,
                    endsWithSupport: false,
                    hideField: false,
                    keywordNumericSupport: (testValue as TestValueStructure)
                      .useKeywordNumericField
                  }
                })
              ).toMatchSnapshot();
            });
          });
        });
      }
    );
  });
});
