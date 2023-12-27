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
    const operators = [
      {
        operator: "containsDate",
        testValues: ["1998", "1998-05", "1998-05-19"]
      },
      {
        operator: "greaterThan",
        testValues: ["1970-07-31"]
      },
      {
        operator: "greaterThanOrEqualTo",
        testValues: ["1981-06-15"]
      },
      {
        operator: "lessThan",
        testValues: ["1982-04-20"]
      },
      {
        operator: "lessThanOrEqualTo",
        testValues: ["1995-06-19"]
      },
      {
        operator: "equals",
        testValues: ["2013-12-16"]
      },
      {
        operator: "notEquals",
        testValues: ["2002-12-30"]
      },
      {
        operator: "empty",
        testValues: [null]
      },
      {
        operator: "notEmpty",
        testValues: [null]
      }
    ];

    const subTypes = [
      undefined,
      "local_date",
      "local_date_time",
      "date_time",
      "date_time_optional_tz"
    ];

    describe("Attribute level tests", () => {
      operators.forEach(({ operator, testValues }) => {
        subTypes.forEach((subType) => {
          testValues.forEach((value) => {
            const testName = `Using the ${operator} operator, ${subType} subtype, testing with ${value} value`;

            test(testName, async () => {
              expect(
                transformDateSearchToDSL({
                  operation: operator,
                  value,
                  fieldInfo: {
                    subType
                  } as any,
                  fieldPath: "data.attributes.dateField",
                  queryType: operator
                })
              ).toMatchSnapshot();
            });
          });
        });
      });
    });

    describe("Relationship level tests", () => {
      operators.forEach(({ operator, testValues }) => {
        subTypes.forEach((subType) => {
          testValues.forEach((value) => {
            const testName = `Using the ${operator} operator, ${subType} subtype, testing with ${value} value`;

            test(testName, async () => {
              expect(
                transformDateSearchToDSL({
                  operation: operator,
                  value,
                  fieldInfo: {
                    subType,
                    parentType: "collection",
                    parentName: "collection"
                  } as any,
                  fieldPath: "includes.name",
                  queryType: operator
                })
              ).toMatchSnapshot();
            });
          });
        });
      });
    });

    describe("Edge cases", () => {
      test("If no field value is provided, nothing should be generated.", async () => {
        expect(
          transformDateSearchToDSL({
            operation: "exactMatch",
            value: "",
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
