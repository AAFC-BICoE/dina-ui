import { mountWithAppContext } from "../../test-util/mock-app-context";
import { AreYouSureModal } from "../AreYouSureModal";
import { useModal } from "../modal";

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
      />
      <button className="close-modal" onClick={closeModal} />
    </>
  );
}

describe("AreYouSureModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Closes when you click 'No'", async () => {
    const wrapper = mountWithAppContext(<TestComponent />);

    // Open modal:
    wrapper.find("button.open-modal").simulate("click");
    wrapper.update();

    // Click 'no':
    wrapper.find("button.no-button").simulate("click");
    wrapper.update();

    // Should be closed now:
    expect(wrapper.find(AreYouSureModal).exists()).toEqual(false);
  });

  it("Runs the passed function and closes when you click 'Yes'", async () => {
    const wrapper = mountWithAppContext(<TestComponent />);

    // Open modal:
    wrapper.find("button.open-modal").simulate("click");
    wrapper.update();

    // Click Yes:
    wrapper.find("form").simulate("submit");
    await new Promise(setImmediate);
    wrapper.update();

    // Should have run the function:
    expect(mockYesClick).toHaveBeenCalledTimes(1);

    // Should be closed now:
    expect(wrapper.find(AreYouSureModal).exists()).toEqual(false);
  });
});
