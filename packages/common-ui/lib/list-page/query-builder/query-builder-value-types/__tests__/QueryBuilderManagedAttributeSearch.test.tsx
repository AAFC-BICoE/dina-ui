import { mountWithAppContext } from "common-ui";
import { waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import QueryRowManagedAttributeSearch, {
  transformManagedAttributeToDSL
} from "../QueryBuilderManagedAttributeSearch";

// Mock out the debounce function to avoid waiting during tests.
jest.mock("use-debounce", () => ({
  useDebounce: (fn) => [fn, { isPending: () => false }]
}));

/** Managed attribute in a group the test user is not a member of. */
const MANAGED_ATTRIBUTE_OTHER_GROUP = {
  id: "8504783b-cf16-4702-b2fe-88c2db2ee475",
  type: "controlled-vocabulary-item",
  name: "Field Number",
  key: "field_number",
  group: "dao",
  vocabularyElementType: "STRING",
  acceptedValues: null
};

const mockGet = jest.fn<any, any>(async (_path, { filter }) => {
  // Only return the managed attribute when searching by UUID without the group filter.
  if (
    filter?.uuid?.EQ === MANAGED_ATTRIBUTE_OTHER_GROUP.id &&
    filter?.group === undefined
  ) {
    return { data: [MANAGED_ATTRIBUTE_OTHER_GROUP] };
  }
  return { data: [] };
});

const apiContext = { apiClient: { get: mockGet } } as any;

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
        type: "PICK_LIST",
        testValue: (operator) => {
          switch (operator) {
            case "in":
            case "notIn":
              return "option1, option2,option3";
            case "wildcard":
              return "option";
            default:
              return "option1";
          }
        },
        operators: [
          "equals",
          "notEquals",
          "wildcard",
          "in",
          "notIn",
          "empty",
          "notEmpty"
        ],
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
                    value: `{"searchValue":"${(
                      testValue as TestValueStructure
                    ).testValue(
                      operator
                    )}","selectedOperator":"${operator}","selectedManagedAttribute": { "key": "attributeName" },"selectedType":"${
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
                      hideField: true,
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
                  transformManagedAttributeToDSL({
                    fieldPath: "", // Not used.
                    operation: "", // Not used.
                    queryType: "", // Not used.
                    value: `{"searchValue":"${(
                      testValue as TestValueStructure
                    ).testValue(
                      operator
                    )}","selectedOperator":"${operator}","selectedManagedAttribute": { "key": "attributeName" },"selectedType":"${
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
                      hideField: true,
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

  describe("Query URL preloading", () => {
    beforeEach(() => jest.clearAllMocks());

    it("Preloads the managed attribute by UUID, even if it's outside of the user's groups", async () => {
      const setValue = jest.fn();

      mountWithAppContext(
        <QueryRowManagedAttributeSearch
          value={JSON.stringify({
            searchValue: "F-043134",
            selectedOperator: "exactMatch",
            selectedType: "",
            preloadId: MANAGED_ATTRIBUTE_OTHER_GROUP.id
          })}
          setValue={setValue}
          isInColumnSelector={false}
          managedAttributeConfig={
            {
              label: "managedAttributes",
              value: "data.attributes.managedAttributes",
              path: "data.attributes.managedAttributes",
              type: "managedAttribute",
              dynamicField: {
                type: "managedAttribute",
                label: "managedAttributes",
                path: "data.attributes.managedAttributes",
                apiEndpoint: "objectstore-api/controlled-vocabulary-item",
                component: "ENTITY"
              }
            } as any
          }
        />,
        { apiContext }
      );

      await waitFor(() => {
        const latestValue = JSON.parse(setValue.mock.lastCall[0]);
        expect(latestValue).toEqual(
          expect.objectContaining({
            searchValue: "F-043134",
            selectedOperator: "exactMatch",
            selectedType: "STRING",
            selectedManagedAttribute: MANAGED_ATTRIBUTE_OTHER_GROUP
          })
        );
        expect(latestValue.preloadId).toBeUndefined();
      });

      // The preload request should not contain the group scope filter.
      expect(mockGet).toHaveBeenCalledWith(
        "objectstore-api/controlled-vocabulary-item",
        expect.objectContaining({
          filter: { uuid: { EQ: MANAGED_ATTRIBUTE_OTHER_GROUP.id } }
        })
      );

      // Once preloaded, the group scope should be applied again for the dropdown options.
      expect(mockGet).toHaveBeenLastCalledWith(
        "objectstore-api/controlled-vocabulary-item",
        expect.objectContaining({
          filter: { group: { IN: "aafc,cnc" } }
        })
      );

      // Should not be stuck in a render loop re-applying the preloaded attribute.
      expect(setValue.mock.calls.length).toBeLessThan(10);
    });
  });
});
