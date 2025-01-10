import { fireEvent } from "@testing-library/react";
import { DinaForm } from "../../formik-connected/DinaForm";
import { mountWithAppContext } from "common-ui";
import { TextFieldWithCoordButtons } from "../TextFieldWithCoordButtons";
import "@testing-library/jest-dom";

describe("TextFieldWithCoordButtons component", () => {
  it("Inserts the symbol at the cursor's position.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <TextFieldWithCoordButtons name="myField" />
      </DinaForm>
    );

    fireEvent.click(wrapper.getByRole("button", { name: /°/i }));
    expect((wrapper.getByRole("textbox") as HTMLInputElement).value).toEqual(
      "°"
    );

    // Move cursor to the second part in the textbox.
    fireEvent.change(wrapper.getByRole("textbox"), {
      target: {
        value: "asdf"
      }
    });

    fireEvent.click(wrapper.getByRole("button", { name: /″/i }));
    expect((wrapper.getByRole("textbox") as HTMLInputElement).value).toEqual(
      "asdf″"
    );
  });
});
