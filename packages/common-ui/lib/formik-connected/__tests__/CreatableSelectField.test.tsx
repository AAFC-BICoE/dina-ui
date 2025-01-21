import { mountWithAppContext } from "common-ui";
import { DinaForm } from "../DinaForm";
import { CreatableSelectField } from "../CreatableSelectField";
import { fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

const PRIMER_TYPE_OPTIONS = [
  {
    label: "PCR Primer",
    value: "PRIMER"
  },
  {
    label: "454 Multiplex Identifier",
    value: "MID"
  },
  {
    label: "Fusion Primer",
    value: "FUSION_PRIMER"
  },
  {
    label: "Illumina Index",
    value: "ILLUMINA_INDEX"
  },
  {
    label: "iTru Primer",
    value: "ITRU_PRIMER"
  },
  {
    label: "nested group",
    options: [
      {
        label: "nested label",
        value: "nested value"
      }
    ]
  }
];

function getWrapper(propsOverride = {}) {
  return mountWithAppContext(
    <DinaForm
      initialValues={{
        testField: "ITRU_PRIMER"
      }}
    >
      {({ values: { testField } }) => (
        <>
          <CreatableSelectField
            name="testField"
            options={PRIMER_TYPE_OPTIONS}
            {...propsOverride}
          />
          <div id="value-display">{testField}</div>
        </>
      )}
    </DinaForm>
  );
}

describe("CreatableSelectField component", () => {
  it("Displays the Formik field's value.", async () => {
    const wrapper = getWrapper();

    // Selected value should be displayed.
    expect(wrapper.queryByText(/itru_primer/i)).toBeInTheDocument();
  });

  it("Changes the Formik field's value.", () => {
    const wrapper = getWrapper();

    // Change the value that is selected...
    fireEvent.change(
      wrapper.getByRole("combobox", { name: /test field itru primer/i }),
      { target: { value: "FUSION_PRIMER" } }
    );
    fireEvent.click(wrapper.getByRole("option", { name: /fusion primer/i }));

    // The new value should be re-rendered into the value-display div.
    expect(wrapper.queryByText(/fusion_primer/i)).toBeInTheDocument();
  });

  it("Provides an onChange callback.", () => {
    const mockOnChange = jest.fn();
    const wrapper = getWrapper({ onChange: mockOnChange });

    // Change the value that is selected...
    fireEvent.change(
      wrapper.getByRole("combobox", { name: /test field itru primer/i }),
      { target: { value: "FUSION_PRIMER" } }
    );
    fireEvent.click(wrapper.getByRole("option", { name: /fusion primer/i }));

    // The mock function should have been called with the new value.
    expect(mockOnChange).toHaveBeenLastCalledWith(
      "FUSION_PRIMER", // New selected value
      expect.anything(),
      "ITRU_PRIMER"
    );
  });

  it("Allows multi-select.", async () => {
    const mockOnChange = jest.fn();
    const wrapper = getWrapper({ onChange: mockOnChange, isMulti: true });

    // Click the combo box to display options.
    fireEvent.click(wrapper.getByRole("combobox"));
    fireEvent.keyPress(wrapper.getByRole("combobox"), { charCode: 40 });
    fireEvent.click(
      wrapper.getByRole("button", { name: /remove itru primer/i })
    );

    // The mock function should have been called with the new value.
    expect(mockOnChange).toHaveBeenLastCalledWith(
      ["PRIMER"],
      expect.anything(),
      "ITRU_PRIMER"
    );
  });

  it("Renders the read-only view.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{
          singleValue: "ITRU_PRIMER",
          multipleValues: ["PRIMER", "MID"]
        }}
        readOnly={true}
      >
        <CreatableSelectField
          name="singleValue"
          options={PRIMER_TYPE_OPTIONS}
        />
        <CreatableSelectField
          name="multipleValues"
          options={PRIMER_TYPE_OPTIONS}
        />
      </DinaForm>
    );
    expect(wrapper.getByText(/itru primer/i)).toBeInTheDocument();

    // Joins the names with commas:
    expect(
      wrapper.getByText(/pcr primer, 454 multiplex identifier/i)
    ).toBeInTheDocument();
  });
});
