import { mountWithAppContext } from "common-ui";
import { AreYouSureModal } from "../AreYouSureModal";
import { useModal } from "../modal";
import { fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

const mockYesClick = jest.fn();

function TestComponent() {
  const { closeModal, openModal } = useModal();

  return (
    <>
      <button
        className="open-modal"
        onClick={() =>
          openModal(
            <AreYouSureModal
              actionMessage="Test Message"
              onYesButtonClicked={mockYesClick}
            />
          )
        }
      >
        Open
      </button>
      <button className="close-modal" onClick={closeModal}>
        Close
      </button>
    </>
  );
}

describe("AreYouSureModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Closes when you click 'No'", async () => {
    const wrapper = mountWithAppContext(<TestComponent />);

    // Should not be open by default on initial load.
    expect(wrapper.queryByText(/test message/i)).not.toBeInTheDocument();

    // Open modal:
    fireEvent.click(wrapper.getByRole("button", { name: /open/i }));

    // Ensure the test message is displayed.
    expect(wrapper.getByText(/test message/i)).toBeInTheDocument();

    // Click 'no':
    fireEvent.click(wrapper.getByRole("button", { name: /no/i }));

    // Should be closed now:
    expect(wrapper.queryByText(/test message/i)).not.toBeInTheDocument();
  });

  it("Runs the passed function and closes when you click 'Yes'", async () => {
    const wrapper = mountWithAppContext(<TestComponent />);

    // Open modal:
    fireEvent.click(wrapper.getByRole("button", { name: /open/i }));

    // Ensure the test message is displayed.
    expect(wrapper.getByText(/test message/i)).toBeInTheDocument();

    // Click 'yes':
    fireEvent.click(wrapper.getByRole("button", { name: /yes/i }));
    await new Promise(setImmediate);

    // Should have run the function:
    expect(mockYesClick).toHaveBeenCalledTimes(1);

    // Should be closed now:
    expect(wrapper.queryByText(/test message/i)).not.toBeInTheDocument();
  });
});
