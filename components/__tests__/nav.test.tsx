import React from "react";
import { shallow } from "enzyme";
import { Nav } from "../nav";

describe("Nav component", () => {
  it("link exists", async () => {
    const wrapper = await shallow(<Nav />);
    expect(wrapper.find("a[href='']").exists)
    wrapper.find("a#en").simulate("click")
    expect(wrapper.find('n[lan="fr"]').exists());
    wrapper.find("a#fr").simulate("click")
    expect(wrapper.find('n[lan="en"]').exists());
  })
})

