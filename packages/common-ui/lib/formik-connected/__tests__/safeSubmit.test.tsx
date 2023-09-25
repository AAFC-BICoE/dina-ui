import { Form, Formik } from "formik";
import { DoOperationsError } from "../..";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { ErrorViewer } from "../ErrorViewer";
import { OnFormikSubmit, safeSubmit } from "../safeSubmit";

function getWrapper(customOnSubmit: OnFormikSubmit) {
  const onSubmit = safeSubmit(customOnSubmit);

  return mountWithAppContext(
    <Formik initialValues={{ testProperty: "testValue" }} onSubmit={onSubmit}>
      <Form translate={undefined}>
        <ErrorViewer />
      </Form>
    </Formik>
  );
}

describe("safeSubmit function", () => {
  it("Calls the provided submit function.", async () => {
    const onSubmit = jest.fn();

    const wrapper = getWrapper(onSubmit);

    wrapper.find("form").simulate("submit");
    await new Promise(setImmediate);

    // The submnit function is called with the form values and the FormikActions object.
    expect(onSubmit).lastCalledWith(
      { testProperty: "testValue" },
      expect.objectContaining({ setStatus: expect.anything() })
    );
  });

  it("Sets the form error message if the submit function throws an error.", async () => {
    const wrapper = getWrapper(() => {
      throw new Error("Test error message");
    });

    wrapper.find("form").simulate("submit");
    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(".alert.alert-danger").text()).toEqual(
      "Test error message"
    );
  });

  it("Sets the form error message and the field errors..", async () => {
    const wrapper = getWrapper(() => {
      throw new DoOperationsError("Test error message", {
        fieldA: "must be a number",
        fieldB: "must be set"
      });
    });

    wrapper.find("form").simulate("submit");
    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(".error-message").map((node) => node.text())).toEqual([
      "Test error message",
      "1 : Field A - must be a number",
      "2 : Field B - must be set"
    ]);
  });

  it("Sets no error message when none are thrown by the form submission.", async () => {
    const wrapper = getWrapper(() => {
      throw new DoOperationsError("", {});
    });

    wrapper.find("form").simulate("submit");
    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(".error-message").map((node) => node.text())).toEqual(
      []
    );
  });
});
