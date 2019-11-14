import { mount } from "enzyme";
import { Formik } from "formik";
import { noop } from "lodash";
import { ErrorViewer } from "../ErrorViewer";

describe("ErrorViewer component", () => {
  it("Renders nothing when formik has no status.", () => {
    const wrapper = mount(
      <Formik initialValues={{}} onSubmit={noop}>
        <ErrorViewer />
      </Formik>
    );

    expect(wrapper.html()).toEqual("");
  });

  it("Renders the formik status as an error message.", () => {
    const wrapper = mount(
      <Formik initialValues={{}} onSubmit={noop}>
        {({ setStatus }) => {
          function setError() {
            setStatus("Test error");
          }

          return (
            <div>
              <button onClick={setError} />
              <ErrorViewer />
            </div>
          );
        }}
      </Formik>
    );

    wrapper.find("button").simulate("click");

    expect(wrapper.find(".alert.alert-danger").text()).toEqual("Test error");
  });
});
