import { mountWithAppContext } from "../../test-util/mock-app-context";
import { DinaForm } from "../DinaForm";
import { FieldView } from "../FieldView";

describe("FieldView component", () => {
  it("Renders the label and field value. ( minimal use case )", () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{ testObject: { name: "testName" } }}>
        <FieldView name="testObject.name" />
      </DinaForm>
    );

    expect(wrapper.find("label strong").text()).toEqual("Test Object Name");
    expect(wrapper.find("p").text()).toEqual("testName");
  });

  it("Renders with a custom label.", () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{ testObject: { name: "testName" } }}>
        <FieldView label="Custom Label" name="testObject.name" />
      </DinaForm>
    );

    expect(wrapper.find("label strong").text()).toEqual("Custom Label");
  });

  it("Allows an optional link prop.", () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{ testObject: { name: "testName" } }}>
        <FieldView link="/linked-page" name="testObject.name" />
      </DinaForm>
    );

    expect(wrapper.find("a").prop("href")).toEqual("/linked-page");
  });

  it("Renders field value as comma seperated string when it is string array object", () => {
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{
          testObject: { aliases: ["alias1", "alias2"] }
        }}
      >
        <FieldView name="testObject.aliases" />
      </DinaForm>
    );

    expect(wrapper.find("p").text()).toEqual("alias1,alias2");
  });
});
