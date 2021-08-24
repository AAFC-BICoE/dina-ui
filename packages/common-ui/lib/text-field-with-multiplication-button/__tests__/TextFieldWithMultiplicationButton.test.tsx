import { DinaForm } from "../../formik-connected/DinaForm";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { TextFieldWithMultiplicationButton } from "../TextFieldWithMultiplicationButton";

describe("TextFieldWithMultiplicationButton component", () => {
  it("appends the symbol at the end.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <TextFieldWithMultiplicationButton name="myField" />
      </DinaForm>
    );
    wrapper.find("input").simulate("change", { target: { value: "species1" } });
    wrapper.find("button.multiplication-button").at(0).simulate("click");
    wrapper.update();
    expect(wrapper.find("input").prop("value")).toEqual("species1×");
  });
});
