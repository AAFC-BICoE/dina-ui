import { fireEvent } from "@testing-library/react";
import { DinaForm } from "../../formik-connected/DinaForm";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { TextFieldWithRemoveButton } from "../TextFieldWithRemoveButton";
import "@testing-library/jest-dom";

describe("TextFieldWithRemoveButton component", () => {
  it("Click remove button remove the whole text field wrapper.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <TextFieldWithRemoveButton name="myField" />
      </DinaForm>
    );

    fireEvent.click(wrapper.getByRole("button"));
    expect(wrapper.queryByRole("textbox")).not.toBeInTheDocument();
    expect(wrapper.queryByRole("button")).not.toBeInTheDocument();
  });
});
