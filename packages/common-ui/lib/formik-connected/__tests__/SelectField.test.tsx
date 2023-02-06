import Select from "react-select";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { DinaForm } from "../DinaForm";
import { SelectField } from "../SelectField";

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
          <SelectField
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

describe("SelectField component", () => {
  it("Displays the Formik field's value.", () => {
    const wrapper = getWrapper();

    const { value } = wrapper.find<any>(Select).props();

    // The selected option object should be passed into the Select component.
    expect(value).toEqual({
      label: "iTru Primer",
      value: "ITRU_PRIMER"
    });
  });

  it("Changes the Formik field's value.", () => {
    const wrapper = getWrapper();

    const { onChange } = wrapper.find<any>(Select).props();

    // Simulate changing the selected option.
    onChange({
      label: "Fusion Primer",
      value: "FUSION_PRIMER"
    });

    // The new value should be re-rendered into the value-display div.
    expect(wrapper.find("#value-display").text()).toEqual("FUSION_PRIMER");
  });

  it("Provides an onChange callback.", () => {
    const mockOnChange = jest.fn();
    const wrapper = getWrapper({ onChange: mockOnChange });

    // Change the value.
    wrapper.find(Select).prop<any>("onChange")({ value: "newTestValue" });

    // The mock function should have been called with the new value.
    expect(mockOnChange).lastCalledWith(
      "newTestValue",
      expect.anything(),
      "ITRU_PRIMER"
    );
  });

  it("Allows multi-select.", async () => {
    const mockOnChange = jest.fn();
    const wrapper = getWrapper({ onChange: mockOnChange });

    // Change the value to the first two options:
    wrapper.find(Select).prop<any>("onChange")([
      PRIMER_TYPE_OPTIONS[0],
      PRIMER_TYPE_OPTIONS[1]
    ]);

    // The mock function should have been called with the new value.
    expect(mockOnChange).lastCalledWith(
      ["PRIMER", "MID"],
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
        <SelectField name="singleValue" options={PRIMER_TYPE_OPTIONS} />
        <SelectField name="multipleValues" options={PRIMER_TYPE_OPTIONS} />
      </DinaForm>
    );

    expect(wrapper.find(".singleValue-field .read-only-view").text()).toEqual(
      "iTru Primer"
    );

    // Joins the names with commas:
    expect(
      wrapper.find(".multipleValues-field .read-only-view").text()
    ).toEqual("PCR Primer, 454 Multiplex Identifier");
  });
});
