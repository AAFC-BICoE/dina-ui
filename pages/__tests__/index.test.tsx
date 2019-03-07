import { shallow } from "enzyme";
import toJson from "enzyme-to-json";
import IndexPage from "../index";

describe("Index page", () => {
  it("Renders the index page.", () => {
    const wrapper = shallow(<IndexPage />);
    expect(toJson(wrapper)).toMatchSnapshot("Index page shallow render");
  });
});
