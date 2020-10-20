import { Formik } from "formik";
import { noop } from "lodash";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { FieldView } from "../FieldView";

describe("FieldView component", () => {
  it("Renders the label and field value. ( minimal use case )", () => {
    const wrapper = mountWithAppContext(
      <Formik
        initialValues={{ testObject: { name: "testName" } }}
        onSubmit={noop}
      >
        <FieldView name="testObject.name" />
      </Formik>
    );

    expect(wrapper.find("label").text()).toEqual("Test Object Name");
    expect(wrapper.find("p").text()).toEqual("testName");
  });

  it("Renders with a custom label.", () => {
    const wrapper = mountWithAppContext(
      <Formik
        initialValues={{ testObject: { name: "testName" } }}
        onSubmit={noop}
      >
        <FieldView label="Custom Label" name="testObject.name" />
      </Formik>
    );

    expect(wrapper.find("label").text()).toEqual("Custom Label");
  });

  it("Allows an optional link prop.", () => {
    const wrapper = mountWithAppContext(
      <Formik
        initialValues={{ testObject: { name: "testName" } }}
        onSubmit={noop}
      >
        <FieldView link="/linked-page" name="testObject.name" />
      </Formik>
    );

    expect(wrapper.find("a").prop("href")).toEqual("/linked-page");
  });

  it("Renders field value as comma seperated string when it is string array object", () => {
    const wrapper = mountWithAppContext(
      <Formik
        initialValues={{
          testObject: { aliases: ["alias1", "alias2"] }
        }}
        onSubmit={noop}
      >
        <FieldView name="testObject.aliases" />
      </Formik>
    );

    expect(wrapper.find("p").text()).toEqual("alias1,alias2");
  });
});
