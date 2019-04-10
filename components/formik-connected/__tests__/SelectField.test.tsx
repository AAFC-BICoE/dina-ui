import { mount } from "enzyme";
import { Form, Formik } from "formik";
import Select from "react-select";
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

describe("SelectField component", () => {
  it("Displays the Formik field's value.", () => {
    const wrapper = mount(
      <Formik
        initialValues={{
          testField: "ITRU_PRIMER"
        }}
        onSubmit={null}
      >
        <Form>
          <SelectField name="testField" options={PRIMER_TYPE_OPTIONS} />
        </Form>
      </Formik>
    );

    const { value } = wrapper.find(Select).props();

    // The selected option object should be passed into the Select component.
    expect(value).toEqual({
      label: "iTru Primer",
      value: "ITRU_PRIMER"
    });
  });

  it("Changes the Formik field's value.", () => {
    const wrapper = mount(
      <Formik
        initialValues={{
          testField: "ITRU_PRIMER"
        }}
        onSubmit={null}
      >
        {({ values: { testField } }) => (
          <Form>
            <SelectField name="testField" options={PRIMER_TYPE_OPTIONS} />
            <div id="value-display">{testField}</div>
          </Form>
        )}
      </Formik>
    );

    const { onChange } = wrapper.find(Select).props();

    // Simulate changing the selected option.
    onChange({
      label: "Fusion Primer",
      value: "FUSION_PRIMER"
    });

    // The new value should be re-rendered into the value-display div.
    expect(wrapper.find("#value-display").text()).toEqual("FUSION_PRIMER");
  });
});
