import { render, screen } from "@testing-library/react";
import { ExternalLink } from "../ExternalLink";
import "@testing-library/jest-dom";

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
    render(<ExternalLink href="/test">Link Text</ExternalLink>);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/test");
  });

  it("always opens in a new tab", () => {
    render(<ExternalLink href="/test">Link Text</ExternalLink>);
    expect(screen.getByRole("link")).toHaveAttribute("target", "_blank");
  });

  it("always has noopener noreferrer rel", () => {
    render(<ExternalLink href="/test">Link Text</ExternalLink>);
    expect(screen.getByRole("link")).toHaveAttribute(
      "rel",
      "noopener noreferrer"
    );
  });

  it("renders children correctly", () => {
    render(<ExternalLink href="/test">My Link Text</ExternalLink>);
    expect(screen.getByText("My Link Text")).toBeInTheDocument();
  });

  it("renders the external icon with default aria-label", () => {
    render(<ExternalLink href="/test">Link Text</ExternalLink>);
    expect(screen.getByLabelText("Opens in new tab")).toBeInTheDocument();
  });

  it("applies a custom className to the link", () => {
    render(
      <ExternalLink href="/test" className="my-class">
        Link Text
      </ExternalLink>
    );
    expect(screen.getByRole("link")).toHaveClass("my-class");
  });

  it("renders complex children correctly", () => {
    render(
      <ExternalLink href="/test">
        <span>Nested</span> Content
      </ExternalLink>
    );
    expect(screen.getByText("Nested")).toBeInTheDocument();
  });

  it("icon does not wrap separately from text", () => {
    render(<ExternalLink href="/test">Link Text</ExternalLink>);
    const span = screen.getByRole("link").querySelector("span");
    expect(span).toHaveStyle({ whiteSpace: "nowrap" });
  });

  it("icon and children are wrapped in a single span", () => {
    render(<ExternalLink href="/test">Link Text</ExternalLink>);
    const link = screen.getByRole("link");
    expect(link.children).toHaveLength(1);
    expect(link.children[0].tagName).toBe("SPAN");
  });
});
