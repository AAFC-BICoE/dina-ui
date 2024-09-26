import { transformIdentifierToDSL } from "../QueryBuilderIdentifierSearch";

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
describe("QueryBuilderIdentifierSearch", () => {
  describe("transformIdentiferToDSL function", () => {
    const testValues: TestValueStructure[] = [
      {
        type: "STRING",
        testValue: (operator) => {
          switch (operator) {
            case "in":
            case "notIn":
              return "stringValue1, stringValue2,stringValue3";
            case "between":
              return '{\\"low\\":\\"stringValue1\\",\\"high\\":\\"stringValue3\\"}';
            default:
              return "stringValue";
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
        useKeywordMultiField: true,
        useKeywordNumericField: true
      }
    ];

    describe.each(testValues.map((value) => [value.type, value]))(
      "%s based identifier tests",
      (_, testValue: TestValueStructure) => {
        describe("Attribute level tests", () => {
          testValue.operators.forEach((operator) => {
            const testName = `Using the ${operator} operator`;

            test(testName, async () => {
              expect(
                transformIdentifierToDSL({
                  fieldPath: "", // Not used.
                  operation: "", // Not used.
                  queryType: "", // Not used.
                  value: `{"searchValue":"${(
                    testValue as TestValueStructure
                  ).testValue(
                    operator
                  )}","selectedOperator":"${operator}","selectedIdentifier": "seqdb_id"}`,
                  fieldInfo: {
                    dynamicField: {
                      type: "identifier",
                      label: "identifiers",
                      component: "MATERIAL_SAMPLE",
                      path: "data.attributes.identifiers",
                      apiEndpoint:
                        "collection-api/vocabulary2/materialSampleIdentifierType"
                    },
                    hideField: true,
                    value: "data.attributes.identifiers",
                    distinctTerm: false,
                    label: "identifiers",
                    path: "data.attributes.identifiers",
                    type: "identifier",
                    keywordMultiFieldSupport: (testValue as TestValueStructure)
                      .useKeywordMultiField,
                    optimizedPrefix: false,
                    containsSupport: false,
                    endsWithSupport: false,
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
                transformIdentifierToDSL({
                  fieldPath: "", // Not used.
                  operation: "", // Not used.
                  queryType: "", // Not used.
                  value: `{"searchValue":"${(
                    testValue as TestValueStructure
                  ).testValue(
                    operator
                  )}","selectedOperator":"${operator}","selectedIdentifier": "seqdb_id"}`,
                  fieldInfo: {
                    dynamicField: {
                      type: "identifier",
                      label: "identifiers",
                      component: "COLLECTING_EVENT",
                      path: "included.attributes.identifiers",
                      referencedBy: "parentMaterialSample",
                      referencedType: "material-sample",
                      apiEndpoint:
                        "collection-api/vocabulary2/materialSampleIdentifierType"
                    } as any,
                    hideField: true,
                    parentName: "parentMaterialSample",
                    parentPath: "included",
                    parentType: "material-sample",
                    value:
                      "included.attributes.identifiers_parentMaterialSample",
                    distinctTerm: false,
                    label: "identifiers",
                    path: "included.attributes.identifiers",
                    type: "identifier",
                    keywordMultiFieldSupport: (testValue as TestValueStructure)
                      .useKeywordMultiField,
                    optimizedPrefix: false,
                    containsSupport: false,
                    endsWithSupport: false,
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
