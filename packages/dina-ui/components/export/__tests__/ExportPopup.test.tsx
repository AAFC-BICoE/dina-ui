import { ExportPopup } from "../ExportPopup";
import { mountWithAppContext } from "common-ui";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

const mockTarget = document.createElement("button");
document.body.appendChild(mockTarget);

describe("ExportPopup", () => {
  const onCloseMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders nothing when show is false", () => {
    const wrapper = mountWithAppContext(
      <ExportPopup target={mockTarget} show={false} onClose={onCloseMock} />
    );

    expect(
      wrapper.queryByText("Export Request Submitted")
    ).not.toBeInTheDocument();
    expect(
      wrapper.queryByText(
        "Your export is being processed. You will receive a notification when it's ready to download."
      )
    ).not.toBeInTheDocument();
  });

  it("renders the popover when show is true", () => {
    const wrapper = mountWithAppContext(
      <ExportPopup target={mockTarget} show={true} onClose={onCloseMock} />
    );

    expect(wrapper.getByText("Export Request Submitted")).toBeInTheDocument();
    expect(
      wrapper.getByText(
        "Your export is being processed. You will receive a notification when it's ready to download."
      )
    ).toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", () => {
    const wrapper = mountWithAppContext(
      <ExportPopup target={mockTarget} show={true} onClose={onCloseMock} />
    );

    userEvent.click(wrapper.getByTestId("close-button"));
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose when the popover body is clicked", () => {
    const wrapper = mountWithAppContext(
      <ExportPopup target={mockTarget} show={true} onClose={onCloseMock} />
    );

    userEvent.click(
      wrapper.getByText(
        "Your export is being processed. You will receive a notification when it's ready to download."
      )
    );
    expect(onCloseMock).not.toHaveBeenCalled();
  });

  it("renders with a null target without crashing", () => {
    expect(() =>
      mountWithAppContext(
        <ExportPopup target={null} show={true} onClose={onCloseMock} />
      )
    ).not.toThrow();
  });
});
