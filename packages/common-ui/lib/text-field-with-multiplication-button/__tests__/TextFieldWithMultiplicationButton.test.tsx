import { fireEvent } from "@testing-library/react";
import { DinaForm } from "../../formik-connected/DinaForm";
import { mountWithAppContext2 } from "../../test-util/mock-app-context";
import { TextFieldWithMultiplicationButton } from "../TextFieldWithMultiplicationButton";

describe("TextFieldWithMultiplicationButton component", () => {
  it("appends the symbol at the end.", async () => {
    const wrapper = mountWithAppContext2(
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
