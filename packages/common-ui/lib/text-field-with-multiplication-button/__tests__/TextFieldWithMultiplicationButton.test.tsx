import userEvent from "@testing-library/user-event";
import { DinaForm } from "../../formik-connected/DinaForm";
import { clearAndType, mountWithAppContext } from "common-ui";
import { TextFieldWithMultiplicationButton } from "../TextFieldWithMultiplicationButton";

describe("TextFieldWithMultiplicationButton component", () => {
  it("appends the symbol at the end.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <TextFieldWithMultiplicationButton name="myField" />
      </DinaForm>
    );

    await clearAndType(wrapper.getByRole("textbox"), "species1");
    await userEvent.click(wrapper.getByRole("button", { name: /×/i }));

    expect((wrapper.getByRole("textbox") as HTMLInputElement).value).toEqual(
      "species1×"
    );
  });
});
