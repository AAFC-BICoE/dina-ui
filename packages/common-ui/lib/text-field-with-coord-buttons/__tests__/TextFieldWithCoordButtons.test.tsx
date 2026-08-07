import userEvent from "@testing-library/user-event";
import { DinaForm } from "../../formik-connected/DinaForm";
import { clearAndType, mountWithAppContext } from "common-ui";
import { TextFieldWithCoordButtons } from "../TextFieldWithCoordButtons";
import "@testing-library/jest-dom";

describe("TextFieldWithCoordButtons component", () => {
  it("Inserts the symbol at the cursor's position.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <TextFieldWithCoordButtons name="myField" />
      </DinaForm>
    );

    await userEvent.click(wrapper.getByRole("button", { name: /°/i }));
    expect((wrapper.getByRole("textbox") as HTMLInputElement).value).toEqual(
      "°"
    );

    // Move cursor to the second part in the textbox.
    await clearAndType(wrapper.getByRole("textbox"), "asdf");

    await userEvent.click(wrapper.getByRole("button", { name: /″/i }));
    expect((wrapper.getByRole("textbox") as HTMLInputElement).value).toEqual(
      "asdf″"
    );
  });
});
