import { Formik } from "formik";
import { noop } from "lodash";
import { mountWithAppContext2 } from "../../test-util/mock-app-context";
import { DinaForm } from "../DinaForm";
import { ErrorViewer } from "../ErrorViewer";
import { SubmitButton } from "../SubmitButton";
import { fireEvent, screen } from "@testing-library/react";
import { IntlProvider } from "react-intl";

describe("ErrorViewer component", () => {
  it("Renders nothing when Formik has no status.", () => {
    // Render the component with React Testing Library
    const wrapper = mountWithAppContext2(
      <Formik initialValues={{}} onSubmit={noop}>
        <ErrorViewer />
      </Formik>
    );

    // Assert that the element exists and then check the innerHTML
    const errorViewer = wrapper.container.querySelector(".error-viewer");
    expect(errorViewer).not.toBeNull();
    expect(errorViewer!.innerHTML).toEqual("");
  });

  it("Renders the Formik status as an error message.", async () => {
    // Render the component using React Testing Library
    const wrapper = mountWithAppContext2(
      <DinaForm
        initialValues={{}}
        onSubmit={({ formik }) => formik.setStatus("Test error")}
      >
        <SubmitButton />
      </DinaForm>
    );

    // Submit the form.
    fireEvent.click(wrapper.getByRole("button"));
    await new Promise(setImmediate);
    screen.logTestingPlaygroundURL();
    expect(wrapper.getByText(/test error/i)).toBeInTheDocument();
  });

  it("Renders field-level errors.", async () => {
    const wrapper = mountWithAppContext2(
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
