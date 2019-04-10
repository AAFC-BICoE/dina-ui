import { mount } from "enzyme";
import { Form, Formik } from "formik";
import { TextField } from "../TextField";

describe("TextField component", () => {
  it("Displays the field's label and value.", () => {
    const wrapper = mount(
      <Formik
        initialValues={{ testObject: { testField: "initial value" } }}
        onSubmit={null}
      >
        <Form>
          <TextField name="testObject.testField" />
        </Form>
      </Formik>
    );

    expect(wrapper.find("label").text()).toEqual("Test Object Test Field");
    expect((wrapper.find("input").instance() as any).value).toEqual(
      "initial value"
    );
  });

  it("Changes the field's value.", () => {
    const wrapper = mount(
      <Formik
        initialValues={{ testObject: { testField: "initial value" } }}
        onSubmit={null}
      >
        {({
          values: {
            testObject: { testField }
          }
        }) => (
          <Form>
            <TextField name="testObject.testField" />
            <div id="value-display">{testField}</div>
          </Form>
        )}
      </Formik>
    );

    wrapper.find("input").simulate("change", {
      target: { name: "testObject.testField", value: "new value" }
    });

    expect(wrapper.find("#value-display").text()).toEqual("new value");
  });
});
