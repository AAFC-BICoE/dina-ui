import { mountWithAppContext } from "common-ui";
import { fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { ChangeOrderModal } from "../ChangeOrderModal";

const ITEMS = ["First", "Second", "Third"].map((name, index) => ({
  id: `item-${index + 1}`,
  type: "controlled-vocabulary-item",
  name,
  position: index + 1,
  multilingualDescription: {
    descriptions: name === "Third" ? [] : [{ lang: "en", desc: `${name} desc` }]
  }
}));

function mountModal(saveImpl: () => Promise<any> = async () => []) {
  const mockGet = jest.fn<any, any>(async () => ({ data: ITEMS }));
  const mockSave = jest.fn<any, any>(saveImpl);
  const onClose = jest.fn();
  const onSaved = jest.fn();
  const wrapper = mountWithAppContext(
    <ChangeOrderModal
      vocabularyId="vocab-1"
      vocabularyName="Association Type"
      apiBaseUrl="/collection-api"
      onClose={onClose}
      onSaved={onSaved}
    />,
    { apiContext: { apiClient: { get: mockGet } as any, save: mockSave } }
  );
  const rowNames = () =>
    wrapper
      .getAllByRole("listitem")
      .map((row) => row.querySelector(".fw-bold")?.textContent);
  return { wrapper, mockGet, mockSave, onClose, onSaved, rowNames };
}

describe("ChangeOrderModal", () => {
  it("Loads every item of the vocabulary sorted by position.", async () => {
    const { wrapper, mockGet, rowNames } = mountModal();
    await wrapper.findByText("First");

    expect(mockGet).toHaveBeenCalledWith(
      "/collection-api/controlled-vocabulary-item",
      expect.objectContaining({
        filter: { "controlledVocabulary.uuid": { EQ: "vocab-1" } },
        sort: "position"
      })
    );
    expect(rowNames()).toEqual(["First", "Second", "Third"]);
    expect(wrapper.getByText("Association Type · 3 items")).toBeInTheDocument();
    expect(wrapper.getByText("No description")).toBeInTheDocument();
  });

  it("Moves items up and down, and disables moves past the ends.", async () => {
    const { wrapper, rowNames } = mountModal();
    await wrapper.findByText("First");

    expect(
      wrapper.getByRole("button", { name: "Move First up" })
    ).toBeDisabled();
    expect(
      wrapper.getByRole("button", { name: "Move Third down" })
    ).toBeDisabled();

    await userEvent.click(
      wrapper.getByRole("button", { name: "Move First down" })
    );
    expect(rowNames()).toEqual(["Second", "First", "Third"]);

    await userEvent.click(
      wrapper.getByRole("button", { name: "Move Third up" })
    );
    expect(rowNames()).toEqual(["Second", "Third", "First"]);
  });

  it("Restores the original order on reset.", async () => {
    const { wrapper, rowNames } = mountModal();
    await wrapper.findByText("First");

    await userEvent.click(
      wrapper.getByRole("button", { name: "Move First down" })
    );
    await userEvent.click(
      wrapper.getByRole("button", { name: "Reset to original order" })
    );
    expect(rowNames()).toEqual(["First", "Second", "Third"]);
  });

  it("Closes without saving on cancel.", async () => {
    const { wrapper, mockSave, onClose, onSaved } = mountModal();
    await wrapper.findByText("First");

    await userEvent.click(
      wrapper.getByRole("button", { name: "Move First down" })
    );
    await userEvent.click(wrapper.getByRole("button", { name: "Cancel" }));

    expect(onClose).toHaveBeenCalled();
    expect(mockSave).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("Saves only the changed positions in one request, then closes.", async () => {
    const { wrapper, mockSave, onClose, onSaved } = mountModal();
    await wrapper.findByText("First");

    await userEvent.click(
      wrapper.getByRole("button", { name: "Move First down" })
    );
    await userEvent.click(wrapper.getByRole("button", { name: "Save Order" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(mockSave).toHaveBeenCalledWith(
      [
        {
          type: "controlled-vocabulary-item",
          resource: {
            id: "item-2",
            type: "controlled-vocabulary-item",
            position: 1
          }
        },
        {
          type: "controlled-vocabulary-item",
          resource: {
            id: "item-1",
            type: "controlled-vocabulary-item",
            position: 2
          }
        }
      ],
      { apiBaseUrl: "/collection-api" }
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("Shows the save error and stays open.", async () => {
    const { wrapper, onClose, onSaved } = mountModal(async () => {
      throw new Error("Position already used");
    });
    await wrapper.findByText("First");

    await userEvent.click(
      wrapper.getByRole("button", { name: "Move First down" })
    );
    await userEvent.click(wrapper.getByRole("button", { name: "Save Order" }));

    expect(
      await wrapper.findByText("Position already used")
    ).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
    // The new order is kept so the user can retry.
    expect(
      wrapper.getByRole("button", { name: "Save Order" })
    ).not.toBeDisabled();
  });

  it("Draws the dragged item in an overlay and fades its row until the drag ends.", async () => {
    const { wrapper, rowNames } = mountModal();
    await wrapper.findByText("First");

    // Keyboard drag: Space on the grip picks the item up, Escape cancels.
    const grip = wrapper.getAllByLabelText("Drag to reorder")[0];
    fireEvent.keyDown(grip, { code: "Space" });

    await waitFor(() => expect(wrapper.getAllByText("First")).toHaveLength(2));
    expect(wrapper.getAllByRole("listitem")[0]).toHaveStyle({ opacity: "0.4" });

    fireEvent.keyDown(document, { code: "Escape" });
    await waitFor(() => expect(wrapper.getAllByText("First")).toHaveLength(1));
    expect(rowNames()).toEqual(["First", "Second", "Third"]);
  });
});
