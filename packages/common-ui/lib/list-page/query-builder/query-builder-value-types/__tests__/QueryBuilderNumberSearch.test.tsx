import { mountWithAppContext } from "common-ui/lib/test-util/mock-app-context";
import QueryBuilderNumberSearch, {
  transformNumberSearchToDSL
} from "../QueryBuilderNumberSearch";

describe("QueryBuilderNumberSearch", () => {
  describe("QueryBuilderNumberSearch Component", () => {
    it("Display field if match type is equals", async () => {
      // This test will just ensure the layout does not change unexpectedly.
      // Any changes to the layout, the snapshots will need to be updated.
      const numberSearchEquals = mountWithAppContext(
        <QueryBuilderNumberSearch
          matchType="equals"
          value="test"
          setValue={jest.fn}
        />
      );

      // Expect a snapshot with the number field being displayed.
      expect(
        numberSearchEquals.find(QueryBuilderNumberSearch).debug()
      ).toMatchSnapshot(
        "Expect number field to be displayed since match type is equals"
      );

      const numberSearchEmpty = mountWithAppContext(
        <QueryBuilderNumberSearch
          matchType="empty"
          value="test"
          setValue={jest.fn}
        />
      );

      // Expect a snapshot without the number field being displayed.
      expect(
        numberSearchEmpty.find(QueryBuilderNumberSearch).debug()
      ).toMatchSnapshot(
        "Expect number field not to be displayed since the match type is not equals"
      );
    });
  });

  describe("transformNumberSearchToDSL function", () => {
    describe("Equals operation", () => {
      test("With relationship as field", async () => {
        expect(
          transformNumberSearchToDSL({
            operation: "equals",
            value: "123",
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
          transformNumberSearchToDSL({
            operation: "equals",
            value: "123",
            fieldInfo: {} as any,
            fieldPath: "data.attributes.numberField",
            queryType: "equals"
          })
        ).toMatchSnapshot();
      });
    });

    describe("Greater Than operation", () => {
      test("With relationship as field", async () => {
        expect(
          transformNumberSearchToDSL({
            operation: "greaterThan",
            value: "123",
            fieldInfo: {
              parentType: "collection",
              parentName: "collection"
            } as any,
            fieldPath: "includes.name",
            queryType: "greaterThan"
          })
        ).toMatchSnapshot();
      });

      test("Normal field", async () => {
        expect(
          transformNumberSearchToDSL({
            operation: "greaterThan",
            value: "123",
            fieldInfo: {} as any,
            fieldPath: "data.attributes.numberField",
            queryType: "greaterThan"
          })
        ).toMatchSnapshot();
      });
    });

    describe("Greater Than Or Equal To operation", () => {
      test("With relationship as field", async () => {
        expect(
          transformNumberSearchToDSL({
            operation: "greaterThanOrEqualTo",
            value: "123",
            fieldInfo: {
              parentType: "collection",
              parentName: "collection"
            } as any,
            fieldPath: "includes.name",
            queryType: "greaterThanOrEqualTo"
          })
        ).toMatchSnapshot();
      });

      test("Normal field", async () => {
        expect(
          transformNumberSearchToDSL({
            operation: "greaterThanOrEqualTo",
            value: "123",
            fieldInfo: {} as any,
            fieldPath: "data.attributes.numberField",
            queryType: "greaterThanOrEqualTo"
          })
        ).toMatchSnapshot();
      });
    });

    describe("Less Than operation", () => {
      test("With relationship as field", async () => {
        expect(
          transformNumberSearchToDSL({
            operation: "lessThan",
            value: "123",
            fieldInfo: {
              parentType: "collection",
              parentName: "collection"
            } as any,
            fieldPath: "includes.name",
            queryType: "lessThan"
          })
        ).toMatchSnapshot();
      });

      test("Normal field", async () => {
        expect(
          transformNumberSearchToDSL({
            operation: "lessThan",
            value: "123",
            fieldInfo: {} as any,
            fieldPath: "data.attributes.numberField",
            queryType: "lessThan"
          })
        ).toMatchSnapshot();
      });
    });

    describe("lessThanOrEqualTo operation", () => {
      test("With relationship as field", async () => {
        expect(
          transformNumberSearchToDSL({
            operation: "lessThanOrEqualTo",
            value: "123",
            fieldInfo: {
              parentType: "collection",
              parentName: "collection"
            } as any,
            fieldPath: "includes.name",
            queryType: "lessThanOrEqualTo"
          })
        ).toMatchSnapshot();
      });

      test("Normal field", async () => {
        expect(
          transformNumberSearchToDSL({
            operation: "lessThanOrEqualTo",
            value: "123",
            fieldInfo: {} as any,
            fieldPath: "data.attributes.numberField",
            queryType: "lessThanOrEqualTo"
          })
        ).toMatchSnapshot();
      });
    });

    describe("Equals operation", () => {
      test("With relationship as field", async () => {
        expect(
          transformNumberSearchToDSL({
            operation: "equals",
            value: "123",
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
          transformNumberSearchToDSL({
            operation: "equals",
            value: "123",
            fieldInfo: {} as any,
            fieldPath: "data.attributes.numberField",
            queryType: "equals"
          })
        ).toMatchSnapshot();
      });
    });

    describe("Partial Match operation", () => {
      test("With relationship as field", async () => {
        expect(
          transformNumberSearchToDSL({
            operation: "partialMatch",
            value: "123",
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
          transformNumberSearchToDSL({
            operation: "partialMatch",
            value: "123",
            fieldInfo: {} as any,
            fieldPath: "data.attributes.numberField",
            queryType: "partialMatch"
          })
        ).toMatchSnapshot();
      });
    });

    describe("Exact Match operation", () => {
      test("With relationship as field", async () => {
        expect(
          transformNumberSearchToDSL({
            operation: "exactMatch",
            value: "123",
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
          transformNumberSearchToDSL({
            operation: "exactMatch",
            value: "123",
            fieldInfo: {} as any,
            fieldPath: "data.attributes.numberField",
            queryType: "exactMatch"
          })
        ).toMatchSnapshot();
      });
    });

    describe("Not Equals operation", () => {
      test("With relationship as field", async () => {
        expect(
          transformNumberSearchToDSL({
            operation: "notEquals",
            value: "123",
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
          transformNumberSearchToDSL({
            operation: "notEquals",
            value: "123",
            fieldInfo: {} as any,
            fieldPath: "data.attributes.numberField",
            queryType: "notEquals"
          })
        ).toMatchSnapshot();
      });
    });

    describe("Empty operation", () => {
      test("With relationship as field", async () => {
        expect(
          transformNumberSearchToDSL({
            operation: "empty",
            value: "123",
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
          transformNumberSearchToDSL({
            operation: "empty",
            value: "123",
            fieldInfo: {} as any,
            fieldPath: "data.attributes.numberField",
            queryType: "empty"
          })
        ).toMatchSnapshot();
      });
    });

    describe("Not empty operation", () => {
      test("With relationship as field", async () => {
        expect(
          transformNumberSearchToDSL({
            operation: "notEmpty",
            value: "123",
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
          transformNumberSearchToDSL({
            operation: "notEmpty",
            value: "123",
            fieldInfo: {} as any,
            fieldPath: "data.attributes.numberField",
            queryType: "notEmpty"
          })
        ).toMatchSnapshot();
      });
    });

    describe("Equals operation", () => {
      test("With relationship as field", async () => {
        expect(
          transformNumberSearchToDSL({
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
          transformNumberSearchToDSL({
            operation: "equals",
            value: "true",
            fieldInfo: {} as any,
            fieldPath: "data.attributes.numberField",
            queryType: "equals"
          })
        ).toMatchSnapshot();
      });
    });

    describe("Edge cases", () => {
      test("If no field value is provided, nothing should be generated.", async () => {
        expect(
          transformNumberSearchToDSL({
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
