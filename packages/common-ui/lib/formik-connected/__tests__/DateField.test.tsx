import { Form, Formik } from "formik";
import { noop } from "lodash";
import {
  default as DatePicker,
  default as ReactDatePicker
} from "react-datepicker";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { DateField } from "../DateField";

describe("DateField component", () => {
  function getWrapper(testDate: string | null = "2019-02-02") {
    return mountWithAppContext(
      <Formik
        initialValues={{
          testField: testDate
        }}
        onSubmit={noop}
      >
        <Form translate={undefined}>
          <DateField name="testField" />
        </Form>
      </Formik>
    );
  }

  it("Displays the Formik field's value.", () => {
    const wrapper = getWrapper();

    expect(wrapper.find(".testField-field input").prop("value")).toEqual(
      "2019-02-02"
    );
  });

  it("Display a null date field as a blank input.", () => {
    const wrapper = getWrapper(null);

    expect(wrapper.find(".testField-field input").prop("value")).toEqual("");
  });

  it("Changes the Formik field's value.", () => {
    const wrapper = getWrapper();
    const { onChange } = wrapper.find(ReactDatePicker).props();

    onChange(new Date("2019-05-25T12:00:00Z"), undefined);
    wrapper.update();

    expect(wrapper.find(DatePicker).prop("selected")).toEqual(
      new Date("2019-05-25T12:00:00.000Z")
    );
  });

  it("Can set the date field to null.", () => {
    const wrapper = getWrapper();
    const { onChange } = wrapper.find(ReactDatePicker).props();

    onChange(null, undefined);
    wrapper.update();

    expect(wrapper.find(DatePicker).prop("selected")).toEqual(null);
  });
});
