import { transformManagedAttributeToDSL } from "../QueryBuilderManagedAttributeSearch";

interface TestValueStructure {
  type: string;
  testValue: string;
  operators: string[];
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
          "partialMatch",
          "notEquals",
          "empty",
          "notEmpty"
        ]
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
        ]
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
        ]
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
        ]
      },
      {
        type: "PICK_LIST",
        testValue: "3.5",
        operators: ["equals", "notEquals", "empty", "notEmpty"]
      },
      {
        type: "BOOL",
        testValue: "true",
        operators: ["equals", "empty", "notEmpty"]
      }
    ];

    describe.each(testValues.map((value) => [value.type, value]))(
      "%s based managed attribute tests",
      (_, testValue) => {
        test.each((testValue as TestValueStructure).operators)(
          "Attribute level with operator %s",
          (operator) => {
            expect(
              transformManagedAttributeToDSL({
                fieldPath: "", // Not used.
                operation: "", // Not used.
                queryType: "", // Not used.
                value: `{"searchValue":"${
                  (testValue as TestValueStructure).testValue
                }","selectedOperator":"${operator}","selectedManagedAttribute":"attributeName","selectedType":"${
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
                  startsWithSupport: false,
                  containsSupport: false,
                  endsWithSupport: false
                }
              })
            ).toMatchSnapshot();
          }
        );

        test.each((testValue as TestValueStructure).operators)(
          "Relationship level with operator %s",
          (operator) => {
            expect(
              transformManagedAttributeToDSL({
                fieldPath: "", // Not used.
                operation: "", // Not used.
                queryType: "", // Not used.
                value: `{"searchValue":"${
                  (testValue as TestValueStructure).testValue
                }","selectedOperator":"${operator}","selectedManagedAttribute":"attributeName","selectedType":"${
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
                  startsWithSupport: false,
                  containsSupport: false,
                  endsWithSupport: false
                }
              })
            ).toMatchSnapshot();
          }
        );
      }
    );
  });
});
