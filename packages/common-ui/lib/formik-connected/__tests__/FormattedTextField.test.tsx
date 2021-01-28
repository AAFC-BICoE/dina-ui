import { mountWithAppContext } from "../../test-util/mock-app-context";
import { DinaForm } from "../DinaForm";
import { FormattedTextField } from "../FormattedTextField";

describe("FormattedTextField component", () => {
  it("Displays the field's label and value.", () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{ testObject: { testField: "2020" } }}>
        <FormattedTextField name="testObject.testField" />
      </DinaForm>
    );

    expect(wrapper.find("label").text()).toEqual("Test Object Test Field");
    expect((wrapper.find("input").instance() as any).value).toEqual("2020");
  });

  it("Changes the field's value.", () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{ testObject: { testField: "2020" } }}>
        {({
          values: {
            testObject: { testField }
          }
        }) => (
          <>
            <FormattedTextField name="testObject.testField" />
            <div id="value-display">{testField}</div>
          </>
        )}
      </DinaForm>
    );

    wrapper.find("input").simulate("change", {
      target: { name: "testObject.testField", value: "201912" }
    });

    expect(wrapper.find("#value-display").text()).toEqual("2019-12");

    wrapper.find("input").simulate("change", {
      target: { name: "testObject.testField", value: "2019we" }
    });

    expect(wrapper.find("#value-display").text()).toEqual("2019");
  });
});
