import { mountWithAppContext } from "common-ui/lib/test-util/mock-app-context";
import { useState } from "react";
import { FieldItems } from "react-awesome-query-builder";
import { QueryOperatorSelector } from "../QueryOperatorSelector";
import { DinaForm } from "common-ui/lib/formik-connected/DinaForm";

const OPERATOR_OPTIONS: FieldItems = [
  {
    key: "exactMatch",
    label: "Exact Match"
  },
  {
    key: "notEquals",
    label: "Not Equals"
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
    wrapper.find("DropdownIndicator").simulate("mouseDown", {
      button: 0
    });

    // Snapshot with all of the options and layout.
    expect(wrapper.find(QueryOperatorSelector).debug()).toMatchSnapshot();
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
    expect(
      wrapper.find(QueryOperatorSelector).prop("selectedOperator")
    ).toEqual(OPERATOR_OPTIONS[0].key);

    // Select a new option in the list.
    wrapper.find("DropdownIndicator").simulate("mouseDown", {
      button: 0
    });
    wrapper.find("Option").at(1).find("div").simulate("click");
    wrapper.update();
    expect(
      wrapper.find(QueryOperatorSelector).prop("selectedOperator")
    ).toEqual(OPERATOR_OPTIONS[1].key);

    // And, select another option in the list.
    wrapper.find("DropdownIndicator").simulate("mouseDown", {
      button: 0
    });
    wrapper.find("Option").at(2).find("div").simulate("click");
    wrapper.update();
    expect(
      wrapper.find(QueryOperatorSelector).prop("selectedOperator")
    ).toEqual(OPERATOR_OPTIONS[2].key);
  });
});
