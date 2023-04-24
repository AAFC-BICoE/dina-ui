import { mountWithAppContext } from "common-ui/lib/test-util/mock-app-context";
import QueryBuilderDateSearch, {
  transformDateSearchToDSL,
  validateDate
} from "../QueryBuilderDateSearch";

describe("QueryBuilderDateSearch", () => {
  describe("QueryBuilderDateSearch Component", () => {
    it("Display field if match type is equals", async () => {
      // This test will just ensure the layout does not change unexpectedly.
      // Any changes to the layout, the snapshots will need to be updated.
      const dateSearchEquals = mountWithAppContext(
        <QueryBuilderDateSearch
          matchType="equals"
          value="test"
          setValue={jest.fn}
        />
      );

      // Expect a snapshot with the date field being displayed.
      expect(
        dateSearchEquals.find(QueryBuilderDateSearch).debug()
      ).toMatchSnapshot(
        "Expect date field to be displayed since match type is equals"
      );

      const dateSearchEmpty = mountWithAppContext(
        <QueryBuilderDateSearch
          matchType="empty"
          value="test"
          setValue={jest.fn}
        />
      );

      // Expect a snapshot without the date field being displayed.
      expect(
        dateSearchEmpty.find(QueryBuilderDateSearch).debug()
      ).toMatchSnapshot(
        "Expect date field not to be displayed since the match type is not equals"
      );
    });
  });

  describe("transformDateSearchToDSL function", () => {
    describe("ContainsDate operation", () => {
      test("With relationship as field", async () => {
        expect(
          transformDateSearchToDSL({
            operation: "containsDate",
            value: "1998",
            fieldInfo: {
              parentType: "collection",
              parentName: "collection"
            } as any,
            fieldPath: "includes.name",
            queryType: "containsDate"
          })
        ).toMatchSnapshot();
      });

      test("Normal field", async () => {
        // Contains the year only.
        expect(
          transformDateSearchToDSL({
            operation: "containsDate",
            value: "1998",
            fieldInfo: {} as any,
            fieldPath: "data.attributes.dateField",
            queryType: "containsDate"
          })
        ).toMatchSnapshot();

        // Contains the year and month only.
        expect(
          transformDateSearchToDSL({
            operation: "containsDate",
            value: "1998-05",
            fieldInfo: {} as any,
            fieldPath: "data.attributes.dateField",
            queryType: "containsDate"
          })
        ).toMatchSnapshot();

        // Contains the full date.
        expect(
          transformDateSearchToDSL({
            operation: "containsDate",
            value: "1998-05-19",
            fieldInfo: {} as any,
            fieldPath: "data.attributes.dateField",
            queryType: "containsDate"
          })
        ).toMatchSnapshot();
      });
    });

    describe("Greater Than operation", () => {
      test("With relationship as field", async () => {
        expect(
          transformDateSearchToDSL({
            operation: "greaterThan",
            value: "1998-05-19",
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
          transformDateSearchToDSL({
            operation: "greaterThan",
            value: "1998-05-19",
            fieldInfo: {} as any,
            fieldPath: "data.attributes.dateField",
            queryType: "greaterThan"
          })
        ).toMatchSnapshot();
      });
    });

    describe("Greater Than Or Equal To operation", () => {
      test("With relationship as field", async () => {
        expect(
          transformDateSearchToDSL({
            operation: "greaterThanOrEqualTo",
            value: "1998-05-19",
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
          transformDateSearchToDSL({
            operation: "greaterThanOrEqualTo",
            value: "1998-05-19",
            fieldInfo: {} as any,
            fieldPath: "data.attributes.dateField",
            queryType: "greaterThanOrEqualTo"
          })
        ).toMatchSnapshot();
      });
    });

    describe("Less Than operation", () => {
      test("With relationship as field", async () => {
        expect(
          transformDateSearchToDSL({
            operation: "lessThan",
            value: "1998-05-19",
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
          transformDateSearchToDSL({
            operation: "lessThan",
            value: "1998-05-19",
            fieldInfo: {} as any,
            fieldPath: "data.attributes.dateField",
            queryType: "lessThan"
          })
        ).toMatchSnapshot();
      });
    });

    describe("lessThanOrEqualTo operation", () => {
      test("With relationship as field", async () => {
        expect(
          transformDateSearchToDSL({
            operation: "lessThanOrEqualTo",
            value: "1998-05-19",
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
          transformDateSearchToDSL({
            operation: "lessThanOrEqualTo",
            value: "1998-05-19",
            fieldInfo: {} as any,
            fieldPath: "data.attributes.dateField",
            queryType: "lessThanOrEqualTo"
          })
        ).toMatchSnapshot();
      });
    });

    describe("Equals operation", () => {
      test("With relationship as field", async () => {
        expect(
          transformDateSearchToDSL({
            operation: "equals",
            value: "1998-05-19",
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
          transformDateSearchToDSL({
            operation: "equals",
            value: "1998-05-19",
            fieldInfo: {} as any,
            fieldPath: "data.attributes.dateField",
            queryType: "equals"
          })
        ).toMatchSnapshot();
      });
    });

    describe("Partial Match operation", () => {
      test("With relationship as field", async () => {
        expect(
          transformDateSearchToDSL({
            operation: "partialMatch",
            value: "1998-05-19",
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
          transformDateSearchToDSL({
            operation: "partialMatch",
            value: "1998-05-19",
            fieldInfo: {} as any,
            fieldPath: "data.attributes.dateField",
            queryType: "partialMatch"
          })
        ).toMatchSnapshot();
      });
    });

    describe("Exact Match operation", () => {
      test("With relationship as field", async () => {
        expect(
          transformDateSearchToDSL({
            operation: "exactMatch",
            value: "1998-05-19",
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
          transformDateSearchToDSL({
            operation: "exactMatch",
            value: "1998-05-19",
            fieldInfo: {} as any,
            fieldPath: "data.attributes.dateField",
            queryType: "exactMatch"
          })
        ).toMatchSnapshot();
      });
    });

    describe("Not Equals operation", () => {
      test("With relationship as field", async () => {
        expect(
          transformDateSearchToDSL({
            operation: "notEquals",
            value: "1998-05-19",
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
          transformDateSearchToDSL({
            operation: "notEquals",
            value: "1998-05-19",
            fieldInfo: {} as any,
            fieldPath: "data.attributes.dateField",
            queryType: "notEquals"
          })
        ).toMatchSnapshot();
      });
    });

    describe("Empty operation", () => {
      test("With relationship as field", async () => {
        expect(
          transformDateSearchToDSL({
            operation: "empty",
            value: "1998-05-19",
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
          transformDateSearchToDSL({
            operation: "empty",
            value: "1998-05-19",
            fieldInfo: {} as any,
            fieldPath: "data.attributes.dateField",
            queryType: "empty"
          })
        ).toMatchSnapshot();
      });
    });

    describe("Not empty operation", () => {
      test("With relationship as field", async () => {
        expect(
          transformDateSearchToDSL({
            operation: "notEmpty",
            value: "1998-05-19",
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
          transformDateSearchToDSL({
            operation: "notEmpty",
            value: "1998-05-19",
            fieldInfo: {} as any,
            fieldPath: "data.attributes.dateField",
            queryType: "notEmpty"
          })
        ).toMatchSnapshot();
      });
    });

    describe("Equals operation", () => {
      test("With relationship as field", async () => {
        expect(
          transformDateSearchToDSL({
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
          transformDateSearchToDSL({
            operation: "equals",
            value: "true",
            fieldInfo: {} as any,
            fieldPath: "data.attributes.dateField",
            queryType: "equals"
          })
        ).toMatchSnapshot();
      });
    });

    describe("Edge cases", () => {
      test("If no field value is provided, nothing should be generated.", async () => {
        expect(
          transformDateSearchToDSL({
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

  describe("validateDate function", () => {
    test("Correct date formats", async () => {
      // Null is expected, since it will return an error message if incorrect.
      expect(validateDate("1998", jest.fn)).toBeNull();
      expect(validateDate("1998-05", jest.fn)).toBeNull();
      expect(validateDate("1998-05-19", jest.fn)).toBeNull();
    });

    test("Invalid date formats", async () => {
      expect(validateDate("19-05-1998", jest.fn)).not.toBeNull();
      expect(validateDate("today", jest.fn)).not.toBeNull();
      expect(validateDate("December 19th 2022", jest.fn)).not.toBeNull();
    });
  });
});
