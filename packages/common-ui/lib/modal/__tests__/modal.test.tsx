import { fireEvent } from "@testing-library/react";
import { mountWithAppContext } from "../../test-util/mock-app-context";
import { useModal } from "../modal";
import "@testing-library/jest-dom";

function TestComponent() {
  const { closeModal, openModal } = useModal();

  return (
    <>
      <button
        className="open-modal"
        onClick={() =>
          openModal(
            <div className="test-modal-content">
              <button className="close-modal" onClick={closeModal}>
                Exit
              </button>
            </div>
          )
        }
      >
        Open
      </button>
    </>
  );
}

function TestComponentNestedModals() {
  const { closeModal, openModal } = useModal();

  return (
    <>
      <button
        className="open-modal"
        onClick={() => openModal(<TestComponent />)}
      >
        Open
      </button>
      <button className="close-modal" onClick={closeModal}>
        Close
      </button>
    </>
  );
}

describe("Modal", () => {
  it("Lets you open a modal.", () => {
    const wrapper = mountWithAppContext(<TestComponent />);

    // Closed initially:
    expect(
      wrapper.queryByRole("dialog", { name: /popup dialog window/i })
    ).not.toBeInTheDocument();

    // Open the modal:
    fireEvent.click(wrapper.getByRole("button", { name: /open/i }));

    expect(
      wrapper.getByRole("dialog", { name: /popup dialog window/i })
    ).toBeInTheDocument();

    // Close the modal:
    fireEvent.click(wrapper.getByRole("button", { name: /exit/i }));
    expect(
      wrapper.queryByRole("dialog", { name: /popup dialog window/i })
    ).not.toBeInTheDocument();
  });

  it("Lets you open multiple modals in first-in-last-out order.", async () => {
    const wrapper = mountWithAppContext(<TestComponentNestedModals />);

    // Closed initially:
    expect(
      wrapper.queryByRole("dialog", { name: /popup dialog window/i })
    ).not.toBeInTheDocument();

    // Open the modal:
    fireEvent.click(wrapper.getByRole("button", { name: /open/i }));

    // Open the inner modal:
    fireEvent.click(wrapper.getAllByRole("button", { name: /open/i })[1]);

    // The "Exit" button should appear in the nested modal:
    expect(wrapper.getByRole("button", { name: /exit/i })).toBeInTheDocument();

    // Close second modal:
    fireEvent.click(wrapper.getByRole("button", { name: /exit/i }));

    // Close first modal:
    fireEvent.click(wrapper.getByRole("button", { name: /close/i }));

    // No modals left:
    expect(
      wrapper.queryByRole("dialog", { name: /popup dialog window/i })
    ).not.toBeInTheDocument();
  });
});
