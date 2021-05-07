import { DinaForm } from "../../formik-connected/DinaForm";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { TextFieldWithRemoveButton } from "../TextFieldWithRemoveButton";

describe("TextFieldWithRemoveButton component", () => {
  it("Click remove button remove the whole text field wrapper.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <TextFieldWithRemoveButton name="myField" />
      </DinaForm>
    );

    wrapper.find("button.self-remove-button").at(0).simulate("click");
    wrapper.update();

    expect(wrapper.find("div.div-has-button").length).toBe(0);
  });
});
