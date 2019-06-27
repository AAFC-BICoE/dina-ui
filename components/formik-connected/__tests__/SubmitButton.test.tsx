import { mount } from "enzyme";
import { Form, Formik } from "formik";
import { SubmitButton } from "../SubmitButton";

describe("SubmitButton component", () => {
  it("Shows a submit button when the form is not submitting.", () => {
    const wrapper = mount(
      /* tslint:disable:no-empty */
      <Formik initialValues={{}} onSubmit={() => {}}>
        <Form>
          <SubmitButton />
        </Form>
      </Formik>
    );

    expect(wrapper.find(".spinner-border").exists()).toEqual(false);
    expect(wrapper.find("button").exists()).toEqual(true);
  });

  it("Shows a loading spinner when the form is submitting.", () => {
    const wrapper = mount(
      /* tslint:disable:no-empty */
      <Formik initialValues={{}} onSubmit={() => {}}>
        <Form>
          <SubmitButton />
        </Form>
      </Formik>
    );

    wrapper.find("form").simulate("submit");

    expect(wrapper.find(".spinner-border").exists()).toEqual(true);
    expect(wrapper.find("button").exists()).toEqual(false);
  });
});
