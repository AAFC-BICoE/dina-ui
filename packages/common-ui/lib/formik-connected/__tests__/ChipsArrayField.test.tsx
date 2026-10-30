import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mountWithAppContext } from "common-ui";
import { ChipsArrayField } from "../ChipsArrayField";
import { DinaForm } from "../DinaForm";
import { SubmitButton } from "../SubmitButton";
import "@testing-library/jest-dom";

const mockSubmit = jest.fn();

function renderField(
  initialValues: { items?: string[] },
  props: { readOnly?: boolean; disabled?: boolean } = {}
) {
  return mountWithAppContext(
    <DinaForm
      initialValues={initialValues}
      readOnly={props.readOnly}
      onSubmit={({ submittedValues }) => mockSubmit(submittedValues)}
    >
      <ChipsArrayField name="items" disabled={props.disabled} />
      <SubmitButton />
    </DinaForm>
  );
}

describe("ChipsArrayField component", () => {
  beforeEach(jest.clearAllMocks);

  it("Adds trimmed values on Enter, skipping empty and duplicate ones.", async () => {
    const wrapper = renderField({ items: ["a"] });
    const input = wrapper.getByRole("textbox", { name: /items/i });

    await userEvent.type(input, "  b  {enter}");
    await userEvent.type(input, "   {enter}");
    await userEvent.type(input, "a{enter}");

    expect(input).toHaveValue("");
    await userEvent.click(wrapper.getByRole("button", { name: /save/i }));
    await waitFor(() =>
      expect(mockSubmit.mock.calls).toEqual([[{ items: ["a", "b"] }]])
    );
  });

  it("Removes values with the remove button and with Backspace on an empty input.", async () => {
    const wrapper = renderField({ items: ["a", "b", "c"] });

    await userEvent.click(wrapper.getByRole("button", { name: "Remove b" }));
    await userEvent.type(
      wrapper.getByRole("textbox", { name: /items/i }),
      "{backspace}"
    );

    await userEvent.click(wrapper.getByRole("button", { name: /save/i }));
    await waitFor(() =>
      expect(mockSubmit.mock.calls).toEqual([[{ items: ["a"] }]])
    );
  });

  it("Clears the draft on Escape and keeps an unconfirmed value on blur.", async () => {
    const wrapper = renderField({ items: [] });
    const input = wrapper.getByRole("textbox", { name: /items/i });

    await userEvent.type(input, "discard{escape}");
    expect(input).toHaveValue("");

    await userEvent.type(input, "kept");
    await userEvent.tab();
    expect(wrapper.getByText("kept")).toBeInTheDocument();
    expect(wrapper.queryByText("discard")).not.toBeInTheDocument();
  });

  it("Doesn't remove a value when the field label is clicked.", async () => {
    const wrapper = renderField({ items: ["a"] });

    await userEvent.click(wrapper.getByText("Items"));

    expect(
      wrapper.getByRole("button", { name: "Remove a" })
    ).toBeInTheDocument();
  });

  it("Shows the values without remove buttons when read-only or disabled.", () => {
    const readOnly = renderField({ items: ["a", "b"] }, { readOnly: true });
    expect(readOnly.getByText("a")).toBeInTheDocument();
    expect(readOnly.getByText("b")).toBeInTheDocument();
    expect(
      readOnly.queryByRole("button", { name: /remove/i })
    ).not.toBeInTheDocument();
    readOnly.unmount();

    const disabled = renderField({ items: ["a"] }, { disabled: true });
    expect(disabled.getByText("a")).toBeInTheDocument();
    expect(
      disabled.queryByRole("button", { name: /remove/i })
    ).not.toBeInTheDocument();
    expect(disabled.getByRole("textbox", { name: /items/i })).toBeDisabled();
  });
});
