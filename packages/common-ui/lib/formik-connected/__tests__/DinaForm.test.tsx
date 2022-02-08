import { DoOperationsError } from "../..";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { DinaForm } from "../DinaForm";
import { SubmitButton } from "../SubmitButton";
import { TextField } from "../TextField";

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

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

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
      </DinaForm>
    );

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // Both errors should be shown:
    expect(
      wrapper.find(".people_0__name-field .invalid-feedback").text()
    ).toEqual("test error for person #0");
    expect(
      wrapper.find(".people_3__name-field .invalid-feedback").text()
    ).toEqual("test error for person #3");
  });
});
