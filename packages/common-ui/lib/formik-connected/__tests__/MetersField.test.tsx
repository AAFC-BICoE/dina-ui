import { mountWithAppContext } from "../../test-util/mock-app-context";
import { DinaForm } from "../DinaForm";
import { FormikButton } from "../FormikButton";
import { MetersField, toMeters } from "../MetersField";

const mockSubmit = jest.fn();

describe("MetersField component", () => {
  beforeEach(jest.clearAllMocks);

  it("Converts other units to meters.", () => {
    expect(toMeters("1 Foot")).toEqual("0.3048");
    expect(toMeters("1 Feet")).toEqual("0.3048");
    expect(toMeters("1 ft")).toEqual("0.3048");
    expect(toMeters("1 FT")).toEqual("0.3048");
    expect(toMeters("1 Inches")).toEqual("0.0254");
    expect(toMeters("1 in")).toEqual("0.0254");
    expect(toMeters("4ft 3in")).toEqual("1.2954");
    expect(toMeters("4 ft 3 in")).toEqual("1.2954");
    expect(toMeters("4 feet 3 inches")).toEqual("1.2954");
    expect(toMeters("4 Feet 3 Inches")).toEqual("1.2954");
    expect(toMeters("4 Pied 3 Pouce")).toEqual("1.2954");
    expect(toMeters("4 Pieds 3 Pouces")).toEqual("1.2954");
    expect(toMeters("1 yd")).toEqual("0.9144");
    expect(toMeters("1 yds")).toEqual("0.9144");
    expect(toMeters("1 mm")).toEqual("0.001");
    expect(toMeters("1 millimeter")).toEqual("0.001");
    expect(toMeters("1 millimetre")).toEqual("0.001");
    expect(toMeters("1 cm")).toEqual("0.01");
    expect(toMeters("1 centimetre")).toEqual("0.01");
    expect(toMeters("1 centimetres")).toEqual("0.01");
    expect(toMeters("1 meter")).toEqual("1");
    expect(toMeters("1 metre")).toEqual("1");
    expect(toMeters("1 metres")).toEqual("1");
    expect(toMeters("1 pd")).toEqual("0.3048");
    expect(toMeters("1 pied")).toEqual("0.3048");
    expect(toMeters("1 pieds")).toEqual("0.3048");
    expect(toMeters("1 po")).toEqual("0.0254");
    expect(toMeters("1 pouce")).toEqual("0.0254");
    expect(toMeters("1 pouces")).toEqual("0.0254");
    expect(toMeters("3pd 3po")).toEqual("0.9906");

    // Accepts a value without units as meters:
    expect(toMeters("1.1111")).toEqual("1.1111");
  });

  it("Can set maximum decimal places.", () => {
    expect(toMeters("1 meter", 2)).toEqual("1");
    // Trailing zeroes should be kept:
    expect(toMeters("4 feet 3 inches", 2)).toEqual("1.30");
    expect(toMeters("4 feet 4 inches", 2)).toEqual("1.32");
  });

  it("Does the unit conversion onBlur.", () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <MetersField name="length" />
      </DinaForm>
    );

    wrapper
      .find(".length-field input")
      .simulate("change", { target: { value: "5" } });
    wrapper.find(".length-field input").simulate("blur");
    expect(wrapper.find(".length-field input").prop("value")).toEqual("5");

    wrapper
      .find(".length-field input")
      .simulate("change", { target: { value: "1 ft" } });
    wrapper.find(".length-field input").simulate("blur");
    expect(wrapper.find(".length-field input").prop("value")).toEqual("0.30");
  });

  it("Does the unit conversion onSubmit.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{}}
        onSubmit={({ submittedValues }) => mockSubmit(submittedValues)}
      >
        <MetersField name="length" />
      </DinaForm>
    );

    wrapper.find(".length-field input").simulate("focus");
    wrapper
      .find(".length-field input")
      .simulate("change", { target: { value: "1 ft" } });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);

    expect(mockSubmit).lastCalledWith({
      length: "0.30"
    });
  });

  it("Renders the initial value.", () => {
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{ length: "10.00" }}
        onSubmit={({ submittedValues }) => mockSubmit(submittedValues)}
      >
        <MetersField name="length" />
      </DinaForm>
    );

    expect(wrapper.find(".length-field input").prop("value")).toEqual("10.00");
  });

  it("Updates the input value when the form state changes.", () => {
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{ length: "10.00" }}
        onSubmit={({ submittedValues }) => mockSubmit(submittedValues)}
      >
        <MetersField name="length" />
        <FormikButton
          onClick={(_, form) => form.setFieldValue("length", "20.5")}
        >
          Change Val
        </FormikButton>
      </DinaForm>
    );

    // Initial value:
    expect(wrapper.find(".length-field input").prop("value")).toEqual("10.00");
    wrapper.find("button").simulate("click");
    // The new value is rendered:
    expect(wrapper.find(".length-field input").prop("value")).toEqual("20.5");
  });
});
