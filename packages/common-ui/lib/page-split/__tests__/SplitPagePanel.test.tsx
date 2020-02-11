import { mount } from "enzyme";
import { SplitPagePanel } from "../SplitPagePanel";

describe("SplitPagePanel component", () => {
  it("Renders the split page panel.", async () => {
    const wrapper = mount(<SplitPagePanel />);
    await wrapper.update();

    expect(wrapper.find(".split-page-panel").prop("style")).toEqual({
      overflowY: "scroll"
    });
  });
});
