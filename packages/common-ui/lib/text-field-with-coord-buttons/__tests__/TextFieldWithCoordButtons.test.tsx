import { DinaForm } from "../../formik-connected/DinaForm";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { TextFieldWithCoordButtons } from "../TextFieldWithCoordButtons";

describe("TextFieldWithCoordButtons component", () => {
  it("Inserts the symbol at the cursor's position.", async () => {
    const wrapper = mountWithAppContext(
      <DinaForm initialValues={{}}>
        <TextFieldWithCoordButtons name="myField" />
      </DinaForm>
    );

    wrapper.find("button.coord-button").at(0).simulate("click");
    wrapper.update();

    expect(wrapper.find("input").prop("value")).toEqual("°");

    wrapper.find("input").simulate("change", { target: { value: "asdf" } });
    wrapper.find("input").getDOMNode<HTMLInputElement>().selectionStart = 2;
    wrapper.find("button.coord-button").at(0).simulate("click");
    wrapper.update();
    expect(wrapper.find("input").prop("value")).toEqual("as°df");
  });
});
