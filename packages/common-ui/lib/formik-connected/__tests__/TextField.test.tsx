import { mountWithAppContext } from "../../test-util/mock-app-context";
import { DinaForm } from "../DinaForm";
import { TextField } from "../TextField";

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
});
