import ReactDatePicker from "react-datepicker";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { DateField } from "../DateField";
import { DinaForm } from "../DinaForm";

describe("DateField component", () => {
  function getWrapper(testDate: string | null = "2019-02-02") {
    return mountWithAppContext(
      <DinaForm
        initialValues={{
          testField: testDate
        }}
      >
        <DateField name="testField" />
      </DinaForm>
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
    wrapper
      .find("input")
      .simulate("change", { target: { value: "2019-05-25" } });

    expect(wrapper.find("input").prop("value")).toEqual("2019-05-25");
  });

  it("Can set the date field to null.", () => {
    const wrapper = getWrapper();
    wrapper.find("input").simulate("change", { target: { value: "" } });

    expect(wrapper.find(ReactDatePicker).prop("selected")).toEqual(null);
  });

  it("Shows an error on non-existing dates.", () => {
    const wrapper = getWrapper();
    wrapper
      .find("input")
      .simulate("change", { target: { value: "2021-02-29" } });
    wrapper.find("input").simulate("blur");

    expect(wrapper.find(".invalid-feedback").text()).toEqual(
      "Invalid Date: 2021-02-29"
    );
  });

  it("Shows an error on invalid date formats.", () => {
    const wrapper = getWrapper();
    wrapper.find("input").simulate("change", { target: { value: "2021" } });
    wrapper.find("input").simulate("blur");

    expect(wrapper.find(".invalid-feedback").text()).toEqual(
      "Date must be formatted as YYYY-MM-DD"
    );
  });
});
