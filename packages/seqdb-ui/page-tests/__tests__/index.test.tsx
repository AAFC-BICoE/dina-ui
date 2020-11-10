import { shallow } from "enzyme";
import IndexPage from "../../pages/index";

describe("Index page", () => {
  it("Renders the index page.", () => {
    shallow(<IndexPage />);
  });
});
