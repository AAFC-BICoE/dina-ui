import { waitFor } from "@testing-library/react";
import QueryRowManagedAttributeSearch, {
  transformManagedAttributeToDSL
} from "../QueryBuilderManagedAttributeSearch";
import { QueryBuilderContextProvider } from "../../QueryBuilder";
import {
  DinaForm,
  mountWithAppContext,
  waitForLoadingToDisappear
} from "common-ui";
import { ESIndexMapping } from "../../../types";
import _ from "lodash";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";

const MOCK_MANAGED_ATTRIBUTE_CONFIG: ESIndexMapping = {
  label: "managedAttributes",
  value: "data.attributes.managedAttributes",
  type: "object",
  path: "data.attributes.managedAttributes",
  containsSupport: false,
  distinctTerm: false,
  endsWithSupport: false,
  hideField: false,
  keywordNumericSupport: false,
  optimizedPrefix: false,
  dynamicField: {
    type: "managedAttribute",
    label: "managedAttributes",
    component: "MATERIAL_SAMPLE",
    path: "included.attributes.managedAttributes",
    apiEndpoint: `collection-api/controlled-vocabulary-item`
  },
  keywordMultiFieldSupport: true
};

const INDEX_MAP: ESIndexMapping[] = [MOCK_MANAGED_ATTRIBUTE_CONFIG];

// Mocking the API responses for ScopedResourceSelect
const mockApiGet = jest.fn<any, any>(async (path) => {
  if (path === "collection-api/controlled-vocabulary-item") {
    return {
      data: [
        {
          id: "b455b5d1-1372-464a-b50a-c4fdbf72cfa8",
          type: "managed-attribute",
          uuid: "b455b5d1-1372-464a-b50a-c4fdbf72cfa8",
          name: "Test String Attribute",
          key: "test_string_attribute",
          vocabularyElementType: "STRING"
        }
      ]
    };
  }
});

