import { dateCell } from "../date-cell";
import { mountWithAppContext } from "../../test-util/mock-app-context";

describe("dateCell", () => {
  it("Renders the readable date.", () => {
    const date = "2020-09-04";

    const cell = dateCell("myDateField");

    const wrapper = mountWithAppContext(
      <cell.Cell original={{ myDateField: date }} />
    );

    expect(cell.accessor).toEqual("myDateField");

    expect(wrapper.find(".date-cell").text()).toEqual("2020-09-04");
  });

  it("Renders nothing if date is missing", () => {
    const cell = dateCell("myDateField");

    const wrapper = mountWithAppContext(<cell.Cell original={{}} />);

    expect(wrapper.text()).toEqual("");
  });
});
