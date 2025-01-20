import { DinaForm } from "common-ui";
import { mountWithAppContext } from "common-ui";
import { DeterminationField } from "../DeterminationField";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

const mockOnSubmit = jest.fn();

describe("DeterminationField component", () => {
  beforeEach(jest.clearAllMocks);

  it("Doesn't try to save what the user types into the name search box.", async () => {
    const { container, waitForRequests } = mountWithAppContext(
      <DinaForm
        initialValues={{ determination: [{ isPrimary: true }] }}
        onSubmit={({ submittedValues }) => mockOnSubmit(submittedValues)}
      >
        <DeterminationField />
      </DinaForm>
    );

    // Input some text:
    await waitForRequests();
    const input = screen.getByRole("textbox", {
      name: /global name search/i
    });
    fireEvent.change(input, { target: { value: "test-name" } });

    // Submit the form using querySelector
    const form = container.querySelector("form");
    fireEvent.submit(form!);

    await waitFor(() => {
      // Empty determination submitted:
      expect(mockOnSubmit).lastCalledWith({
        determination: [{ isPrimary: true }]
      });
    });
  });
});
