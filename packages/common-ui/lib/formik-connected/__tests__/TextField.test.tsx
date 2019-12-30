import { Form, Formik } from "formik";
import { noop } from "lodash";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { TextField } from "../TextField";

describe("TextField component", () => {
  it("Displays the field's label and value.", () => {
    const wrapper = mountWithAppContext(
      <Formik
        initialValues={{ testObject: { testField: "initial value" } }}
        onSubmit={noop}
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
    const wrapper = mountWithAppContext(
      <Formik
        initialValues={{ testObject: { testField: "initial value" } }}
        onSubmit={noop}
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
