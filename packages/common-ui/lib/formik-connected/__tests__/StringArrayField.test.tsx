import { fireEvent } from "@testing-library/react";
import { mountWithAppContext } from "common-ui";
import { DinaForm } from "../DinaForm";
import { FormikButton } from "../FormikButton";
import { StringArrayField } from "../StringArrayField";
import "@testing-library/jest-dom";
import { SubmitButton } from "../SubmitButton";

const mockSubmit = jest.fn();

describe("StringArrayField component", () => {
  beforeEach(jest.clearAllMocks);

  it("Edits the array field using a textarea.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{ lines: ["line1", "line2", "line3"] }}
        onSubmit={({ submittedValues }) => mockSubmit(submittedValues)}
      >
        <StringArrayField name="lines" />
        <SubmitButton />
      </DinaForm>
    );

    expect(wrapper.getByDisplayValue(/line1 line2 line3/i)).toBeInTheDocument();

    fireEvent.change(wrapper.getByRole("textbox"), {
      target: { value: ["line1", "line2", "line3", "", "line4"].join("\n") }
    });

    fireEvent.click(wrapper.getByRole("button"));
    await new Promise(setImmediate);

    expect(mockSubmit.mock.calls).toEqual([
      [{ lines: ["line1", "line2", "line3", "line4"] }]
    ]);
  });

  it("Displays the right value when the form state changes.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={{ lines: ["line1", "line2", "line3"] }}
        onSubmit={({ submittedValues }) => mockSubmit(submittedValues)}
      >
        <StringArrayField name="lines" />
        <FormikButton
          onClick={async (_, form) => {
            try {
              await form.setFieldValue("lines", ["new", "value"]);
            } catch (error) {
              console.error(error);
            }
          }}
        >
          Set new field value
        </FormikButton>
        <SubmitButton />
      </DinaForm>
    );

    fireEvent.click(
      wrapper.getByRole("button", { name: /set new field value/i })
    );
    await new Promise(setImmediate);

    fireEvent.click(wrapper.getByRole("button", { name: /save/i }));
    await new Promise(setImmediate);

    expect(mockSubmit.mock.calls).toEqual([[{ lines: ["new", "value"] }]]);
  });
});
