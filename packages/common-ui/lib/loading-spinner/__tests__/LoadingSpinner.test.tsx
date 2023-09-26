import "@testing-library/jest-dom";
import { render, waitFor } from "@testing-library/react";
import { LoadingSpinner } from "../LoadingSpinner";

describe("LoadingSpinner component", () => {
  it("Renders a loading spinner when the loading prop is true.", () => {
    const wrapper = render(<LoadingSpinner loading={true} />);
    waitFor(() => {
      expect(wrapper.queryByRole("status")).toBeInTheDocument();
    });
  });

  it("Renders nothing when the loading prop is false.", () => {
    const wrapper = render(<LoadingSpinner loading={false} />);
    waitFor(() => {
      expect(wrapper.queryByRole("status")).toBeNull();
    });
  });
});
