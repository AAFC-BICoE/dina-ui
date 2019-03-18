import { mount } from "enzyme";
import { LoadingSpinner } from "../LoadingSpinner";

describe("LoadingSpinner component", () => {
  it("Renders a loading spinner when the loading prop is true.", () => {
    const wrapper = mount(<LoadingSpinner loading={true} />);
    expect(wrapper.find(".spinner-border").exists()).toEqual(true);
  });

  it("Renders nothing when the loading prop is false.", () => {
    const wrapper = mount(<LoadingSpinner loading={false} />);
    expect(wrapper.html()).toEqual(null);
  });
});
