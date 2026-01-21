import { DinaForm } from "common-ui";
import { mountWithAppContext } from "common-ui";
import { ParseVerbatimToRangeButton } from "../ParseVerbatimToRangeButton";
import { waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

const mockSubmit = jest.fn();

describe("ParseVerbatimToRangeButton component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Sets the range from two detected values when there is no current min value.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{ verbatim: "1m to 20m " }}
        onSubmit={({ submittedValues }) => mockSubmit(submittedValues)}
      >
        <ParseVerbatimToRangeButton
          buttonText="buttonText"
          rangeFields={["min", "max"]}
          verbatimField="verbatim"
        />
      </DinaForm>
    );

    // Simulate button click
    const button = wrapper.getByRole("button");
    fireEvent.click(button);

    // Submit the form using querySelector
    const form = wrapper.container.querySelector("form");
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockSubmit).lastCalledWith({
        verbatim: "1m to 20m ",
        min: "1",
        max: "20"
      });
    });
  });

  it("Sets the range from two detected values and converts the min/max properly", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{ verbatim: "10km -5km" }}
        onSubmit={({ submittedValues }) => mockSubmit(submittedValues)}
      >
        <ParseVerbatimToRangeButton
          buttonText="buttonText"
          rangeFields={["min", "max"]}
          verbatimField="verbatim"
        />
      </DinaForm>
    );

    const button = wrapper.getByRole("button");
    fireEvent.click(button);

    // Submit the form using querySelector
    const form = wrapper.container.querySelector("form");
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockSubmit).lastCalledWith({
        verbatim: "10km -5km",
        min: "10000",
        max: "5000"
      });
    });
  });

  it("Only sets the min when there is one detected value.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{ verbatim: " 1m " }}
        onSubmit={({ submittedValues }) => mockSubmit(submittedValues)}
      >
        <ParseVerbatimToRangeButton
          buttonText="buttonText"
          rangeFields={["min", "max"]}
          verbatimField="verbatim"
        />
      </DinaForm>
    );

    // Simulate button click
    const button = wrapper.getByRole("button");
    fireEvent.click(button);

    // Submit the form using querySelector
    const form = wrapper.container.querySelector("form");
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockSubmit).lastCalledWith({
        verbatim: " 1m ",
        min: "1",
        max: null
      });
    });
  });

  it("Displays an error when the value cannot be parsed.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{ verbatim: " invalid text " }}
        onSubmit={({ submittedValues }) => mockSubmit(submittedValues)}
      >
        <ParseVerbatimToRangeButton
          buttonText="buttonText"
          rangeFields={["min", "max"]}
          verbatimField="verbatim"
        />
      </DinaForm>
    );

    const button = wrapper.getByRole("button", { name: /buttonText/i });
    fireEvent.click(button);

    // Expect error feedback message in the UI
    await waitFor(() => {
      expect(wrapper.getByText(/could not parse value/i)).toBeInTheDocument();
    });

    // Submit the form to ensure no invalid values were set
    const form = wrapper.container.querySelector("form");
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockSubmit).lastCalledWith({
        verbatim: " invalid text "
        // min and max should not be present or set
      });
    });
  });

  it("Displays an error when the input is empty.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{ verbatim: "" }}
        onSubmit={({ submittedValues }) => mockSubmit(submittedValues)}
      >
        <ParseVerbatimToRangeButton
          buttonText="buttonText"
          rangeFields={["min", "max"]}
          verbatimField="verbatim"
        />
      </DinaForm>
    );

    const button = wrapper.getByRole("button", { name: /buttonText/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(wrapper.getByText(/Field is empty/i)).toBeInTheDocument();
    });
  });
});
