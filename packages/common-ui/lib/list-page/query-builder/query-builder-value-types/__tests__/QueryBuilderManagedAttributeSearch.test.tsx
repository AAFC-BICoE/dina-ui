import { transformManagedAttributeToDSL } from "../QueryBuilderManagedAttributeSearch";

interface TestValueStructure {
  type: string;
  testValue: string;
  operators: string[];
  subTypes: (string | undefined)[];
  useKeywordMultiField: boolean;
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
        testValue: "stringValue",
        operators: [
          "exactMatch",
          "wildcard",
          "startsWith",
          "notEquals",
          "empty",
          "notEmpty"
        ],
        subTypes: [undefined],
        useKeywordMultiField: true
      },
      {
        type: "DATE",
        testValue: "1998-05-19",
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
        useKeywordMultiField: false
      },
      {
        type: "INTEGER",
        testValue: "42",
        operators: [
          "equals",
          "notEquals",
          "greaterThan",
          "greaterThanOrEqualTo",
          "lessThan",
          "lessThanOrEqualTo",
          "empty",
          "notEmpty"
        ],
        subTypes: [undefined],
        useKeywordMultiField: false
      },
      {
        type: "DECIMAL",
        testValue: "3.5",
        operators: [
          "equals",
          "notEquals",
          "greaterThan",
          "greaterThanOrEqualTo",
          "lessThan",
          "lessThanOrEqualTo",
          "empty",
          "notEmpty"
        ],
        subTypes: [undefined],
        useKeywordMultiField: false
      },
      {
        type: "PICK_LIST",
        testValue: "3.5",
        operators: ["equals", "notEquals", "empty", "notEmpty"],
        subTypes: [undefined],
        useKeywordMultiField: true
      },
      {
        type: "BOOL",
        testValue: "true",
        operators: ["equals", "empty", "notEmpty"],
        subTypes: [undefined],
        useKeywordMultiField: true
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
                      (testValue as TestValueStructure).testValue
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
                      (testValue as TestValueStructure).testValue
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
