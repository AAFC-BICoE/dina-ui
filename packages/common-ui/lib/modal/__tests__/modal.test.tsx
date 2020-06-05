import { mount } from "enzyme";
import { ModalProvider, useModal } from "../modal";

function TestComponent() {
  const { closeModal, openModal } = useModal();

  return (
    <>
      <button
        className="open-modal"
        onClick={() => openModal(<div className="test-modal-content" />)}
      />
      <button className="close-modal" onClick={closeModal} />
    </>
  );
}

describe("Modal", () => {
  it("Lets you open a modal.", () => {
    const wrapper = mount(
      <ModalProvider appElement={document.querySelector("body")}>
        <TestComponent />
      </ModalProvider>
    );

    // Closed initially:
    expect(wrapper.find(".test-modal-content").exists()).toEqual(false);

    // Open the modal:
    wrapper.find("button.open-modal").simulate("click");
    wrapper.update();

    expect(wrapper.find(".test-modal-content").exists()).toEqual(true);

    // Close the modal:
    wrapper.find("button.close-modal").simulate("click");
    wrapper.update();

    expect(wrapper.find(".test-modal-content").exists()).toEqual(false);
  });
});
