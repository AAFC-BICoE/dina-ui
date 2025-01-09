import { fireEvent } from "@testing-library/react";
import { DinaForm } from "../../formik-connected/DinaForm";
import { mountWithAppContext } from "common-ui";
import { TextFieldWithMultiplicationButton } from "../TextFieldWithMultiplicationButton";

describe("TextFieldWithMultiplicationButton component", () => {
  it("appends the symbol at the end.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <TextFieldWithMultiplicationButton name="myField" />
      </DinaForm>
    );

    fireEvent.change(wrapper.getByRole("textbox"), {
      target: { value: "species1" }
    });
    fireEvent.click(wrapper.getByRole("button", { name: /×/i }));

    expect((wrapper.getByRole("textbox") as HTMLInputElement).value).toEqual(
      "species1×"
    );
  });
});
