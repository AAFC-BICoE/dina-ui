import { fireEvent } from "@testing-library/react";
import { DoOperationsError } from "../..";
import { mountWithAppContext } from "common-ui";
import { DinaForm } from "../DinaForm";
import { SubmitButton } from "../SubmitButton";
import { TextField } from "../TextField";
import "@testing-library/jest-dom";

describe("DinaForm component.", () => {
  it("Calls the onSubmit prop.", async () => {
    const mockOnSubmit = jest.fn();
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{ testAttr: "test-value" }}
        onSubmit={mockOnSubmit}
      >
        <SubmitButton />
      </DinaForm>
    );

    // Submit the form.
    fireEvent.click(wrapper.getByRole("button"));
    await wrapper.waitForRequests();

    expect(mockOnSubmit).lastCalledWith({
      account: expect.objectContaining({
        username: "test-user"
      }),
      api: expect.objectContaining({
        apiClient: expect.anything(),
        bulkGet: expect.anything(),
        doOperations: expect.anything(),
        save: expect.anything()
      }),
      formik: expect.anything(),
      submittedValues: {
        testAttr: "test-value"
      }
    });
  });

  it("Shows the field-level error messages on nested dot-path fields.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{}}
        onSubmit={() => {
          throw new DoOperationsError("", {
            // The field errors can be either nested or flat:
            people: [{ name: "test error for person #0" }],
            "people[3].name": "test error for person #3"
          });
        }}
      >
        <TextField name="people[0].name" />
        <TextField name="people[3].name" />
        <SubmitButton />
      </DinaForm>
    );

    // Submit the form.
    fireEvent.click(wrapper.getByRole("button"));
    await wrapper.waitForRequests();

    // Both errors should be shown:
    expect(wrapper.queryByRole("status")).toBeInTheDocument();
  });
});
