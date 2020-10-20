import { stringArrayCell } from "../stringArray-cell";
import { mountWithAppContext } from "../../test-util/mock-app-context";

describe("stringArrayCell", () => {
  it("Renders the string as comma seperated string.", () => {
    const cell = stringArrayCell("myStringArrField");

    const wrapper = mountWithAppContext(
      <cell.Cell original={{ myStringArrField: new Array(["org1", "org2"]) }} />
    );

    expect(cell.accessor).toEqual("myStringArrField");

    expect(wrapper.find(".stringArray-cell").text()).toEqual("org1,org2");
  });

  it("Renders nothing if string is missing", () => {
    const cell = stringArrayCell("myStringArrField");

    const wrapper = mountWithAppContext(<cell.Cell original={{}} />);

    expect(wrapper.text()).toEqual("");
  });
});
