import { mountWithAppContext2 } from "common-ui/lib/test-util/mock-app-context";
import QueryBuilderDateSearch, {
  transformDateSearchToDSL,
  validateDate
} from "../QueryBuilderDateSearch";
import { DinaForm } from "common-ui/lib/formik-connected/DinaForm";
import { QueryBuilderContextProvider } from "../../QueryBuilder";
import { noop } from "lodash";
import userEvent from "@testing-library/user-event";

describe("QueryBuilderDateSearch", () => {
  describe("QueryBuilderDateSearch Component", () => {
    it("Display field if match type is equals", async () => {
      // This test will just ensure the layout does not change unexpectedly.
      // Any changes to the layout, the snapshots will need to be updated.
      const dateSearchEquals = mountWithAppContext2(
        <DinaForm initialValues={{}}>
          <QueryBuilderContextProvider
            value={{ performSubmit: noop, groups: [] }}
          >
            <QueryBuilderDateSearch
              matchType="equals"
              value="test"
              setValue={jest.fn}
            />
          </QueryBuilderContextProvider>
        </DinaForm>
      );

      // Expect a snapshot with the date field being displayed.
      expect(dateSearchEquals.asFragment()).toMatchSnapshot(
        "Expect date field to be displayed since match type is equals"
      );

      const dateSearchEmpty = mountWithAppContext2(
        <DinaForm initialValues={{}}>
          <QueryBuilderContextProvider
            value={{ performSubmit: noop, groups: [] }}
          >
            <QueryBuilderDateSearch
              matchType="empty"
              value="test"
              setValue={jest.fn}
            />
          </QueryBuilderContextProvider>
        </DinaForm>
      );

      // Expect a snapshot without the date field being displayed.
      expect(dateSearchEmpty.asFragment()).toMatchSnapshot(
        "Expect date field not to be displayed since the match type is not equals"
      );
    });

    it("Should call performSubmit on enter key press in textfield", async () => {
      const mockPerformSubmit = jest.fn();
      const { getByRole } = mountWithAppContext2(
        <DinaForm initialValues={{}}>
          <QueryBuilderContextProvider
            value={{ performSubmit: mockPerformSubmit, groups: [] }}
          >
            <QueryBuilderDateSearch
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
      },
      {
        operator: "in",
        testValues: ["1998-05-19, 2002-12-30"]
      },
      {
        operator: "notIn",
        testValues: ["1998-05-19, 2002-12-30"]
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
    // Mock formatMessage function (replace with your actual implementation)
    const formatMessage = jest.fn();

    beforeEach(() => {
      formatMessage.mockReturnValue("Mocked error message");
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should return true for valid "equals" operator with empty value', () => {
      const result = validateDate("myDate", "", "equals", formatMessage);
      expect(result).toBe(true);
      expect(formatMessage).not.toHaveBeenCalled(); // No error message formatting should occur
    });

    it('should return true for valid "equals" operator with formatted date', () => {
      const result = validateDate(
        "myDate",
        "2024-03-21",
        "equals",
        formatMessage
      );
      expect(result).toBe(true);
      expect(formatMessage).not.toHaveBeenCalled(); // No error message formatting should occur
    });

    it('should return validation error for invalid date format in "equals" operator', () => {
      const result = validateDate(
        "myDate",
        "invalid date",
        "equals",
        formatMessage
      );
      expect(result).toEqual({
        errorMessage: "Mocked error message",
        fieldName: "myDate"
      });
      expect(formatMessage).toHaveBeenCalledWith({
        id: "dateMustBeFormattedYyyyMmDd"
      }); // Specific error message called
    });

    it('should return true for valid "containsDate" operator with partial date format', () => {
      const result = validateDate(
        "myDate",
        "2024-03",
        "containsDate",
        formatMessage
      );
      expect(result).toBe(true);
      expect(formatMessage).not.toHaveBeenCalled(); // No error message formatting should occur
    });

    it('should return validation error for invalid date format in "containsDate" operator', () => {
      const result = validateDate(
        "myDate",
        "invalid_date",
        "containsDate",
        formatMessage
      );
      expect(result).toEqual({
        errorMessage: "Mocked error message",
        fieldName: "myDate"
      });
      expect(formatMessage).toHaveBeenCalledWith({
        id: "dateMustBeFormattedPartial"
      }); // Specific error message called
    });

    it('should return validation error for "between" operator with invalid low date', () => {
      const result = validateDate(
        "myDate",
        '{"low": "2023-05","high": "2022-01-19"}',
        "between",
        formatMessage
      );
      expect(result).toEqual({
        errorMessage: "Mocked error message",
        fieldName: "myDate"
      });
      expect(formatMessage).toHaveBeenCalledWith({
        id: "dateMustBeFormattedYyyyMmDd"
      }); // Specific error message called
    });

    it('should return validation error for "between" operator with invalid high date', () => {
      const result = validateDate(
        "myDate",
        '{"low": "2023-05-19","high": "2022-01"}',
        "between",
        formatMessage
      );
      expect(result).toEqual({
        errorMessage: "Mocked error message",
        fieldName: "myDate"
      });
      expect(formatMessage).toHaveBeenCalledWith({
        id: "dateMustBeFormattedYyyyMmDd"
      }); // Specific error message called
    });

    it('should return validation error for "between" operator with high date less than low date', () => {
      const result = validateDate(
        "myDate",
        '{"low": "2023-05-19","high": "2022-01-19"}',
        "between",
        formatMessage
      );
      expect(result).toEqual({
        errorMessage: "Mocked error message",
        fieldName: "myDate"
      });
      expect(formatMessage).toHaveBeenCalledWith({ id: "dateBetweenInvalid" }); // Specific error message called
    });

    it('should return validation error for "between" operator with only one value provided.', () => {
      const result = validateDate(
        "myDate",
        '{"low": "2023-05-19","high": ""}',
        "between",
        formatMessage
      );
      expect(result).toEqual({
        errorMessage: "Mocked error message",
        fieldName: "myDate"
      });
      expect(formatMessage).toHaveBeenCalledWith({
        id: "dateBetweenMissingValues"
      }); // Specific error message called
    });

    it('should return true for valid "between" operator values', () => {
      const result = validateDate(
        "myDate",
        '{"low": "2022-05-19","high": "2023-01-19"}',
        "between",
        formatMessage
      );
      expect(result).toBe(true);
      expect(formatMessage).not.toHaveBeenCalled(); // No error message formatting should occur
    });

    it('should return true for valid "between" operator with empty value', () => {
      const result = validateDate(
        "myDate",
        '{"low": "","high": ""}',
        "between",
        formatMessage
      );
      expect(result).toBe(true);
      expect(formatMessage).not.toHaveBeenCalled(); // No error message formatting should occur
    });

    it('should return validation error for "in" operator with non-dates', () => {
      const result = validateDate(
        "myDate",
        "2021-05-19, apple, 2008-01-01",
        "in",
        formatMessage
      );
      expect(result).toEqual({
        errorMessage: "Mocked error message",
        fieldName: "myDate"
      });
      expect(formatMessage).toHaveBeenCalledWith({ id: "dateInRangeInvalid" }); // Specific error message called
    });

    it('should return validation error for "in" operator with single non-dates', () => {
      const result = validateDate("myDate", "apple", "in", formatMessage);
      expect(result).toEqual({
        errorMessage: "Mocked error message",
        fieldName: "myDate"
      });
      expect(formatMessage).toHaveBeenCalledWith({ id: "dateInRangeInvalid" }); // Specific error message called
    });

    it('should return true for valid "in" operator values', () => {
      const result = validateDate(
        "myDate",
        "2021-05-19, 2010-03-09, 2008-01-01,",
        "in",
        formatMessage
      );
      expect(result).toBe(true);
      expect(formatMessage).not.toHaveBeenCalled(); // No error message formatting should occur
    });

    it('should return validation error for "notIn" operator with non-dates', () => {
      const result = validateDate(
        "myDate",
        "2021-05-19, apple, 2008-01-01",
        "notIn",
        formatMessage
      );
      expect(result).toEqual({
        errorMessage: "Mocked error message",
        fieldName: "myDate"
      });
      expect(formatMessage).toHaveBeenCalledWith({ id: "dateInRangeInvalid" }); // Specific error message called
    });

    it('should return validation error for "notIn" operator with single non-dates', () => {
      const result = validateDate("myDate", "apple", "notIn", formatMessage);
      expect(result).toEqual({
        errorMessage: "Mocked error message",
        fieldName: "myDate"
      });
      expect(formatMessage).toHaveBeenCalledWith({ id: "dateInRangeInvalid" }); // Specific error message called
    });

    it('should return true for valid "notIn" operator values', () => {
      const result = validateDate(
        "myDate",
        "2021-05-19, 2010-03-09, 2008-01-01, ",
        "notIn",
        formatMessage
      );
      expect(result).toBe(true);
      expect(formatMessage).not.toHaveBeenCalled(); // No error message formatting should occur
    });
  });
});
