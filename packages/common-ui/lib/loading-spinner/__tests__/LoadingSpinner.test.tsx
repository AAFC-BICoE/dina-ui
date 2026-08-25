import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import { LoadingSpinner } from "../LoadingSpinner";

describe("LoadingSpinner component", () => {
  it("Renders a loading spinner when the loading prop is true.", () => {
    const wrapper = render(<LoadingSpinner loading={true} />);
    expect(wrapper.getByRole("status")).toBeInTheDocument();
  });

  it("Renders nothing when the loading prop is false.", () => {
    const wrapper = render(<LoadingSpinner loading={false} />);
    expect(wrapper.queryByRole("status")).not.toBeInTheDocument();
  });
});
