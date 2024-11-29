import { DinaForm } from "common-ui";
import { mountWithAppContext2 } from "../../../../test-util/mock-app-context";
import { ParseVerbatimToRangeButton } from "../ParseVerbatimToRangeButton";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

const mockSubmit = jest.fn();

describe("ParseVerbatimToRangeButton component", () => {
  it("Sets the range from two detected values when there is no current min value.", async () => {
    const { container } = mountWithAppContext2(
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
    const button = screen.getByRole("button");
    fireEvent.click(button);

    await new Promise(setImmediate);

    // Submit the form using querySelector
    const form = container.querySelector("form");
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockSubmit).lastCalledWith({
        verbatim: "1m to 20m ",
        min: "1",
        max: "20"
      });
    });
  });

  it("Only sets the min when there is one detected value.", async () => {
    const { container } = mountWithAppContext2(
      <DinaForm
        initialValues={{ verbatim: "1m " }}
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
    const button = screen.getByRole("button");
    fireEvent.click(button);

    await new Promise(setImmediate);

    // Submit the form using querySelector
    const form = container.querySelector("form");
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockSubmit).lastCalledWith({
        verbatim: "1m ",
        min: "1"
      });
    });
  });
});
