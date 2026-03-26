import { mountWithAppContext } from "common-ui/lib/test-util/mock-app-context";
import { DinaForm } from "common-ui/lib/formik-connected/DinaForm";
import { QueryBuilderContextProvider } from "../../QueryBuilder";
import _ from "lodash";
import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import {
  QueryRowRelationshipAutocompleteSearch,
  transformRelationshipAutocompleteToDSL
} from "../QueryBuilderRelationshipAutocompleteSearch";
import { ESIndexMapping } from "../../../types";

const mockGet = jest.fn<any, any>(async (path) => {
  if (path === "agent-api/person") {
    return {
      data: [
        { id: "person-1", displayName: "John Doe" },
        { id: "person-2", displayName: "Jane Smith" },
        { id: "person-3", displayName: "Bob Johnson" }
      ]
    };
  }
  return { data: [] };
});

const apiContext: any = {
  apiClient: { get: mockGet }
};

const FIELD_MAPPING: ESIndexMapping = {
  label: "collectingEventCollectors",
  value: "collectingEventCollectors",
  type: "relationshipAutocomplete",
  path: "included.relationships.collectors.data",
  relationshipAutocompleteConfig: {
    type: "relationshipAutocomplete",
    label: "collectingEventCollectors",
    path: "included.relationships.collectors.data",
    referencedBy: "collectingEvent",
    referencedType: "collecting-event",
    apiEndpoint: "agent-api/person",
    optionLabel: "displayName",
    elasticSearchRelationshipPath: "included.relationships.collectors.data.id"
  },
  distinctTerm: false,
  keywordMultiFieldSupport: false,
  optimizedPrefix: false,
  containsSupport: false,
  endsWithSupport: false,
  hideField: false,
  keywordNumericSupport: false,
  parentName: "collectingEvent",
  parentType: "collecting-event",
  parentPath: "included"
};

/**
 * AI Assisted Test Generation
 */
