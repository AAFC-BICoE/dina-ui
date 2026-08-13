import { FormikButton } from "../..";
import { mountWithAppContext } from "common-ui";
import { DinaForm } from "../DinaForm";
import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

const mockOnClick = jest.fn();
const mockOnSubmit = jest.fn();

function getWrapper() {
  return mountWithAppContext(
    <DinaForm
      initialValues={{ testProperty: "testValue" }}
      onSubmit={async ({ submittedValues }) => mockOnSubmit(submittedValues)}
    >
      <FormikButton onClick={mockOnClick}>Test Button</FormikButton>
    </DinaForm>
  );
}

describe("FormikButton component", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("Renders the button.", () => {
    const wrapper = getWrapper();
    expect(
      wrapper.getByRole("button", {
        name: /test button/i
      })
    ).toBeInTheDocument();
  });

  it("Renders a loading spinner while the form is loading.", async () => {
    // Keep the form in the submitting state until this promise is resolved
    let resolveOnClick: () => void;
    mockOnClick.mockImplementation(
      () => new Promise<void>((resolve) => (resolveOnClick = resolve))
    );

    const wrapper = getWrapper();

    // Submit the form
    await userEvent.click(
      wrapper.getByRole("button", {
        name: /test button/i
      })
    );
    // Wait for the spinner to appear
    await waitFor(() => {
      expect(wrapper.getByText(/loading\.\.\./i)).toBeInTheDocument();
      expect(
        wrapper.container.querySelector(".spinner-border")
      ).toBeInTheDocument();
    });

    // Finish the submission
    resolveOnClick!();
  });

  it("Provides an onClick method that provides access to the formik context.", async () => {
    const wrapper = getWrapper();
    await userEvent.click(
      wrapper.getByRole("button", {
        name: /test button/i
      })
    );
    expect(mockOnClick.mock.calls).toEqual([
      [
        { testProperty: "testValue" },
        expect.objectContaining({ setSubmitting: expect.anything() })
      ]
    ]);
  });
});
