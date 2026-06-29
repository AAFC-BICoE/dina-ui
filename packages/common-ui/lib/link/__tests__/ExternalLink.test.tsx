import { ExternalLink } from "../ExternalLink";
import "@testing-library/jest-dom";
import { mountWithAppContext } from "../../test-util/mock-app-context";

// Next.js Link mock
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, target, rel, className }: any) => (
    <a href={href} target={target} rel={rel} className={className}>
      {children}
    </a>
  )
}));

describe("ExternalLink", () => {
  it("renders the link with the correct href", () => {
    const wrapper = mountWithAppContext(
      <ExternalLink href="/test">Link Text</ExternalLink>,
      {}
    );
    expect(wrapper.getByRole("link")).toHaveAttribute("href", "/test");
  });

  it("always opens in a new tab", () => {
    const wrapper = mountWithAppContext(
      <ExternalLink href="/test">Link Text</ExternalLink>,
      {}
    );
    expect(wrapper.getByRole("link")).toHaveAttribute("target", "_blank");
  });

  it("always has noopener noreferrer rel", () => {
    const wrapper = mountWithAppContext(
      <ExternalLink href="/test">Link Text</ExternalLink>,
      {}
    );
    expect(wrapper.getByRole("link")).toHaveAttribute(
      "rel",
      "noopener noreferrer"
    );
  });

  it("renders children correctly", () => {
    const wrapper = mountWithAppContext(
      <ExternalLink href="/test">My Link Text</ExternalLink>,
      {}
    );
    expect(wrapper.getByText("My Link Text")).toBeInTheDocument();
  });

  it("renders the external icon with default aria-label", () => {
    const wrapper = mountWithAppContext(
      <ExternalLink href="/test">Link Text</ExternalLink>,
      {}
    );
    expect(wrapper.getByLabelText("Opens in new tab")).toBeInTheDocument();
  });

  it("applies a custom className to the link", () => {
    const wrapper = mountWithAppContext(
      <ExternalLink href="/test" className="my-class">
        Link Text
      </ExternalLink>,
      {}
    );
    expect(wrapper.getByRole("link")).toHaveClass("my-class");
  });

  it("renders complex children correctly", () => {
    const wrapper = mountWithAppContext(
      <ExternalLink href="/test">
        <span>Nested</span> Content
      </ExternalLink>,
      {}
    );
    expect(wrapper.getByText("Nested")).toBeInTheDocument();
  });

  it("icon does not wrap separately from text", () => {
    const wrapper = mountWithAppContext(
      <ExternalLink href="/test">Link Text</ExternalLink>,
      {}
    );
    const span = wrapper.getByRole("link").querySelector("span");
    expect(span).toHaveStyle({ whiteSpace: "nowrap" });
  });

  it("icon and children are wrapped in a single span", () => {
    const wrapper = mountWithAppContext(
      <ExternalLink href="/test">Link Text</ExternalLink>,
      {}
    );
    const link = wrapper.getByRole("link");
    expect(link.children).toHaveLength(1);
    expect(link.children[0].tagName).toBe("SPAN");
  });
});
