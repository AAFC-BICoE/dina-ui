import { mountWithAppContext } from "../../test-util/mock-app-context";
import { DateView } from "../DateView";
import "@testing-library/jest-dom";

describe("DateView component", () => {
  it("Renders the datetime.", () => {
    const date = "2020-11-12T16:46:31.179386Z";
    const wrapper = mountWithAppContext(<DateView date={date} />);

    // Displayed date:
    expect(
      wrapper.getByText(/2020\-11\-12, 4:46:31 p\.m\./i)
    ).toBeInTheDocument();
  });

  it("Renders the date.", () => {
    const date = "2020-11-12";
    const wrapper = mountWithAppContext(<DateView date={date} />);

    // Displayed date:
    expect(wrapper.getByText(/2020\-11\-12/i)).toBeInTheDocument();
  });

  it("Renders null when there is no date.", () => {
    const wrapper = mountWithAppContext(<DateView />);
    expect(wrapper.container.innerHTML).toEqual("<div></div>");
  });
});
