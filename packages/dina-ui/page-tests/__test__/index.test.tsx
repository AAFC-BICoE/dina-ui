import IndexPage from "../../pages/index";
import { mountWithAppContext } from "common-ui";
import "@testing-library/jest-dom";

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => ({ children }) => <div>{children}</div>);

describe("Index page", () => {
  it("Renders the index page.", () => {
    const wrapper = mountWithAppContext(<IndexPage />);

    // Test headings to make sure the page rendered
    expect(wrapper.getByRole("heading", { name: /collection/i }));
    expect(wrapper.getByRole("heading", { name: /transactions/i }));
    expect(wrapper.getByRole("heading", { name: /object store/i }));
    expect(wrapper.getByRole("heading", { name: /agents/i }));
    expect(wrapper.getByRole("heading", { name: /sequencing/i }));
    expect(wrapper.getByRole("heading", { name: /controlled vocabulary/i }));
    expect(wrapper.getByRole("heading", { name: /configuration/i }));
  });
});