const apiClientMock = {
  apiClient: {
    get: mockApiGet
  }
};

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
  beforeEach(jest.clearAllMocks);

  describe("Component testing", () => {
    it("Select managed attribute from dropdown, display operators and search value", async () => {
      const initialValue = JSON.stringify({
        searchValue: "",
        selectedOperator: "",
        selectedManagedAttribute: undefined,
        selectedManagedAttributeConfig: undefined,
        selectedType: ""
      });

      const wrapper = mountWithAppContext(
        <DinaForm initialValues={{}}>
          <QueryBuilderContextProvider
            value={{ performSubmit: _.noop, groups: ["aafc"] }}
          >
            <QueryRowManagedAttributeSearch
              value={initialValue}
              setValue={jest.fn()}
              managedAttributeConfig={MOCK_MANAGED_ATTRIBUTE_CONFIG}
              indexMap={INDEX_MAP}
              isInColumnSelector={false} // Set to true for this test
            />
          </QueryBuilderContextProvider>
        </DinaForm>,
        { apiContext: apiClientMock }
      );

      // Click the dropdown menu to display it's options.
      await userEvent.click(wrapper.getByRole("combobox"));
      await waitForLoadingToDisappear();

      // Check the network requests made at this point.
      await waitFor(() => {
        expect(mockApiGet).toHaveBeenCalledTimes(1);
      });
      expect(mockApiGet).toHaveBeenCalledWith(
        "collection-api/controlled-vocabulary-item",
        {
          filter: {
            "controlledVocabulary.uuid": {
              EQ: "01998155-a6f0-7c2f-9fcc-994d74222f9c"
            },
            group: {
              IN: "aafc,cnc" // My group scope has been selected.
            }
          },
          page: { limit: 15 },
          sort: "-createdOn"
        }
      );

      // Select the option.
      await userEvent.click(
        wrapper.getByRole("option", { name: /test string attribute/i })
      );

      // Exact match is selected by default.
      expect(wrapper.getByText(/exact match/i)).toBeInTheDocument();

      // Text search should appear:
      expect(wrapper.getByRole("textbox")).toBeInTheDocument();
    });

    it("Preloading the UUID, should automatically select the value", async () => {
      // The initial value with a preloadId simulating a URL-loaded query
      const initialValue = JSON.stringify({
        searchValue: "",
        selectedOperator: "",
        selectedManagedAttribute: undefined,
        selectedManagedAttributeConfig: undefined,
        selectedType: "",
        preloadId: "b455b5d1-1372-464a-b50a-c4fdbf72cfa8"
      });

      const { getByText } = mountWithAppContext(
        <DinaForm initialValues={{}}>
          <QueryBuilderContextProvider
            value={{ performSubmit: _.noop, groups: ["aafc"] }}
          >
            <QueryRowManagedAttributeSearch
              value={initialValue}
              setValue={jest.fn()}
              managedAttributeConfig={MOCK_MANAGED_ATTRIBUTE_CONFIG}
              indexMap={INDEX_MAP}
              isInColumnSelector={false}
            />
          </QueryBuilderContextProvider>
        </DinaForm>,
        { apiContext: apiClientMock }
      );

      // Verify the API is called to fetch the preloaded managed attribute
      await waitFor(() => {
        expect(mockApiGet).toHaveBeenCalled();
      });

      // The scoped resource select should resolve and display the name
      await waitFor(() => {
        expect(getByText("Test String Attribute")).toBeInTheDocument();
      });
    });

    it("Displays picklist inputs correctly when a picklist attribute is selected", async () => {
      // Pre-select a picklist managed attribute
      const initialValue = JSON.stringify({
        selectedManagedAttribute: {
          id: "c455b5d1-1372-464a-b50a-c4fdbf72cfa8",
          type: "managed-attribute",
          name: "Test Picklist Attribute",
          key: "test_picklist",
          acceptedValues: ["Option A", "Option B"]
        },
        selectedType: "PICK_LIST",
        selectedOperator: "equals",
        searchValue: "Option A"
      });

      const { getByText } = mountWithAppContext(
        <DinaForm initialValues={{}}>
          <QueryBuilderContextProvider
            value={{ performSubmit: _.noop, groups: ["aafc"] }}
          >
            <QueryRowManagedAttributeSearch
              value={initialValue}
              setValue={jest.fn()}
              managedAttributeConfig={MOCK_MANAGED_ATTRIBUTE_CONFIG}
              indexMap={INDEX_MAP}
              isInColumnSelector={false}
            />
          </QueryBuilderContextProvider>
        </DinaForm>,
        { apiContext: apiClientMock }
      );

      // Ensure the selected picklist value renders
      await waitFor(() => {
        expect(getByText("Test Picklist Attribute")).toBeInTheDocument();
        expect(getByText("Option A")).toBeInTheDocument();
      });
    });

    it("Automatically defaults a boolean search to true if no value is present", async () => {
      const mockSetValue = jest.fn();

      // Pre-select a boolean managed attribute with an empty search value
      const initialValue = JSON.stringify({
        selectedManagedAttribute: {
          id: "d455b5d1-1372-464a-b50a-c4fdbf72cfa8",
          type: "managed-attribute",
          name: "Test Boolean",
          key: "test_bool",
          vocabularyElementType: "BOOL"
        },
        selectedType: "BOOL",
        selectedOperator: "equals",
        searchValue: ""
      });

      mountWithAppContext(
        <DinaForm initialValues={{}}>
          <QueryBuilderContextProvider
            value={{ performSubmit: _.noop, groups: ["aafc"] }}
          >
            <QueryRowManagedAttributeSearch
              value={initialValue}
              setValue={mockSetValue}
              managedAttributeConfig={MOCK_MANAGED_ATTRIBUTE_CONFIG}
              indexMap={INDEX_MAP}
              isInColumnSelector={false}
            />
          </QueryBuilderContextProvider>
        </DinaForm>,
        { apiContext: apiClientMock }
      );

      // The component should recognize the empty bool value and automatically update it to "true"
      await waitFor(() => {
        expect(mockSetValue).toHaveBeenCalledWith(
          expect.stringContaining('"searchValue":"true"')
        );
      });
    });

    it("Hides the operator and value fields when used in the column selector", async () => {
      const initialValue = JSON.stringify({
        searchValue: "",
        selectedOperator: "",
        selectedManagedAttribute: undefined,
        selectedManagedAttributeConfig: undefined,
        selectedType: ""
      });

      const wrapper = mountWithAppContext(
        <DinaForm initialValues={{}}>
          <QueryBuilderContextProvider
            value={{ performSubmit: _.noop, groups: ["aafc"] }}
          >
            <QueryRowManagedAttributeSearch
              value={initialValue}
              setValue={jest.fn()}
              managedAttributeConfig={MOCK_MANAGED_ATTRIBUTE_CONFIG}
              indexMap={INDEX_MAP}
              isInColumnSelector={true} // Set to true for this test
            />
          </QueryBuilderContextProvider>
        </DinaForm>,
        { apiContext: apiClientMock }
      );

      // Click the dropdown menu to display it's options.
      await userEvent.click(wrapper.getByRole("combobox"));
      await waitForLoadingToDisappear();

      // Select the option.
      await userEvent.click(
        wrapper.getByRole("option", { name: /test string attribute/i })
      );

      // The operator dropdown should NOT appear, since we are in the column selector!
      expect(wrapper.getAllByRole("combobox")).toHaveLength(1);
    });
  });

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
            default:
              return "option1";
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
});
