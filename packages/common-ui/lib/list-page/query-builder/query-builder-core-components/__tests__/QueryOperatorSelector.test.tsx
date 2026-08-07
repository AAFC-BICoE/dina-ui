import { mountWithAppContext } from "common-ui/lib/test-util/mock-app-context";
import { useState } from "react";
import { FieldItem } from "@react-awesome-query-builder/ui";
import { QueryOperatorSelector } from "../QueryOperatorSelector";
import { DinaForm } from "common-ui/lib/formik-connected/DinaForm";
import { fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

const OPERATOR_OPTIONS: FieldItem[] = [
  {
    key: "contains",
    label: "Contains"
  },
  {
    key: "in",
    label: "In"
  },
  {
    key: "notIn",
    label: "Not In"
  },
  {
    key: "empty",
    label: "Empty"
  },
  {
    key: "notEmpty",
    label: "Not Empty"
  }
];

describe("QueryOperatorSelector component", () => {
  test("Snapshot Test", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <QueryOperatorSelector
          options={OPERATOR_OPTIONS}
          selectedOperator={OPERATOR_OPTIONS[0].key}
          setOperator={undefined}
        />
      </DinaForm>
    );

    // Simulate opening up the menu.
    fireEvent.click(wrapper.getByText(/contains/i));
    fireEvent.keyDown(wrapper.getByRole("combobox"), { key: "ArrowDown" });

    // 5 options should be rendered.
    await waitFor(() => {
      const options = wrapper.getAllByRole("option");
      expect(options.length).toEqual(5);
      options.forEach((option, index) => {
        expect(option.textContent).toEqual(OPERATOR_OPTIONS[index].label);
      });
    });
  });

  test("Toggle between the options", async () => {
    function TestSelector() {
      const [operator, setOperator] = useState<string>(OPERATOR_OPTIONS[0].key);

      return (
        <DinaForm initialValues={{}}>
          <QueryOperatorSelector
            options={OPERATOR_OPTIONS}
            selectedOperator={operator}
            setOperator={(newOperator) => setOperator(newOperator)}
          />
        </DinaForm>
      );
    }

    const wrapper = mountWithAppContext(
      <>
        <TestSelector />
      </>
    );

    // Expect the initial state.
    expect(wrapper.getByText(OPERATOR_OPTIONS[0].label)).toBeInTheDocument();

    // Select a new option in the list.
    fireEvent.click(wrapper.getByText(/contains/i));
    fireEvent.keyDown(wrapper.getByRole("combobox"), { key: "ArrowDown" });
    await waitFor(() => {
      expect(
        wrapper.getByRole("option", { name: /not in/i })
      ).toBeInTheDocument();
    });
    fireEvent.click(wrapper.getByRole("option", { name: /not in/i }));

    // Expect it to be changed to Not In.
    await waitFor(() => {
      expect(wrapper.getByText(OPERATOR_OPTIONS[2].label)).toBeInTheDocument();
    });
  });
});
