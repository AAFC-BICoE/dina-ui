import { Formik } from "formik";
import { noop } from "lodash";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { DinaForm } from "../DinaForm";
import { ErrorViewer } from "../ErrorViewer";
import { SubmitButton } from "../SubmitButton";

describe("ErrorViewer component", () => {
  it("Renders nothing when formik has no status.", () => {
    const wrapper = mountWithAppContext(
      <Formik initialValues={{}} onSubmit={noop}>
        <ErrorViewer />
      </Formik>
    );

    expect(wrapper.find(ErrorViewer).html()).toEqual(
      '<div style="scroll-margin: 20px;"></div>'
    );
  });

  it("Renders the formik status as an error message.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{}}
        onSubmit={({ formik }) => formik.setStatus("Test error")}
      >
        <SubmitButton />
      </DinaForm>
    );

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(".alert.alert-danger").text()).toEqual("Test error");
  });

  it("Renders field-level errors.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{}}
        initialErrors={{
          topLevelField: "Error",
          nestedObject: { nestedField: "Nested Error" }
        }}
      >
        <SubmitButton />
      </DinaForm>
    );

    // wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(".alert.alert-danger").text()).toEqual(
      ["Nested Field: Nested Error", "Top Level Field: Error"].join("\n")
    );
  });
});
