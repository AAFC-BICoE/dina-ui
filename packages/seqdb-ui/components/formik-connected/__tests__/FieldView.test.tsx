import { mount } from "enzyme";
import { Formik } from "formik";
import { FieldView } from "../FieldView";

describe("FieldView component", () => {
  it("Renders the label and field value. ( minimal use case )", () => {
    const wrapper = mount(
      <Formik
        initialValues={{ testObject: { name: "testName" } }}
        onSubmit={null}
      >
        <FieldView name="testObject.name" />
      </Formik>
    );

    expect(wrapper.find("label").text()).toEqual("Test Object Name");
    expect(wrapper.find("p").text()).toEqual("testName");
  });

  it("Renders with a custom label.", () => {
    const wrapper = mount(
      <Formik
        initialValues={{ testObject: { name: "testName" } }}
        onSubmit={null}
      >
        <FieldView label="Custom Label" name="testObject.name" />
      </Formik>
    );

    expect(wrapper.find("label").text()).toEqual("Custom Label");
  });
});
