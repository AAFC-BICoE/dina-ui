import { mountWithAppContext } from "../../test-util/mock-app-context";
import { useModal } from "../modal";

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

function TestComponentNestedModals() {
  const { closeModal, openModal } = useModal();

  return (
    <>
      <button
        className="open-modal"
        onClick={() => openModal(<TestComponentNestedModals />)}
      />
      <button className="close-modal" onClick={closeModal} />
    </>
  );
}

describe("Modal", () => {
  it("Lets you open a modal.", () => {
    const wrapper = mountWithAppContext(<TestComponent />);

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

  it("Lets you open multiple modals in first-in-last-out order.", async () => {
    const wrapper = mountWithAppContext(<TestComponentNestedModals />);

    // Open the modal:
    wrapper.find("button.open-modal").simulate("click");
    wrapper.update();

    // Open the inner modal:
    wrapper.find("button.open-modal").at(1).simulate("click");
    wrapper.update();

    expect(wrapper.find(".dina-modal-wrapper").length).toEqual(2);

    // Original modal is hidden:
    expect(wrapper.find(".dina-modal-wrapper").at(0).prop("style")).toEqual({
      display: "none"
    });

    // Second modal is visible:
    expect(wrapper.find(".dina-modal-wrapper").at(1).prop("style")).toEqual({});

    // Close second modal:
    wrapper.find("button.close-modal").at(1).simulate("click");
    wrapper.update();

    // Close first modal:
    wrapper.find("button.close-modal").at(0).simulate("click");
    wrapper.update();

    // No modals left:
    expect(wrapper.find(".dina-modal-wrapper").length).toEqual(0);
  });
});
