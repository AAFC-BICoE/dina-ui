import { mount } from "enzyme";
import { Form, Formik } from "formik";
import { ErrorViewer } from "../ErrorViewer";
import { OnFormikSubmit, safeSubmit } from "../safeSubmit";

function getWrapper(customOnSubmit: OnFormikSubmit) {
  const onSubmit = safeSubmit(customOnSubmit);

  return mount(
    <Formik initialValues={{ testProperty: "testValue" }} onSubmit={onSubmit}>
      <Form>
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

  it("Sets the form's error message if the submit function throws an error.", async () => {
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
});
