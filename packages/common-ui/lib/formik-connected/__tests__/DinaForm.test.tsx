import { mountWithAppContext } from "../../test-util/mock-app-context";
import { DinaForm } from "../DinaForm";
import { SubmitButton } from "../SubmitButton";

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
});
