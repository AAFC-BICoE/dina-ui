import { createRenderer } from "react-test-renderer/shallow";
import IndexPage from "../index";

describe("Index page", () => {
  it("Renders the index page.", () => {
    const renderer = createRenderer();
    renderer.render(<IndexPage />);
    expect(renderer.getRenderOutput()).toMatchSnapshot(
      "Index page shallow render"
    );
  });
});