describe("QueryBuilderRelationshipAutocompleteSearch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("QueryRowRelationshipAutocompleteSearch Component", () => {
    it("should render autocomplete field for equals operator", async () => {
      const { container, queryByRole } = mountWithAppContext(
        <DinaForm initialValues={{}}>
          <QueryBuilderContextProvider
            value={{ performSubmit: _.noop, groups: [] }}
          >
            <QueryRowRelationshipAutocompleteSearch
              matchType="equals"
              value='{"selectedResourceUUID":"","selectedResourceLabel":""}'
              setValue={jest.fn()}
              fieldMapping={FIELD_MAPPING}
            />
          </QueryBuilderContextProvider>
        </DinaForm>,
        { apiContext }
      );

      // Should render the select component
      expect(queryByRole("combobox")).toBeInTheDocument();
      expect(container).toMatchSnapshot(
        "Expect autocomplete field to be displayed for equals operator"
      );
    });

    it("should not render field for empty operator", async () => {
      const { queryByRole } = mountWithAppContext(
        <DinaForm initialValues={{}}>
          <QueryBuilderContextProvider
            value={{ performSubmit: _.noop, groups: [] }}
          >
            <QueryRowRelationshipAutocompleteSearch
              matchType="empty"
              value='{"selectedResourceUUID":"","selectedResourceLabel":""}'
              setValue={jest.fn()}
              fieldMapping={FIELD_MAPPING}
            />
          </QueryBuilderContextProvider>
        </DinaForm>,
        { apiContext }
      );

      // Should not render anything for empty operator
      expect(queryByRole("combobox")).not.toBeInTheDocument();
    });

    it("should not render field for notEmpty operator", async () => {
      const { queryByRole } = mountWithAppContext(
        <DinaForm initialValues={{}}>
          <QueryBuilderContextProvider
            value={{ performSubmit: _.noop, groups: [] }}
          >
            <QueryRowRelationshipAutocompleteSearch
              matchType="notEmpty"
              value='{"selectedResourceUUID":"","selectedResourceLabel":""}'
              setValue={jest.fn()}
              fieldMapping={FIELD_MAPPING}
            />
          </QueryBuilderContextProvider>
        </DinaForm>,
        { apiContext }
      );

      expect(queryByRole("combobox")).not.toBeInTheDocument();
    });

    it("should load and display resource options when typing", async () => {
      const { getByRole, findByText } = mountWithAppContext(
        <DinaForm initialValues={{}}>
          <QueryBuilderContextProvider
            value={{ performSubmit: _.noop, groups: [] }}
          >
            <QueryRowRelationshipAutocompleteSearch
              matchType="equals"
              value='{"selectedResourceUUID":"","selectedResourceLabel":""}'
              setValue={jest.fn()}
              fieldMapping={FIELD_MAPPING}
            />
          </QueryBuilderContextProvider>
        </DinaForm>,
        { apiContext }
      );

      const combobox = getByRole("combobox");

      // Type to trigger search
      userEvent.type(combobox, "John");

      // Wait for API call
      await waitFor(() => {
        expect(mockGet).toHaveBeenCalledWith(
          "agent-api/person",
          expect.objectContaining({
            filter: expect.any(Object),
            page: { limit: 25 }
          })
        );
      });

      // Wait for options to appear
      await waitFor(() => {
        expect(findByText("John Doe")).toBeTruthy();
      });
    });

    it("should call setValue when an option is selected", async () => {
      const mockSetValue = jest.fn();
      const { getByRole } = mountWithAppContext(
        <DinaForm initialValues={{}}>
          <QueryBuilderContextProvider
            value={{ performSubmit: _.noop, groups: [] }}
          >
            <QueryRowRelationshipAutocompleteSearch
              matchType="equals"
              value='{"selectedResourceUUID":"","selectedResourceLabel":""}'
              setValue={mockSetValue}
              fieldMapping={FIELD_MAPPING}
            />
          </QueryBuilderContextProvider>
        </DinaForm>,
        { apiContext }
      );

      const combobox = getByRole("combobox");

      // Type to trigger search
      userEvent.type(combobox, "John");

      // Wait for API call and options
      await waitFor(() => {
        expect(mockGet).toHaveBeenCalled();
      });

      // setValue should be called when state changes
      await waitFor(() => {
        expect(mockSetValue).toHaveBeenCalled();
      });
    });

    it("should display selected value correctly", async () => {
      const { getByText } = mountWithAppContext(
        <DinaForm initialValues={{}}>
          <QueryBuilderContextProvider
            value={{ performSubmit: _.noop, groups: [] }}
          >
            <QueryRowRelationshipAutocompleteSearch
              matchType="equals"
              value='{"selectedResourceUUID":"person-1","selectedResourceLabel":"John Doe"}'
              setValue={jest.fn()}
              fieldMapping={FIELD_MAPPING}
            />
          </QueryBuilderContextProvider>
        </DinaForm>,
        { apiContext }
      );

      // The selected value label should be displayed in the select
      await waitFor(() => {
        expect(getByText(/john doe/i)).toBeInTheDocument();
      });
    });

    it("should handle API errors gracefully", async () => {
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockGet.mockRejectedValueOnce(new Error("API Error"));

      const { getByRole } = mountWithAppContext(
        <DinaForm initialValues={{}}>
          <QueryBuilderContextProvider
            value={{ performSubmit: _.noop, groups: [] }}
          >
            <QueryRowRelationshipAutocompleteSearch
              matchType="equals"
              value='{"selectedResourceUUID":"","selectedResourceLabel":""}'
              setValue={jest.fn()}
              fieldMapping={FIELD_MAPPING}
            />
          </QueryBuilderContextProvider>
        </DinaForm>,
        { apiContext }
      );

      const combobox = getByRole("combobox");
      userEvent.type(combobox, "John");

      // Wait for error to be logged
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Error loading resources for autocomplete:",
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it("should debounce API calls", async () => {
      const { getByRole } = mountWithAppContext(
        <DinaForm initialValues={{}}>
          <QueryBuilderContextProvider
            value={{ performSubmit: _.noop, groups: [] }}
          >
            <QueryRowRelationshipAutocompleteSearch
              matchType="equals"
              value='{"selectedResourceUUID":"","selectedResourceLabel":""}'
              setValue={jest.fn()}
              fieldMapping={FIELD_MAPPING}
            />
          </QueryBuilderContextProvider>
        </DinaForm>,
        { apiContext }
      );

      const combobox = getByRole("combobox");

      // Type multiple characters quickly
      userEvent.type(combobox, "John");

      // Should only call API once after debounce period
      await waitFor(
        () => {
          expect(mockGet).toHaveBeenCalledTimes(1);
        },
        { timeout: 500 }
      );
    });
  });

  describe("transformRelationshipAutocompleteToDSL function", () => {
    describe("Equals operation", () => {
      test("With relationship as field (included path)", async () => {
        expect(
          transformRelationshipAutocompleteToDSL({
            operation: "equals",
            value:
              '{"selectedResourceUUID":"person-1","selectedResourceLabel":"John Doe"}',
            fieldInfo: FIELD_MAPPING,
            fieldPath: "included.relationships.collectors.data.id",
            queryType: "equals"
          })
        ).toMatchSnapshot();
      });

      test("With direct path (not included)", async () => {
        const directFieldMapping: ESIndexMapping = {
          ...FIELD_MAPPING,
          path: "data.relationships.collectors.data",
          relationshipAutocompleteConfig: {
            type: "relationshipAutocomplete",
            label: "collectingEventCollectors",
            path: "data.relationships.collectors.data",
            referencedBy: "collectingEvent",
            referencedType: "collecting-event",
            apiEndpoint: "agent-api/person",
            optionLabel: "displayName",
            elasticSearchRelationshipPath:
              "data.relationships.collectors.data.id"
          }
        };

        expect(
          transformRelationshipAutocompleteToDSL({
            operation: "equals",
            value:
              '{"selectedResourceUUID":"person-1","selectedResourceLabel":"John Doe"}',
            fieldInfo: directFieldMapping,
            fieldPath: "data.relationships.collectors.data.id",
            queryType: "equals"
          })
        ).toMatchSnapshot();
      });
    });

    describe("Not Equals operation", () => {
      test("With relationship as field (included path)", async () => {
        expect(
          transformRelationshipAutocompleteToDSL({
            operation: "notEquals",
            value:
              '{"selectedResourceUUID":"person-1","selectedResourceLabel":"John Doe"}',
            fieldInfo: FIELD_MAPPING,
            fieldPath: "included.relationships.collectors.data.id",
            queryType: "notEquals"
          })
        ).toMatchSnapshot();
      });

      test("With direct path (not included)", async () => {
        const directFieldMapping: ESIndexMapping = {
          ...FIELD_MAPPING,
          path: "data.relationships.collectors.data",
          relationshipAutocompleteConfig: {
            type: "relationshipAutocomplete",
            label: "collectingEventCollectors",
            path: "data.relationships.collectors.data",
            referencedBy: "collectingEvent",
            referencedType: "collecting-event",
            apiEndpoint: "agent-api/person",
            optionLabel: "displayName",
            elasticSearchRelationshipPath:
              "data.relationships.collectors.data.id"
          }
        };

        expect(
          transformRelationshipAutocompleteToDSL({
            operation: "notEquals",
            value:
              '{"selectedResourceUUID":"person-1","selectedResourceLabel":"John Doe"}',
            fieldInfo: directFieldMapping,
            fieldPath: "data.relationships.collectors.data.id",
            queryType: "notEquals"
          })
        ).toMatchSnapshot();
      });
    });

    describe("Empty operation", () => {
      test("With relationship as field (included path)", async () => {
        expect(
          transformRelationshipAutocompleteToDSL({
            operation: "empty",
            value: '{"selectedResourceUUID":"","selectedResourceLabel":""}',
            fieldInfo: FIELD_MAPPING,
            fieldPath: "included.relationships.collectors.data.id",
            queryType: "empty"
          })
        ).toMatchSnapshot();
      });

      test("With direct path (not included)", async () => {
        const directFieldMapping: ESIndexMapping = {
          ...FIELD_MAPPING,
          path: "data.relationships.collectors.data",
          relationshipAutocompleteConfig: {
            type: "relationshipAutocomplete",
            label: "collectingEventCollectors",
            path: "data.relationships.collectors.data",
            referencedBy: "collectingEvent",
            referencedType: "collecting-event",
            apiEndpoint: "agent-api/person",
            optionLabel: "displayName",
            elasticSearchRelationshipPath:
              "data.relationships.collectors.data.id"
          }
        };

        expect(
          transformRelationshipAutocompleteToDSL({
            operation: "empty",
            value: '{"selectedResourceUUID":"","selectedResourceLabel":""}',
            fieldInfo: directFieldMapping,
            fieldPath: "data.relationships.collectors.data.id",
            queryType: "empty"
          })
        ).toMatchSnapshot();
      });
    });

    describe("Not Empty operation", () => {
      test("With relationship as field (included path)", async () => {
        expect(
          transformRelationshipAutocompleteToDSL({
            operation: "notEmpty",
            value: '{"selectedResourceUUID":"","selectedResourceLabel":""}',
            fieldInfo: FIELD_MAPPING,
            fieldPath: "included.relationships.collectors.data.id",
            queryType: "notEmpty"
          })
        ).toMatchSnapshot();
      });

      test("With direct path (not included)", async () => {
        const directFieldMapping: ESIndexMapping = {
          ...FIELD_MAPPING,
          path: "data.relationships.collectors.data",
          relationshipAutocompleteConfig: {
            type: "relationshipAutocomplete",
            label: "collectingEventCollectors",
            path: "data.relationships.collectors.data",
            referencedBy: "collectingEvent",
            referencedType: "collecting-event",
            apiEndpoint: "agent-api/person",
            optionLabel: "displayName",
            elasticSearchRelationshipPath:
              "data.relationships.collectors.data.id"
          }
        };

        expect(
          transformRelationshipAutocompleteToDSL({
            operation: "notEmpty",
            value: '{"selectedResourceUUID":"","selectedResourceLabel":""}',
            fieldInfo: directFieldMapping,
            fieldPath: "data.relationships.collectors.data.id",
            queryType: "notEmpty"
          })
        ).toMatchSnapshot();
      });
    });

    describe("Edge cases", () => {
      test("If no elasticSearchRelationshipPath is provided, nothing should be generated", async () => {
        const invalidFieldMapping: ESIndexMapping = {
          ...FIELD_MAPPING,
          relationshipAutocompleteConfig: {
            type: "relationshipAutocomplete",
            label: "collectingEventCollectors",
            path: "included.relationships.collectors.data",
            referencedBy: "collectingEvent",
            referencedType: "collecting-event",
            apiEndpoint: "agent-api/person",
            optionLabel: "displayName"
            // elasticSearchRelationshipPath is missing
          }
        };

        expect(
          transformRelationshipAutocompleteToDSL({
            operation: "equals",
            value:
              '{"selectedResourceUUID":"person-1","selectedResourceLabel":"John Doe"}',
            fieldInfo: invalidFieldMapping,
            fieldPath: "included.relationships.collectors.data.id",
            queryType: "equals"
          })
        ).toMatchSnapshot();
      });

      test("If value is empty string, nothing should be generated", async () => {
        expect(
          transformRelationshipAutocompleteToDSL({
            operation: "equals",
            value: "",
            fieldInfo: FIELD_MAPPING,
            fieldPath: "included.relationships.collectors.data.id",
            queryType: "equals"
          })
        ).toMatchSnapshot();
      });

      test("If value is not a string, nothing should be generated", async () => {
        expect(
          transformRelationshipAutocompleteToDSL({
            operation: "equals",
            value: null as any,
            fieldInfo: FIELD_MAPPING,
            fieldPath: "included.relationships.collectors.data.id",
            queryType: "equals"
          })
        ).toMatchSnapshot();
      });

      test("If value is invalid JSON, nothing should be generated", async () => {
        const consoleErrorSpy = jest
          .spyOn(console, "error")
          .mockImplementation(() => {});

        expect(
          transformRelationshipAutocompleteToDSL({
            operation: "equals",
            value: "{invalid json",
            fieldInfo: FIELD_MAPPING,
            fieldPath: "included.relationships.collectors.data.id",
            queryType: "equals"
          })
        ).toMatchSnapshot();

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Error transforming relationship autocomplete search to DSL:",
          expect.any(Error)
        );

        consoleErrorSpy.mockRestore();
      });

      test("If selectedResourceUUID is empty, nothing should be generated", async () => {
        expect(
          transformRelationshipAutocompleteToDSL({
            operation: "equals",
            value:
              '{"selectedResourceUUID":"","selectedResourceLabel":"John Doe"}',
            fieldInfo: FIELD_MAPPING,
            fieldPath: "included.relationships.collectors.data.id",
            queryType: "equals"
          })
        ).toMatchSnapshot();
      });

      test("If fieldInfo is undefined, nothing should be generated", async () => {
        expect(
          transformRelationshipAutocompleteToDSL({
            operation: "equals",
            value:
              '{"selectedResourceUUID":"person-1","selectedResourceLabel":"John Doe"}',
            fieldInfo: undefined,
            fieldPath: "included.relationships.collectors.data.id",
            queryType: "equals"
          })
        ).toMatchSnapshot();
      });

      test("If relationshipAutocompleteConfig is undefined, nothing should be generated", async () => {
        const invalidFieldMapping: ESIndexMapping = {
          ...FIELD_MAPPING
        };
        delete invalidFieldMapping.relationshipAutocompleteConfig;

        expect(
          transformRelationshipAutocompleteToDSL({
            operation: "equals",
            value:
              '{"selectedResourceUUID":"person-1","selectedResourceLabel":"John Doe"}',
            fieldInfo: invalidFieldMapping,
            fieldPath: "included.relationships.collectors.data.id",
            queryType: "equals"
          })
        ).toMatchSnapshot();
      });
    });
  });
});
