import { transformIdentifierToDSL } from "../QueryBuilderIdentifierSearch";

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
        subTypes: [undefined],
        useKeywordMultiField: true,
        useKeywordNumericField: true
      },
      {
        type: "DATE",
        testValue: (operator) => {
          switch (operator) {
            case "in":
            case "notIn":
              return "1998-05-19, 2020-01-01,2024-04-08";
            case "between":
              return '{\\"low\\":\\"1998-05-19\\",\\"high\\":\\"2002-02-10\\"}';
            default:
              return "1998-05-19";
          }
        },
        operators: [
          "equals",
          "notEquals",
          "containsDate",
          "between",
          "in",
          "notIn",
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
        subTypes: [undefined],
        useKeywordMultiField: false,
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
      "%s based identifier tests",
      (_, testValue: TestValueStructure) => {
        describe("Attribute level tests", () => {
          testValue.operators.forEach((operator) => {
            testValue.subTypes.forEach((subType) => {
              const testName = `Using the ${operator} operator, ${subType} subtype`;

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
                    )}","selectedOperator":"${operator}","selectedIdentifier": {"id":"seqdb_id","type":"identifier-type","vocabularyElementType":"${
                      (testValue as TestValueStructure).type
                    }","multilingualTitle":{"titles":[{"lang":"en","title":"SeqDB ID"},{"lang":"fr","title":"ID SeqDB"}]}},"selectedType":"${
                      (testValue as TestValueStructure).type
                    }"}`,
                    fieldInfo: {
                      dynamicField: {
                        type: "identifier",
                        label: "identifiers",
                        component: "MATERIAL_SAMPLE",
                        path: "data.attributes.identifiers",
                        apiEndpoint: "collection-api/identifier-type"
                      },
                      hideField: true,
                      value: "data.attributes.identifiers",
                      distinctTerm: false,
                      label: "identifiers",
                      path: "data.attributes.identifiers",
                      type: "identifier",
                      keywordMultiFieldSupport: (
                        testValue as TestValueStructure
                      ).useKeywordMultiField,
                      optimizedPrefix: false,
                      containsSupport: false,
                      endsWithSupport: false,
                      keywordNumericSupport: (testValue as TestValueStructure)
                        .useKeywordNumericField,
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
                  transformIdentifierToDSL({
                    fieldPath: "", // Not used.
                    operation: "", // Not used.
                    queryType: "", // Not used.
                    value: `{"searchValue":"${(
                      testValue as TestValueStructure
                    ).testValue(
                      operator
                    )}","selectedOperator":"${operator}","selectedIdentifier": {"id":"seqdb_id","type":"identifier-type","vocabularyElementType":"${
                      (testValue as TestValueStructure).type
                    }","multilingualTitle":{"titles":[{"lang":"en","title":"SeqDB ID"},{"lang":"fr","title":"ID SeqDB"}]}},"selectedType":"${
                      (testValue as TestValueStructure).type
                    }"}`,
                    fieldInfo: {
                      dynamicField: {
                        type: "identifier",
                        label: "identifiers",
                        component: "COLLECTING_EVENT",
                        path: "included.attributes.identifiers",
                        referencedBy: "parentMaterialSample",
                        referencedType: "material-sample",
                        apiEndpoint: "collection-api/identifier-type"
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
                      keywordMultiFieldSupport: (
                        testValue as TestValueStructure
                      ).useKeywordMultiField,
                      optimizedPrefix: false,
                      containsSupport: false,
                      endsWithSupport: false,
                      keywordNumericSupport: (testValue as TestValueStructure)
                        .useKeywordNumericField,
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
