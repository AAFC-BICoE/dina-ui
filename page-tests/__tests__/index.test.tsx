import { shallow } from "enzyme";
import IndexPage from "../../pages/index";

describe("Index page", () => {
  it("Renders the index page.", () => {
    const wrapper = shallow(<IndexPage />);
    expect(wrapper.containsMatchingElement(<h1>Welcome to Next!</h1>)).toEqual(
      true
    );
  });
});
