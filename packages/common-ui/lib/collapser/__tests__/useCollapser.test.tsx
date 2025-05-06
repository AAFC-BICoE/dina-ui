import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useCollapser } from "../useCollapser";

function TestComponent() {
  const { Collapser, collapsed } = useCollapser("test");

  return (
    <div>
      <Collapser />
      {!collapsed && (
        <div className="collapsible-content">
          <span>Collapsed content</span>
        </div>
      )}
    </div>
  );
}

describe("Collapser", () => {
  it("Renders initially as open.", () => {
    render(<TestComponent />);
    expect(screen.queryByText("Collapsed content")).not.toBeNull();
  });

  it("Provides a button to change collapsed state.", () => {
    const wrapper = render(<TestComponent />);
    expect(wrapper.queryByText("Collapsed content")).toBeInTheDocument();

    screen.logTestingPlaygroundURL();

    // Collapse the content:
    const button = wrapper.getByRole("button", { name: /collapse section/i });
    fireEvent.click(button);
    expect(wrapper.queryByText("Collapsed content")).not.toBeInTheDocument();

    // Un-collapse the content:
    fireEvent.click(button);
    waitFor(() => {
      expect(wrapper.queryByText("Collapsed content")).toBeInTheDocument();
    });
  });
});
