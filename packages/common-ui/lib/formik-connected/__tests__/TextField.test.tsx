import { mountWithAppContext } from "../../test-util/mock-app-context";
import { DinaForm } from "../DinaForm";
import { SubmitButton } from "../SubmitButton";
import { TextField } from "../TextField";
import { object, string } from "yup";

describe("TextField component", () => {
  it("Displays the field's label and value.", () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{ testObject: { testField: "initial value" } }}>
        <TextField name="testObject.testField" />
      </DinaForm>
    );

    expect(wrapper.find("label").text()).toEqual("Test Object Test Field");
    expect((wrapper.find("input").instance() as any).value).toEqual(
      "initial value"
    );
  });

  it("Changes the field's value.", () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{ testObject: { testField: "initial value" } }}>
        {({
          values: {
            testObject: { testField }
          }
        }) => (
          <>
            <TextField name="testObject.testField" />
            <div id="value-display">{testField}</div>
          </>
        )}
      </DinaForm>
    );

    wrapper.find("input").simulate("change", {
      target: { name: "testObject.testField", value: "new value" }
    });

    expect(wrapper.find("#value-display").text()).toEqual("new value");
  });

  it("Shows a field-level error message.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{ testField: "initial value" }}
        validationSchema={object({
          testField: string().test({
            message: "Test Error",
            test: () => false
          })
        })}
      >
        <TextField name="testField" />
        <SubmitButton />
      </DinaForm>
    );

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find("input").hasClass("is-invalid")).toEqual(true);
    expect(wrapper.find(".invalid-feedback").text()).toEqual("Test Error");
  });
});
