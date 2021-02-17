import { MockAppContextProvider } from "../../test-util/mock-app-context";
import { KeyboardEventHandlerWrappedTextField } from "../KeyboardEventHandlerWrappedTextField";
import { render, screen } from "@testing-library/react";
import { DinaForm } from "../../formik-connected/DinaForm";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/extend-expect";

describe("KeyBoardEventHandlerWrapper component", () => {
  it("Handles the key events triggered from child component", async () => {
    render(
      <MockAppContextProvider>
        <DinaForm initialValues={{ testObject: { testField: "2020" } }}>
          <KeyboardEventHandlerWrappedTextField
            className="col-md-3"
            name="testObject.testField"
          />
        </DinaForm>
      </MockAppContextProvider>
    );

    const input = screen.getByLabelText("Test Object Test Field");
    userEvent.type(input, "{alt}1");
    // We take the same stance as Cypress in that we do not simulate the behavior that
    // happens with modifier key combinations as different operating systems function differently in this regard.
    expect(input.getAttribute("value")).toBe("2020°1");
  });
});
