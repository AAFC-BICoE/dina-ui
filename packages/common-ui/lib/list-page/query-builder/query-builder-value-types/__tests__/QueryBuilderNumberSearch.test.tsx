import { mountWithAppContext2 } from "common-ui/lib/test-util/mock-app-context";
import QueryBuilderNumberSearch, {
  transformNumberSearchToDSL,
  validateNumber
} from "../QueryBuilderNumberSearch";
import { DinaForm } from "common-ui/lib/formik-connected/DinaForm";
import { QueryBuilderContextProvider } from "../../QueryBuilder";
import { noop } from "lodash";
import userEvent from "@testing-library/user-event";

describe("QueryBuilderNumberSearch", () => {
  describe("QueryBuilderNumberSearch Component", () => {
    it("Display field if match type is equals", async () => {
      // This test will just ensure the layout does not change unexpectedly.
      // Any changes to the layout, the snapshots will need to be updated.
      const numberSearchEquals = mountWithAppContext2(
        <DinaForm initialValues={{}}>
          <QueryBuilderContextProvider
            value={{ performSubmit: noop, groups: [] }}
          >
            <QueryBuilderNumberSearch
              matchType="equals"
              value="test"
              setValue={jest.fn}
            />
          </QueryBuilderContextProvider>
        </DinaForm>
      );

      // Expect a snapshot with the number field being displayed.
      expect(numberSearchEquals.asFragment()).toMatchSnapshot(
        "Expect number field to be displayed since match type is equals"
      );

      const numberSearchEmpty = mountWithAppContext2(
        <DinaForm initialValues={{}}>
          <QueryBuilderContextProvider
            value={{ performSubmit: noop, groups: [] }}
          >
            <QueryBuilderNumberSearch
              matchType="empty"
              value="test"
              setValue={jest.fn}
            />
          </QueryBuilderContextProvider>
        </DinaForm>
      );

      // Expect a snapshot without the number field being displayed.
      expect(numberSearchEmpty.asFragment()).toMatchSnapshot(
        "Expect number field not to be displayed since the match type is not equals"
      );
    });

    it("Display different placeholder for in/not in operators", async () => {
      // This test will just ensure the layout does not change unexpectedly.
      // Any changes to the layout, the snapshots will need to be updated.
      const numberSearchIn = mountWithAppContext2(
        <DinaForm initialValues={{}}>
          <QueryBuilderContextProvider
            value={{ performSubmit: noop, groups: [] }}
          >
            <QueryBuilderNumberSearch
              matchType="in"
              value="test"
              setValue={jest.fn}
            />
          </QueryBuilderContextProvider>
        </DinaForm>
      );

      // Expect a snapshot with specific placeholder.
      expect(numberSearchIn.asFragment()).toMatchSnapshot(
        "Placeholder expected to be different for in operator."
      );

      const numberSearchNotIn = mountWithAppContext2(
        <DinaForm initialValues={{}}>
          <QueryBuilderContextProvider
            value={{ performSubmit: noop, groups: [] }}
          >
            <QueryBuilderNumberSearch
              matchType="notIn"
              value="test"
              setValue={jest.fn}
            />
          </QueryBuilderContextProvider>
        </DinaForm>
      );

      // Expect a snapshot with specific placeholder.
      expect(numberSearchNotIn.asFragment()).toMatchSnapshot(
        "Placeholder expected to be different for not in operator."
      );
    });

    it("Should call performSubmit on enter key press in textfield", async () => {
      const mockPerformSubmit = jest.fn();
      const { getByRole } = mountWithAppContext2(
        <DinaForm initialValues={{}}>
          <QueryBuilderContextProvider
            value={{ performSubmit: mockPerformSubmit, groups: [] }}
          >
            <QueryBuilderNumberSearch
              matchType="equals"
              value="test"
              setValue={jest.fn}
            />
          </QueryBuilderContextProvider>
        </DinaForm>
      );

      // Find the text field element
      const textField = getByRole("spinbutton");

      // Expect performSubmit to not be called yet.
      expect(mockPerformSubmit).toHaveBeenCalledTimes(0);

      // Simulate user typing "enter" key
      userEvent.type(textField, "{enter}");

      // Expect performSubmit to be called once
      expect(mockPerformSubmit).toHaveBeenCalledTimes(1);
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

    describe("In operation", () => {
      test("Normal field", async () => {
        expect(
          transformNumberSearchToDSL({
            operation: "in",
            value: "1, 2, 3.5,6",
            fieldInfo: {} as any,
            fieldPath: "data.attributes.numberField",
            queryType: "in"
          })
        ).toMatchSnapshot();
      });
    });

    describe("Not in operation", () => {
      test("Normal field", async () => {
        expect(
          transformNumberSearchToDSL({
            operation: "notIn",
            value: "1, 2, 3.5,6",
            fieldInfo: {} as any,
            fieldPath: "data.attributes.numberField",
            queryType: "notIn"
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

    describe("validateNumber function", () => {
      // Mock formatMessage function (replace with your actual implementation)
      const formatMessage = jest.fn();

      beforeEach(() => {
        formatMessage.mockReturnValue("Mocked error message");
      });

      afterEach(() => {
        jest.clearAllMocks();
      });

      it('should return true for valid "equals" operator with empty value', () => {
        const result = validateNumber("myNumber", "", "equals", formatMessage);
        expect(result).toBe(true);
        expect(formatMessage).not.toHaveBeenCalled(); // No error message formatting should occur
      });

      it('should return true for valid "equals" operator with decimal number', () => {
        const result1 = validateNumber(
          "myNumber",
          "12.3",
          "equals",
          formatMessage
        );
        expect(result1).toBe(true);

        const result2 = validateNumber(
          "myNumber",
          "-3.7312",
          "equals",
          formatMessage
        );
        expect(result2).toBe(true);
        expect(formatMessage).not.toHaveBeenCalled(); // No error message formatting should occur
      });

      it('should return true for valid "equals" operator with integer number', () => {
        const result1 = validateNumber(
          "myNumber",
          "12",
          "equals",
          formatMessage
        );
        expect(result1).toBe(true);

        const result2 = validateNumber(
          "myNumber",
          "-3",
          "equals",
          formatMessage
        );
        expect(result2).toBe(true);
        expect(formatMessage).not.toHaveBeenCalled(); // No error message formatting should occur
      });

      it('should return validation error for invalid number format in "equals" operator', () => {
        const result = validateNumber(
          "myNumber",
          "ten",
          "equals",
          formatMessage
        );
        expect(result).toEqual({
          errorMessage: "Mocked error message",
          fieldName: "myNumber"
        });
        expect(formatMessage).toHaveBeenCalledWith({ id: "numberInvalid" }); // Specific error message called
      });

      it('should return validation error for "between" operator with invalid low number', () => {
        const result = validateNumber(
          "myNumber",
          '{"low": "10e","high": "20"}',
          "between",
          formatMessage
        );
        expect(result).toEqual({
          errorMessage: "Mocked error message",
          fieldName: "myNumber"
        });
        expect(formatMessage).toHaveBeenCalledWith({ id: "numberInvalid" }); // Specific error message called
      });

      it('should return validation error for "between" operator with invalid high number', () => {
        const result = validateNumber(
          "myNumber",
          '{"low": "10","high": "20e"}',
          "between",
          formatMessage
        );
        expect(result).toEqual({
          errorMessage: "Mocked error message",
          fieldName: "myNumber"
        });
        expect(formatMessage).toHaveBeenCalledWith({ id: "numberInvalid" }); // Specific error message called
      });

      it('should return validation error for "between" operator with high number less than low number', () => {
        const result = validateNumber(
          "myNumber",
          '{"low": "20","high": "5"}',
          "between",
          formatMessage
        );
        expect(result).toEqual({
          errorMessage: "Mocked error message",
          fieldName: "myNumber"
        });
        expect(formatMessage).toHaveBeenCalledWith({
          id: "numberBetweenInvalid"
        }); // Specific error message called
      });

      it('should return validation error for "between" operator when only one value is provided', () => {
        const result = validateNumber(
          "myNumber",
          '{"low": "","high": "5"}',
          "between",
          formatMessage
        );
        expect(result).toEqual({
          errorMessage: "Mocked error message",
          fieldName: "myNumber"
        });
        expect(formatMessage).toHaveBeenCalledWith({
          id: "numberBetweenMissingValues"
        }); // Specific error message called
      });

      it('should return true for valid "between" operator values', () => {
        const result = validateNumber(
          "myNumber",
          '{"low": "-3","high": "60.5"}',
          "between",
          formatMessage
        );
        expect(result).toBe(true);
        expect(formatMessage).not.toHaveBeenCalled(); // No error message formatting should occur
      });

      it('should return true for valid "between" operator with empty value', () => {
        const result = validateNumber(
          "myNumber",
          '{"low": "","high": ""}',
          "between",
          formatMessage
        );
        expect(result).toBe(true);
        expect(formatMessage).not.toHaveBeenCalled(); // No error message formatting should occur
      });

      it('should return validation error for "in" operator with non-numbers', () => {
        const result = validateNumber(
          "myNumber",
          "10, apple, -3",
          "in",
          formatMessage
        );
        expect(result).toEqual({
          errorMessage: "Mocked error message",
          fieldName: "myNumber"
        });
        expect(formatMessage).toHaveBeenCalledWith({
          id: "numberInRangeInvalid"
        }); // Specific error message called
      });

      it('should return validation error for "in" operator with single non-number', () => {
        const result = validateNumber("myNumber", "apple", "in", formatMessage);
        expect(result).toEqual({
          errorMessage: "Mocked error message",
          fieldName: "myNumber"
        });
        expect(formatMessage).toHaveBeenCalledWith({
          id: "numberInRangeInvalid"
        }); // Specific error message called
      });

      it('should return true for valid "in" operator values', () => {
        const result = validateNumber(
          "myNumber",
          "1, -5, 3.5, ",
          "in",
          formatMessage
        );
        expect(result).toBe(true);
        expect(formatMessage).not.toHaveBeenCalled(); // No error message formatting should occur
      });

      it('should return validation error for "in" operator with non-numbers', () => {
        const result = validateNumber(
          "myNumber",
          "10, apple, -3",
          "notIn",
          formatMessage
        );
        expect(result).toEqual({
          errorMessage: "Mocked error message",
          fieldName: "myNumber"
        });
        expect(formatMessage).toHaveBeenCalledWith({
          id: "numberInRangeInvalid"
        }); // Specific error message called
      });

      it('should return validation error for "in" operator with single non-number', () => {
        const result = validateNumber(
          "myNumber",
          "apple",
          "notIn",
          formatMessage
        );
        expect(result).toEqual({
          errorMessage: "Mocked error message",
          fieldName: "myNumber"
        });
        expect(formatMessage).toHaveBeenCalledWith({
          id: "numberInRangeInvalid"
        }); // Specific error message called
      });

      it('should return true for valid "in" operator values', () => {
        const result = validateNumber(
          "myNumber",
          "1, -5, 3.5, ",
          "notIn",
          formatMessage
        );
        expect(result).toBe(true);
        expect(formatMessage).not.toHaveBeenCalled(); // No error message formatting should occur
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
