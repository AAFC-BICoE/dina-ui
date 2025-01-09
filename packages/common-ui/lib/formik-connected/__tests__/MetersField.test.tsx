import { mountWithAppContext } from "common-ui";
import { DinaForm } from "../DinaForm";
import { FormikButton } from "../FormikButton";
import { MetersField, toMeters } from "../MetersField";
import "@testing-library/jest-dom";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockSubmit = jest.fn();

describe("MetersField component", () => {
  beforeEach(jest.clearAllMocks);

  it("Converts other units to meters.", () => {
    expect(toMeters("1 Foot")).toEqual("0.3048");
    expect(toMeters("1 Feet")).toEqual("0.3048");
    expect(toMeters("1 ft")).toEqual("0.3048");
    expect(toMeters("1 FT")).toEqual("0.3048");
    expect(toMeters("1ft")).toEqual("0.3048");
    expect(toMeters("1ft.")).toEqual("0.3048");
    expect(toMeters("1'")).toEqual("0.3048");
    expect(toMeters("1 Inches")).toEqual("0.0254");
    expect(toMeters("1 in")).toEqual("0.0254");
    expect(toMeters("1 in.")).toEqual("0.0254");
    expect(toMeters("1in.")).toEqual("0.0254");
    expect(toMeters("4ft 3in")).toEqual("1.2954");
    expect(toMeters("4 ft 3 in")).toEqual("1.2954");
    expect(toMeters("4 ft. 3 in.")).toEqual("1.2954");
    expect(toMeters(`4'3"`)).toEqual("1.2954");
    expect(toMeters("4' 3\"")).toEqual("1.2954");
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
    expect(toMeters("1 kilometer")).toEqual("1000");
    expect(toMeters("1 kilometre")).toEqual("1000");
    expect(toMeters("1 kilometres")).toEqual("1000");
    expect(toMeters("1 pd")).toEqual("0.3048");
    expect(toMeters("1 pied")).toEqual("0.3048");
    expect(toMeters("1 pieds")).toEqual("0.3048");
    expect(toMeters("1 po")).toEqual("0.0254");
    expect(toMeters("1 pouce")).toEqual("0.0254");
    expect(toMeters("1 pouces")).toEqual("0.0254");
    expect(toMeters("3pd 3po")).toEqual("0.9906");

    // Works with decimals:
    expect(toMeters(`0.1 feet 0.1 inches`)).toEqual("0.03302");
    expect(toMeters(`0.1' 0.1"`)).toEqual("0.03302");
    expect(toMeters(`.1 feet .1 inches`)).toEqual("0.03302");
    expect(toMeters(`.1' .1"`)).toEqual("0.03302");
    expect(toMeters(`.1'.1"`)).toEqual("0.03302");
    expect(toMeters(`0.1'0.1"`)).toEqual("0.03302");

    expect(toMeters('10"')).toEqual("0.254");

    // Accepts french units with the accent:
    expect(toMeters("1 kilomètre")).toEqual("1000");

    // Accepts a value without units as meters:
    expect(toMeters("1.1111")).toEqual("1.1111");

    // Matches a number in a string with other unknown text in it:
    expect(toMeters(": 36 kl")).toEqual("36");
    expect(toMeters(": 36.5 kl")).toEqual("36.5");
  });

  it("Can set maximum decimal places.", () => {
    expect(toMeters("1 meter", 2)).toEqual("1");
    // Trailing zeroes should be kept:
    expect(toMeters("4 feet 3 inches", 2)).toEqual("1.30");
    expect(toMeters("4 feet 4 inches", 2)).toEqual("1.32");
  });

  it("Returns number-only values as-is without changing the decimals.", () => {
    expect(toMeters("0", 2)).toEqual("0");
    expect(toMeters("12345", 2)).toEqual("12345");
    expect(toMeters("0.30", 2)).toEqual("0.30");
    expect(toMeters("0.300", 2)).toEqual("0.300");
    expect(toMeters("0.0", 2)).toEqual("0.0");
    expect(toMeters("0.0000", 2)).toEqual("0.0000");
  });

  it("Does the unit conversion onBlur.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <MetersField name="length" />
      </DinaForm>
    );

    const input = screen.getByRole("textbox", { name: /length/i });

    // Change input value to 5
    await userEvent.type(input, "5");
    fireEvent.blur(input); // Simulate onBlur
    expect(input).toHaveValue("5");

    // Ensure no error message appears
    expect(screen.queryByText(/invalid/i)).not.toBeInTheDocument();

    // Change input value to "1 ft"
    await userEvent.clear(input);
    await userEvent.type(input, "1 ft");
    fireEvent.blur(input); // Simulate onBlur
    expect(input).toHaveValue("0.30");

    // Ensure no error message appears
    expect(screen.queryByText(/invalid/i)).not.toBeInTheDocument();
  });

  it("Shows an error message on invalid input.", async () => {
    const mockOnSubmit = jest.fn();

    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{}}
        onSubmit={({ submittedValues }) => mockOnSubmit(submittedValues)}
      >
        <MetersField name="length" />
      </DinaForm>
    );

    // Input an invalid value that can't be converted to meters:
    const input = screen.getByRole("textbox", { name: /length/i });
    await userEvent.type(input, "bad value");
    fireEvent.blur(input);

    expect(input).toHaveValue("bad value");
    // Shows the error message:
    expect(await screen.findByText("Invalid meters value")).toBeInTheDocument();

    // Simulate form submission
    const form = wrapper.container.querySelector("form");
    fireEvent.submit(form!);

    // Wait for the mock function to be called
    await waitFor(() => expect(mockOnSubmit).toHaveBeenCalledTimes(0));

    // Change to a valid input:
    await userEvent.clear(input);
    await userEvent.type(input, "1ft");

    // No error message on valid input:
    expect(screen.queryByText("Invalid meters value")).not.toBeInTheDocument();

    // Simulate form submission
    fireEvent.submit(form!);

    // Wait for the form submission to complete
    await waitFor(() =>
      expect(mockOnSubmit).toHaveBeenCalledWith({ length: "0.30" })
    );
  });

  it("Does the unit conversion onSubmit.", async () => {
    const { container } = mountWithAppContext(
      <DinaForm
        initialValues={{}}
        onSubmit={({ submittedValues }) => mockSubmit(submittedValues)}
      >
        <MetersField name="length" />
      </DinaForm>
    );

    // Simulate user input
    const input = screen.getByRole("textbox", { name: /length/i });
    userEvent.type(input, "1 ft");

    // Simulate form submission
    const form = container.querySelector("form");
    fireEvent.submit(form!);

    // Wait for the form submission to be handled
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenLastCalledWith({
        length: "0.30"
      });
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
    const input = screen.getByRole("textbox", { name: /length/i });
    expect(input).toHaveValue("10.00");
  });

  it("Updates the input value when the form state changes.", () => {
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{ length: "10.00" }}
        onSubmit={({ submittedValues }) => mockSubmit(submittedValues)}
      >
        <MetersField name="length" />
        <FormikButton
          onClick={(_, form) => form.setFieldValue("length", "20.5") as any}
        >
          Change Val
        </FormikButton>
      </DinaForm>
    );

    // Initial value:
    const input = screen.getByRole("textbox", { name: /length/i });
    expect(input).toHaveValue("10.00");

    // Simulate button click to change form state
    const button = screen.getByRole("button", { name: /change val/i });
    userEvent.click(button);

    // The new value is rendered:
    expect(input).toHaveValue("20.5");
  });
});
