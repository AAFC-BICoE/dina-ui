import { dateCell } from "../date-cell";
import { mountWithAppContext } from "../../test-util/mock-app-context";

describe("dateCell", () => {
  it("Renders the readable date.", () => {
    const date = new Date("2020-09-04");

    const cell = dateCell("myDateField");

    const wrapper = mountWithAppContext(
      <cell.Cell original={{ myDateField: date }} />
    );

    expect(cell.accessor).toEqual("myDateField");

    expect(wrapper.find(".date-cell").text()).toEqual(
      "2020-09-04, 12:00:00 a.m."
    );
    expect(wrapper.find(".date-cell").prop("title")).toEqual(
      "Fri Sep 04 2020 00:00:00 GMT+0000 (Coordinated Universal Time)"
    );
  });

  it("Renders nothing if date is missing", () => {
    const cell = dateCell("myDateField");

    const wrapper = mountWithAppContext(<cell.Cell original={{}} />);

    expect(wrapper.text()).toEqual("");
  });
});
