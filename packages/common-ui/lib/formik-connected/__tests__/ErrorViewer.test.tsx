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
      `<div class="error-viewer"></div>`
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
          nestedObject: { nestedField: "Nested Error" },
          nestedArrayObject: [
            { nestedArrayElementField: "Nested Array Element Error" }
          ]
        }}
      >
        <SubmitButton />
      </DinaForm>
    );

    await new Promise(setImmediate);
    wrapper.update();

    expect(
      wrapper
        .find(".alert.alert-danger .error-message")
        .map((node) => node.text())
    ).toEqual([
      "1 : Top Level Field - Error",
      "2 : Nested Object Nested Field - Nested Error",
      // The first array element should be shown as "1" instead of "0":
      "3 : Nested Array Object 1 Nested Array Element Field - Nested Array Element Error"
    ]);
  });
});
