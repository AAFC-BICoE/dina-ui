import { mountWithAppContext } from "../../test-util/mock-app-context";
import { DateView } from "../DateView";

describe("DateView component", () => {
  it("Renders the datetime.", () => {
    const date = "2020-11-12T16:46:31.179386Z";
    const wrapper = mountWithAppContext(<DateView date={date} />);
    // Displayed date:
    expect(wrapper.text()).toEqual("2020-11-12, 4:46:31 p.m.");
  });

  it("Renders the date.", () => {
    const date = "2020-11-12";
    const wrapper = mountWithAppContext(<DateView date={date} />);
    // Displayed date:
    expect(wrapper.text()).toEqual("2020-11-12");
  });

  it("Renders null when there is no date.", () => {
    const wrapper = mountWithAppContext(<DateView />);
    expect(wrapper.text()).toEqual("");
  });
});
