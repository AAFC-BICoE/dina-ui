import { transformManagedAttributeToDSL } from "../QueryBuilderManagedAttributeSearch";

interface TestValueStructure {
  type: string;
  testValue: (operator: string) => string;
  operators: string[];
  subTypes: (string | undefined)[];
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
describe("QueryBuilderManagedAttributeSearch", () => {
  describe("transformManagedAttributeToDSL function", () => {
    const testValues: TestValueStructure[] = [
      {
        type: "STRING",
        testValue: (operator) => {
          switch (operator) {
            case "in":
            case "notIn":
              return "stringValue1, stringValue2,stringValue3"
            case "between":
              return "{\\\"low\\\":\\\"stringValue1\\\",\\\"high\\\":\\\"stringValue3\\\"}";
            default:
              return "stringValue"
          }
        },
        operators: [
          "exactMatch",
          "wildcard",
          "in",
          "notIn",
          "between",
          "startsWith",
          "notEquals",
          "empty",
          "notEmpty"
        ],
        subTypes: [undefined],
        useKeywordMultiField: true,
        useKeywordNumericField: true
      },
      {
        type: "DATE",
        testValue: () => "1998-05-19",
        operators: [
          "equals",
          "notEquals",
          "containsDate",
          "greaterThan",
          "greaterThanOrEqualTo",
          "lessThan",
          "lessThanOrEqualTo",
          "empty",
          "notEmpty"
        ],
        subTypes: [
          undefined,
          "local_date",
          "local_date_time",
          "date_time",
          "date_time_optional_tz"
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
              return "{\\\"low\\\":1,\\\"high\\\":5}";
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
        subTypes: [undefined],
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
              return "{\\\"low\\\":1.5,\\\"high\\\":10.5}";
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
        subTypes: [undefined],
        useKeywordMultiField: false,
        useKeywordNumericField: false
      },
      {
        type: "PICK_LIST",
        testValue: (operator) => {
          switch (operator) {
            case "in":
            case "notIn":
              return "option1, option2,option3"
            default:
              return "option1"
          }
        },
        operators: ["equals", "notEquals", "in", "notIn", "empty", "notEmpty"],
        subTypes: [undefined],
        useKeywordMultiField: true,
        useKeywordNumericField: false
      },
      {
        type: "BOOL",
        testValue: () => "true",
        operators: ["equals", "empty", "notEmpty"],
        subTypes: [undefined],
        useKeywordMultiField: true,
        useKeywordNumericField: false
      }
    ];

    describe.each(testValues.map((value) => [value.type, value]))(
      "%s based managed attribute tests",
      (_, testValue: TestValueStructure) => {
        describe("Attribute level tests", () => {
          testValue.operators.forEach((operator) => {
            testValue.subTypes.forEach((subType) => {
              const testName = `Using the ${operator} operator, ${subType} subtype`;

              test(testName, async () => {
                expect(
                  transformManagedAttributeToDSL({
                    fieldPath: "", // Not used.
                    operation: "", // Not used.
                    queryType: "", // Not used.
                    value: `{"searchValue":"${
                      (testValue as TestValueStructure).testValue(operator)
                    }","selectedOperator":"${operator}","selectedManagedAttribute": { "key": "attributeName" },"selectedType":"${
                      (testValue as TestValueStructure).type
                    }"}`,
                    fieldInfo: {
                      dynamicField: {
                        type: "managedAttribute",
                        label: "managedAttributes",
                        component: "MATERIAL_SAMPLE",
                        path: "data.attributes.managedAttributes",
                        apiEndpoint: "collection-api/managed-attribute"
                      },
                      value: "data.attributes.managedAttributes",
                      distinctTerm: false,
                      label: "managedAttributes",
                      path: "data.attributes.managedAttributes",
                      type: "managedAttribute",
                      keywordMultiFieldSupport: (
                        testValue as TestValueStructure
                      ).useKeywordMultiField,
                      optimizedPrefix: false,
                      containsSupport: false,
                      endsWithSupport: false,                      
                      keywordNumericSupport: (
                        testValue as TestValueStructure
                      ).useKeywordNumericField,
                      subType
                    }
                  })
                ).toMatchSnapshot();
              });
            });
          });
        });

        describe("Relationship level tests", () => {
          testValue.operators.forEach((operator) => {
            testValue.subTypes.forEach((subType) => {
              const testName = `Using the ${operator} operator, ${subType} subtype`;

              test(testName, async () => {
                expect(
                  transformManagedAttributeToDSL({
                    fieldPath: "", // Not used.
                    operation: "", // Not used.
                    queryType: "", // Not used.
                    value: `{"searchValue":"${
                      (testValue as TestValueStructure).testValue(operator)
                    }","selectedOperator":"${operator}","selectedManagedAttribute": { "key": "attributeName" },"selectedType":"${
                      (testValue as TestValueStructure).type
                    }"}`,
                    fieldInfo: {
                      dynamicField: {
                        type: "managedAttribute",
                        label: "managedAttributes",
                        component: "COLLECTING_EVENT",
                        path: "included.attributes.managedAttributes",
                        referencedBy: "collectingEvent",
                        referencedType: "collecting-event",
                        apiEndpoint: "collection-api/managed-attribute"
                      } as any,
                      parentName: "collectingEvent",
                      parentPath: "included",
                      parentType: "collecting-event",
                      value:
                        "included.attributes.managedAttributes_collectingEvent",
                      distinctTerm: false,
                      label: "managedAttributes",
                      path: "included.attributes.managedAttributes",
                      type: "managedAttribute",
                      keywordMultiFieldSupport: (
                        testValue as TestValueStructure
                      ).useKeywordMultiField,
                      optimizedPrefix: false,
                      containsSupport: false,
                      endsWithSupport: false,
                      keywordNumericSupport: (
                        testValue as TestValueStructure
                      ).useKeywordNumericField,
                      subType
                    }
                  })
                ).toMatchSnapshot();
              });
            });
          });
        });
      }
    );
  });
});
