import { mountWithAppContext } from "common-ui/lib/test-util/mock-app-context";
import QueryBuilderBooleanSearch, {
  transformBooleanSearchToDSL
} from "../QueryBuilderBooleanSearch";
import { DinaForm } from "common-ui/lib/formik-connected/DinaForm";
import { QueryBuilderContextProvider } from "../../QueryBuilder";
import { noop } from "lodash";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { waitFor } from "@testing-library/react";

describe("QueryBuilderBooleanSearch", () => {
  describe("QueryBuilderBooleanSearch Component", () => {
    it("Display field if match type is equals", async () => {
      // This test will just ensure the layout does not change unexpectedly.
      // Any changes to the layout, the snapshots will need to be updated.
      const { queryByRole } = mountWithAppContext(
        <DinaForm initialValues={{}}>
          <QueryBuilderContextProvider value={{ performSubmit: noop } as any}>
            <QueryBuilderBooleanSearch
              matchType="equals"
              value="test"
              setValue={jest.fn}
            />
          </QueryBuilderContextProvider>
        </DinaForm>
      );

      // Expect a snapshot with the text field being displayed.
      expect(queryByRole("combobox")).toBeInTheDocument();
    });

    it("Don't display field if match type is not equals", async () => {
      const { queryByRole } = mountWithAppContext(
        <DinaForm initialValues={{}}>
          <QueryBuilderContextProvider
            value={{ performSubmit: noop, groups: [] }}
          >
            <QueryBuilderBooleanSearch
              matchType="empty"
              value=""
              setValue={jest.fn}
            />
          </QueryBuilderContextProvider>
        </DinaForm>
      );

      // Expect a snapshot without the text field being displayed.
      expect(queryByRole("combobox")).not.toBeInTheDocument();
    });

    it("Should call performSubmit on enter key press in combobox", async () => {
      const mockPerformSubmit = jest.fn();
      const { getByRole } = mountWithAppContext(
        <DinaForm initialValues={{}}>
          <QueryBuilderContextProvider
            value={{ performSubmit: mockPerformSubmit, groups: [] }}
          >
            <QueryBuilderBooleanSearch
              matchType="equals"
              value="test"
              setValue={jest.fn}
            />
          </QueryBuilderContextProvider>
        </DinaForm>
      );

      // Find the combobox element
      const combobox = getByRole("combobox");

      // Expect performSubmit to not be called yet.
      expect(mockPerformSubmit).toHaveBeenCalledTimes(0);

      // Simulate user typing "enter" key
      userEvent.type(combobox, "{enter}");

      // Expect performSubmit to be called once
      await waitFor(() => expect(mockPerformSubmit).toHaveBeenCalledTimes(1));
    });
  });

  describe("transformBooleanSearchToDSL function", () => {
    describe("Empty operation", () => {
      test("With relationship as field", async () => {
        expect(
          transformBooleanSearchToDSL({
            operation: "empty",
            value: "",
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
          transformBooleanSearchToDSL({
            operation: "empty",
            value: "",
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
          transformBooleanSearchToDSL({
            operation: "notEmpty",
            value: "",
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
          transformBooleanSearchToDSL({
            operation: "notEmpty",
            value: "",
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
          transformBooleanSearchToDSL({
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
          transformBooleanSearchToDSL({
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
          transformBooleanSearchToDSL({
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
