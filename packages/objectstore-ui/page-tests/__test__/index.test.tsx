import IndexPage from "../../pages/index";
import { mountWithAppContext } from "../../test-util/mock-app-context";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => ({ children }) => <div>{children}</div>);

describe("Index page", () => {
  it("Renders the index page.", () => {
    mountWithAppContext(<IndexPage />);
  });
});
