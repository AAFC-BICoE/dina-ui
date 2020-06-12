import { mount } from "enzyme";
import { useCollapser } from "../useCollapser";

function TestComponent() {
  const { Collapser, collapsed } = useCollapser("test");

  return (
    <div>
      <Collapser />
      {!collapsed && (
        <div className="collapsible-content">
          <span>Collapsed content</span>
        </div>
      )}
    </div>
  );
}

describe("Collapser", () => {
  it("Renders initially as open.", () => {
    const wrapper = mount(<TestComponent />);
    expect(wrapper.find(".collapsible-content").exists()).toEqual(true);
  });

  it("Provides a button to change collapsed state.", () => {
    const wrapper = mount(<TestComponent />);

    // Collapse the content:
    wrapper.find("button.collapser-button").simulate("click");
    wrapper.update();
    expect(wrapper.find(".collapsible-content").exists()).toEqual(false);

    // Un-collapse the content:
    wrapper.find("button.collapser-button").simulate("click");
    wrapper.update();
    expect(wrapper.find(".collapsible-content").exists()).toEqual(true);
  });
});
