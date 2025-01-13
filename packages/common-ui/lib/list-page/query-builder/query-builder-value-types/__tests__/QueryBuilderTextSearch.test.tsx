import { mountWithAppContext } from "common-ui/lib/test-util/mock-app-context";
import QueryBuilderTextSearch, {
  transformTextSearchToDSL
} from "../QueryBuilderTextSearch";
import { DinaForm } from "common-ui/lib/formik-connected/DinaForm";
import { noop } from "lodash";
import { QueryBuilderContextProvider } from "../../QueryBuilder";
import userEvent from "@testing-library/user-event";

describe("QueryBuilderTextSearch", () => {
  describe("QueryBuilderTextSearch Component", () => {
    it("Display field if match type is equals", async () => {
      // This test will just ensure the layout does not change unexpectedly.
      // Any changes to the layout, the snapshots will need to be updated.
      const textSearchEquals = mountWithAppContext(
        <DinaForm initialValues={{}}>
          <QueryBuilderContextProvider
            value={{ performSubmit: noop, groups: [] }}
          >
            <QueryBuilderTextSearch
              matchType="equals"
              value="test"
              setValue={jest.fn}
            />
          </QueryBuilderContextProvider>
        </DinaForm>
      );

      // Expect a snapshot with the text field being displayed.
      expect(textSearchEquals.asFragment()).toMatchSnapshot(
        "Expect text field to be displayed since match type is equals"
      );

      const textSearchEmpty = mountWithAppContext(
        <DinaForm initialValues={{}}>
          <QueryBuilderContextProvider
            value={{ performSubmit: noop, groups: [] }}
          >
            <QueryBuilderTextSearch
              matchType="empty"
              value="test"
              setValue={jest.fn}
            />
          </QueryBuilderContextProvider>
        </DinaForm>
      );

      // Expect a snapshot without the text field being displayed.
      expect(textSearchEmpty.asFragment()).toMatchSnapshot(
        "Expect text field not to be displayed since the match type is not equals"
      );
    });

    it("Display field if match type is in or not in", async () => {
      // This test will just ensure the layout does not change unexpectedly.
      // Any changes to the layout, the snapshots will need to be updated.
      const textSearchIn = mountWithAppContext(
        <DinaForm initialValues={{}}>
          <QueryBuilderContextProvider
            value={{ performSubmit: noop, groups: [] }}
          >
            <QueryBuilderTextSearch
              matchType="in"
              value="test1, test2, test3"
              setValue={jest.fn}
            />
          </QueryBuilderContextProvider>
        </DinaForm>
      );

      // Expect a snapshot with the text field being with a different placeholder.
      expect(textSearchIn.asFragment()).toMatchSnapshot(
        "Expect text field to be displayed with a different placeholder."
      );

      const textSearchNotIn = mountWithAppContext(
        <DinaForm initialValues={{}}>
          <QueryBuilderContextProvider
            value={{ performSubmit: noop, groups: [] }}
          >
            <QueryBuilderTextSearch
              matchType="notIn"
              value="test1, test2, test3"
              setValue={jest.fn}
            />
          </QueryBuilderContextProvider>
        </DinaForm>
      );

      // Expect a snapshot with the text field being with a different placeholder.
      expect(textSearchNotIn.asFragment()).toMatchSnapshot(
        "Expect text field to be displayed with a different placeholder."
      );
    });

    it("Should call performSubmit on enter key press in textfield", async () => {
      const mockPerformSubmit = jest.fn();
      const { getByRole } = mountWithAppContext(
        <DinaForm initialValues={{}}>
          <QueryBuilderContextProvider
            value={{ performSubmit: mockPerformSubmit, groups: [] }}
          >
            <QueryBuilderTextSearch
              matchType="equals"
              value="test"
              setValue={jest.fn}
            />
          </QueryBuilderContextProvider>
        </DinaForm>
      );

      // Find the text field element
      const textField = getByRole("textbox");

      // Expect performSubmit to not be called yet.
      expect(mockPerformSubmit).toHaveBeenCalledTimes(0);

      // Simulate user typing "enter" key
      userEvent.type(textField, "{enter}");

      // Expect performSubmit to be called once
      expect(mockPerformSubmit).toHaveBeenCalledTimes(1);
    });
  });

  describe("transformTextSearchToDSL function", () => {
    describe("Equals operation", () => {
      test("With relationship as field", async () => {
        expect(
          transformTextSearchToDSL({
            operation: "equals",
            value: "text search",
            fieldInfo: {
              label: "name",
              value: "collection.name",
              type: "text",
              path: "attributes",
              parentName: "collection",
              parentType: "collection",
              parentPath: "included",
              distinctTerm: true,
              keywordMultiFieldSupport: true
            } as any,
            fieldPath: "included.attributes.name",
            queryType: "equals"
          })
        ).toMatchSnapshot();
      });

      test("With relationship containing complex path as field", async () => {
        expect(
          transformTextSearchToDSL({
            operation: "exactMatch",
            value: "text search",
            fieldInfo: {
              label: "determination.scientificName",
              parentName: "organism",
              parentPath: "included",
              parentType: "organism",
              path: "attributes.determination",
              type: "text",
              value: "organism.determination.scientificName",
              keywordMultiFieldSupport: true
            } as any,
            fieldPath: "included.attributes.determination.scientificName",
            queryType: "exactMatch"
          })
        ).toMatchSnapshot();
      });

      test("Normal field", async () => {
        expect(
          transformTextSearchToDSL({
            operation: "equals",
            value: "text search",
            fieldInfo: {} as any,
            fieldPath: "data.attributes.textField",
            queryType: "equals"
          })
        ).toMatchSnapshot();
      });
    });

    describe("in operator", () => {
      test("Normal field", async () => {
        expect(
          transformTextSearchToDSL({
            operation: "in",
            value: "test1, test2, test3",
            fieldInfo: {} as any,
            fieldPath: "data.attributes.textField",
            queryType: "in"
          })
        ).toMatchSnapshot();
      });
    });

    describe("not in operator", () => {
      test("Normal field", async () => {
        expect(
          transformTextSearchToDSL({
            operation: "notIn",
            value: "test1, test2, test3",
            fieldInfo: {} as any,
            fieldPath: "data.attributes.textField",
            queryType: "in"
          })
        ).toMatchSnapshot();
      });
    });

    describe("startsWith (prefix) operation (Non-optimized)", () => {
      test("With relationship as field", async () => {
        expect(
          transformTextSearchToDSL({
            operation: "startsWith",
            value: "text search",
            fieldInfo: {
              label: "name",
              value: "collection.name",
              type: "text",
              path: "attributes",
              parentName: "collection",
              parentType: "collection",
              parentPath: "included",
              distinctTerm: true,
              keywordMultiFieldSupport: false
            } as any,
            fieldPath: "included.attributes.name",
            queryType: "startsWith"
          })
        ).toMatchSnapshot();
      });

      test("With relationship containing complex path as field", async () => {
        expect(
          transformTextSearchToDSL({
            operation: "startsWith",
            value: "text",
            fieldInfo: {
              label: "determination.scientificName",
              parentName: "organism",
              parentPath: "included",
              parentType: "organism",
              path: "attributes.determination",
              type: "text",
              value: "organism.determination.scientificName"
            } as any,
            fieldPath: "included.attributes.determination.scientificName",
            queryType: "startsWith"
          })
        ).toMatchSnapshot();
      });

      test("Normal field", async () => {
        expect(
          transformTextSearchToDSL({
            operation: "startsWith",
            value: "text search",
            fieldInfo: {} as any,
            fieldPath: "data.attributes.textField",
            queryType: "startsWith"
          })
        ).toMatchSnapshot();
      });
    });

    describe("startsWith (prefix) operation (Optimized)", () => {
      test("With relationship as field", async () => {
        expect(
          transformTextSearchToDSL({
            operation: "startsWith",
            value: "text search",
            fieldInfo: {
              label: "name",
              value: "collection.name",
              type: "text",
              path: "attributes",
              parentName: "collection",
              parentType: "collection",
              parentPath: "included",
              distinctTerm: true,
              keywordMultiFieldSupport: true,
              optimizedPrefix: true // Optimized prefix
            } as any,
            fieldPath: "included.attributes.name",
            queryType: "startsWith"
          })
        ).toMatchSnapshot();
      });

      test("With relationship containing complex path as field", async () => {
        expect(
          transformTextSearchToDSL({
            operation: "startsWith",
            value: "text",
            fieldInfo: {
              label: "determination.scientificName",
              parentName: "organism",
              parentPath: "included",
              parentType: "organism",
              path: "attributes.determination",
              type: "text",
              value: "organism.determination.scientificName",
              optimizedPrefix: true // Optimized prefix
            } as any,
            fieldPath: "included.attributes.determination.scientificName",
            queryType: "startsWith"
          })
        ).toMatchSnapshot();
      });

      test("Normal field", async () => {
        expect(
          transformTextSearchToDSL({
            operation: "startsWith",
            value: "text search",
            fieldInfo: {
              optimizedPrefix: true // Optimized prefix
            } as any,
            fieldPath: "data.attributes.textField",
            queryType: "startsWith"
          })
        ).toMatchSnapshot();
      });
    });

    describe("contains (wildcard) operation", () => {
      test("With relationship as field", async () => {
        expect(
          transformTextSearchToDSL({
            operation: "wildcard",
            value: "text search",
            fieldInfo: {
              label: "name",
              value: "collection.name",
              type: "text",
              path: "attributes",
              parentName: "collection",
              parentType: "collection",
              parentPath: "included",
              distinctTerm: true,
              keywordMultiFieldSupport: true
            } as any,
            fieldPath: "included.attributes.name",
            queryType: "wildcard"
          })
        ).toMatchSnapshot();
      });

      test("With relationship containing complex path as field", async () => {
        expect(
          transformTextSearchToDSL({
            operation: "wildcard",
            value: "text",
            fieldInfo: {
              label: "determination.scientificName",
              parentName: "organism",
              parentPath: "included",
              parentType: "organism",
              path: "attributes.determination",
              type: "text",
              value: "organism.determination.scientificName"
            } as any,
            fieldPath: "included.attributes.determination.scientificName",
            queryType: "wildcard"
          })
        ).toMatchSnapshot();
      });

      test("Normal field", async () => {
        expect(
          transformTextSearchToDSL({
            operation: "wildcard",
            value: "text search",
            fieldInfo: {} as any,
            fieldPath: "data.attributes.textField",
            queryType: "wildcard"
          })
        ).toMatchSnapshot();
      });
    });

    describe("ContainsText (Infix) operation", () => {
      test("With relationship as field", async () => {
        expect(
          transformTextSearchToDSL({
            operation: "containsText",
            value: "text search",
            fieldInfo: {
              label: "name",
              value: "collection.name",
              type: "text",
              path: "attributes",
              parentName: "collection",
              parentType: "collection",
              parentPath: "included",
              distinctTerm: true,
              keywordMultiFieldSupport: true
            } as any,
            fieldPath: "included.attributes.name",
            queryType: "containsText"
          })
        ).toMatchSnapshot();
      });

      test("With relationship containing complex path as field", async () => {
        expect(
          transformTextSearchToDSL({
            operation: "containsText",
            value: "text",
            fieldInfo: {
              label: "determination.scientificName",
              parentName: "organism",
              parentPath: "included",
              parentType: "organism",
              path: "attributes.determination",
              type: "text",
              value: "organism.determination.scientificName"
            } as any,
            fieldPath: "included.attributes.determination.scientificName",
            queryType: "containsText"
          })
        ).toMatchSnapshot();
      });

      test("Normal field", async () => {
        expect(
          transformTextSearchToDSL({
            operation: "containsText",
            value: "text search",
            fieldInfo: {} as any,
            fieldPath: "data.attributes.textField",
            queryType: "containsText"
          })
        ).toMatchSnapshot();
      });
    });

    describe("EndsWith operation", () => {
      test("With relationship as field", async () => {
        expect(
          transformTextSearchToDSL({
            operation: "endsWith",
            value: "text search",
            fieldInfo: {
              label: "name",
              value: "collection.name",
              type: "text",
              path: "attributes",
              parentName: "collection",
              parentType: "collection",
              parentPath: "included",
              distinctTerm: true,
              keywordMultiFieldSupport: true
            } as any,
            fieldPath: "included.attributes.name",
            queryType: "endsWith"
          })
        ).toMatchSnapshot();
      });

      test("With relationship containing complex path as field", async () => {
        expect(
          transformTextSearchToDSL({
            operation: "endsWith",
            value: "text",
            fieldInfo: {
              label: "determination.scientificName",
              parentName: "organism",
              parentPath: "included",
              parentType: "organism",
              path: "attributes.determination",
              type: "text",
              value: "organism.determination.scientificName"
            } as any,
            fieldPath: "included.attributes.determination.scientificName",
            queryType: "endsWith"
          })
        ).toMatchSnapshot();
      });

      test("Normal field", async () => {
        expect(
          transformTextSearchToDSL({
            operation: "endsWith",
            value: "text search",
            fieldInfo: {} as any,
            fieldPath: "data.attributes.textField",
            queryType: "endsWith"
          })
        ).toMatchSnapshot();
      });
    });

    describe("Exact Match operation", () => {
      test("With relationship as field", async () => {
        expect(
          transformTextSearchToDSL({
            operation: "exactMatch",
            value: "text search",
            fieldInfo: {
              parentType: "collection",
              parentName: "collection",
              keywordMultiFieldSupport: true
            } as any,
            fieldPath: "includes.name",
            queryType: "exactMatch"
          })
        ).toMatchSnapshot();
      });

      test("Normal field", async () => {
        expect(
          transformTextSearchToDSL({
            operation: "exactMatch",
            value: "text search",
            fieldInfo: {
              keywordMultiFieldSupport: true
            } as any,
            fieldPath: "data.attributes.textField",
            queryType: "exactMatch"
          })
        ).toMatchSnapshot();
      });
    });

    describe("Not Equals operation", () => {
      test("With relationship as field", async () => {
        expect(
          transformTextSearchToDSL({
            operation: "notEquals",
            value: "text search",
            fieldInfo: {
              parentType: "collection",
              parentName: "collection"
            } as any,
            fieldPath: "includes.name",
            queryType: "notEquals"
          })
        ).toMatchSnapshot();
      });

      test("Normal field", async () => {
        expect(
          transformTextSearchToDSL({
            operation: "notEquals",
            value: "text search",
            fieldInfo: {} as any,
            fieldPath: "data.attributes.textField",
            queryType: "notEquals"
          })
        ).toMatchSnapshot();
      });
    });

    describe("Empty operation", () => {
      test("With relationship as field", async () => {
        expect(
          transformTextSearchToDSL({
            operation: "empty",
            value: "text search",
            fieldInfo: {
              parentType: "collection",
              parentName: "collection",
              keywordMultiFieldSupport: true
            } as any,
            fieldPath: "includes.name",
            queryType: "empty"
          })
        ).toMatchSnapshot();
      });

      test("Normal field", async () => {
        expect(
          transformTextSearchToDSL({
            operation: "empty",
            value: "text search",
            fieldInfo: {
              keywordMultiFieldSupport: true
            } as any,
            fieldPath: "data.attributes.textField",
            queryType: "empty"
          })
        ).toMatchSnapshot();
      });
    });

    describe("Not empty operation", () => {
      test("With relationship as field", async () => {
        expect(
          transformTextSearchToDSL({
            operation: "notEmpty",
            value: "text search",
            fieldInfo: {
              parentType: "collection",
              parentName: "collection",
              keywordMultiFieldSupport: true
            } as any,
            fieldPath: "includes.name",
            queryType: "notEmpty"
          })
        ).toMatchSnapshot();
      });

      test("Normal field", async () => {
        expect(
          transformTextSearchToDSL({
            operation: "notEmpty",
            value: "text search",
            fieldInfo: {
              keywordMultiFieldSupport: true
            } as any,
            fieldPath: "data.attributes.textField",
            queryType: "notEmpty"
          })
        ).toMatchSnapshot();
      });
    });

    describe("Equals operation", () => {
      test("With relationship as field", async () => {
        expect(
          transformTextSearchToDSL({
            operation: "equals",
            value: "false",
            fieldInfo: {
              parentType: "collection",
              parentName: "collection",
              keywordMultiFieldSupport: true
            } as any,
            fieldPath: "includes.name",
            queryType: "equals"
          })
        ).toMatchSnapshot();
      });

      test("Normal field", async () => {
        expect(
          transformTextSearchToDSL({
            operation: "equals",
            value: "true",
            fieldInfo: {} as any,
            fieldPath: "data.attributes.textField",
            queryType: "equals"
          })
        ).toMatchSnapshot();
      });
    });

    describe("Edge cases", () => {
      test("If no field value is provided, nothing should be generated.", async () => {
        expect(
          transformTextSearchToDSL({
            operation: "exactMatch",
            value: "false",
            fieldInfo: undefined,
            fieldPath: "includes.name",
            queryType: "exactMatch"
          })
        ).toMatchSnapshot();
      });
    });
  });
});
