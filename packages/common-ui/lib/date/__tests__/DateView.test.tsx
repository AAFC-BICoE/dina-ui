import { mountWithAppContext } from "../../test-util/mock-app-context";
import { DateView } from "../DateView";

describe("DateView component", () => {
  it("Renders the date.", () => {
    const date = "2020-11-12T16:46:31.179386Z";
    const wrapper = mountWithAppContext(<DateView date={date} />);
    // Displayed date:
    expect(wrapper.text()).toEqual("2020-11-12, 4:46:31 p.m.");
    // Popup when you hover over the date:
    expect(wrapper.find(".date-cell").prop("title")).toEqual(
      "Thu Nov 12 2020 16:46:31 GMT+0000 (Coordinated Universal Time)"
    );
  });

  it("Renders null when there is no date.", () => {
    const wrapper = mountWithAppContext(<DateView />);
    expect(wrapper.text()).toEqual("");
  });
});
