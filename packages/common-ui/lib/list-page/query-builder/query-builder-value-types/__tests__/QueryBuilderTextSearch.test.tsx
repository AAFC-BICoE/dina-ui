import { mountWithAppContext } from "common-ui/lib/test-util/mock-app-context";
import QueryBuilderTextSearch, {
  transformTextSearchToDSL
} from "../QueryBuilderTextSearch";

describe("QueryBuilderTextSearch", () => {
  describe("QueryBuilderTextSearch Component", () => {
    it("Display field if match type is equals", async () => {
      // This test will just ensure the layout does not change unexpectedly.
      // Any changes to the layout, the snapshots will need to be updated.
      const boolSearchEquals = mountWithAppContext(
        <QueryBuilderTextSearch
          matchType="equals"
          value="test"
          setValue={jest.fn}
        />
      );

      // Expect a snapshot with the text field being displayed.
      expect(
        boolSearchEquals.find(QueryBuilderTextSearch).debug()
      ).toMatchSnapshot(
        "Expect text field to be displayed since match type is equals"
      );

      const boolSearchEmpty = mountWithAppContext(
        <QueryBuilderTextSearch
          matchType="empty"
          value="test"
          setValue={jest.fn}
        />
      );

      // Expect a snapshot without the text field being displayed.
      expect(
        boolSearchEmpty.find(QueryBuilderTextSearch).debug()
      ).toMatchSnapshot(
        "Expect text field not to be displayed since the match type is not equals"
      );
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
              parentType: "collection",
              parentName: "collection"
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
            value: "text search",
            fieldInfo: {} as any,
            fieldPath: "data.attributes.booleanField",
            queryType: "equals"
          })
        ).toMatchSnapshot();
      });
    });

    describe("Partial Match operation", () => {
      test("With relationship as field", async () => {
        expect(
          transformTextSearchToDSL({
            operation: "partialMatch",
            value: "text search",
            fieldInfo: {
              parentType: "collection",
              parentName: "collection"
            } as any,
            fieldPath: "includes.name",
            queryType: "partialMatch"
          })
        ).toMatchSnapshot();
      });

      test("Normal field", async () => {
        expect(
          transformTextSearchToDSL({
            operation: "partialMatch",
            value: "text search",
            fieldInfo: {} as any,
            fieldPath: "data.attributes.booleanField",
            queryType: "partialMatch"
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
              parentName: "collection"
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
            fieldInfo: {} as any,
            fieldPath: "data.attributes.booleanField",
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
            fieldPath: "data.attributes.booleanField",
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
              parentName: "collection"
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
            fieldInfo: {} as any,
            fieldPath: "data.attributes.booleanField",
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
              parentName: "collection"
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
            fieldInfo: {} as any,
            fieldPath: "data.attributes.booleanField",
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
              parentName: "collection"
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
            fieldPath: "data.attributes.booleanField",
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
