import { Form, Formik } from "formik";
import { noop } from "lodash";
import Select from "react-select";
import { mountWithAppContext } from "../../test-util/mock-app-context";
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
  }
];

function getWrapper(propsOverride = {}) {
  return mountWithAppContext(
    <Formik
      initialValues={{
        testField: "ITRU_PRIMER"
      }}
      onSubmit={noop}
    >
      {({ values: { testField } }) => (
        <Form translate={undefined}>
          <SelectField
            name="testField"
            options={PRIMER_TYPE_OPTIONS}
            {...propsOverride}
          />
          <div id="value-display">{testField}</div>
        </Form>
      )}
    </Formik>
  );
}

describe("SelectField component", () => {
  it("Displays the Formik field's value.", () => {
    const wrapper = getWrapper();

    const { value } = wrapper.find(Select).props();

    // The selected option object should be passed into the Select component.
    expect(value).toEqual({
      label: "iTru Primer",
      value: "ITRU_PRIMER"
    });
  });

  it("Changes the Formik field's value.", () => {
    const wrapper = getWrapper();

    const { onChange } = wrapper.find(Select).props();

    // Simulate changing the selected option.
    onChange(
      {
        label: "Fusion Primer",
        value: "FUSION_PRIMER"
      },
      null
    );

    // The new value should be re-rendered into the value-display div.
    expect(wrapper.find("#value-display").text()).toEqual("FUSION_PRIMER");
  });

  it("Provides an onChange callback.", () => {
    const mockOnChange = jest.fn();
    const wrapper = getWrapper({ onChange: mockOnChange });

    // Change the value.
    wrapper.find(Select).prop("onChange")({ value: "newTestValue" }, null);

    // The mock functino should have been called with the new value.
    expect(mockOnChange).lastCalledWith("newTestValue");
  });
});
