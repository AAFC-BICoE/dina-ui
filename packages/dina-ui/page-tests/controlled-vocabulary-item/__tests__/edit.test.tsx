import { ControlledVocabularyItemEditPage } from "../../../pages/controlled-vocabulary-item/edit";
import {
  clearAndType,
  mountWithAppContext,
  waitForLoadingToDisappear
} from "common-ui";
import { fireEvent, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

jest.mock("next/router", () => ({
  useRouter: () => ({ query: {}, push: jest.fn() }),
  withRouter: (Component) => Component
}));

const TEST_VOCABULARY = {
  id: "ma-id",
  type: "MANAGED_ATTRIBUTE",
  name: "Managed Attribute",
  key: "managed_attribute"
};

const ORDERED_VOCABULARY = {
  ...TEST_VOCABULARY,
  id: "ordered-id",
  name: "Ordered Vocabulary",
  ordered: true
};

const TEST_ITEM = {
  id: "item-1",
  type: "controlled-vocabulary-item",
  name: "Agent attribute",
  key: "agent_attribute",
  group: "aafc",
  dinaComponent: "PERSON",
  vocabularyElementType: "STRING",
  controlledVocabulary: TEST_VOCABULARY,
  multilingualDescription: {
    descriptions: [{ lang: "en", desc: "Old description" }]
  }
};

const mockGet = jest.fn<any, any>(async (path: string) => {
  switch (path) {
    case "agent-api/controlled-vocabulary/ma-id":
      return { data: TEST_VOCABULARY };
    case "agent-api/controlled-vocabulary/ordered-id":
      return { data: ORDERED_VOCABULARY };
    case "agent-api/controlled-vocabulary-item":
      // The ordered vocabulary's last item, for the new item's position.
      return { data: [{ ...TEST_ITEM, position: 4 }] };
    case "agent-api/controlled-vocabulary-item/item-1":
      return { data: TEST_ITEM };
    case "user-api/group":
      // One group, so it is selected by default.
      return { data: [{ id: "aafc-id", type: "group", name: "aafc" }] };
  }
  return { data: [] };
});

const mockSave = jest.fn<any, any>(async ([{ resource }]) => [
  { id: resource.id ?? "new-item-id", type: "controlled-vocabulary-item" }
]);

const apiContext: any = { apiClient: { get: mockGet }, save: mockSave };

function mountPage(query: Record<string, string>) {
  const mockPush = jest.fn();
  const wrapper = mountWithAppContext(
    <ControlledVocabularyItemEditPage
      router={{ query, push: mockPush } as any}
    />,
    { apiContext }
  );
  return { wrapper, mockPush };
}

async function selectOption(combobox: HTMLElement, option: string) {
  fireEvent.keyDown(combobox, { key: "ArrowDown" });
  await userEvent.click(await within(document.body).findByText(option));
}

describe("Controlled vocabulary item edit page", () => {
  beforeEach(jest.clearAllMocks);

  it("Creates an item in the vocabulary given by ?controlledVocabularyId=, in the ?api= API.", async () => {
    const { wrapper, mockPush } = mountPage({
      api: "agent",
      controlledVocabularyId: "ma-id"
    });
    await waitForLoadingToDisappear();

    expect(mockGet).toHaveBeenCalledWith(
      "agent-api/controlled-vocabulary/ma-id",
      expect.anything()
    );
    // The vocabulary is selected by default.
    expect(wrapper.getByText("Managed Attribute")).toBeInTheDocument();

    await selectOption(
      wrapper.getByRole("combobox", { name: /target data component type/i }),
      "Person"
    );
    await userEvent.type(
      wrapper.getByRole("textbox", { name: /name/i }),
      "New attribute"
    );
    await selectOption(
      wrapper.getByRole("combobox", { name: /vocabulary element type/i }),
      "Text"
    );
    await userEvent.click(wrapper.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));
    const [[{ resource }], options] = mockSave.mock.calls[0];
    expect(options).toEqual({ apiBaseUrl: "/agent-api" });
    expect(resource).toEqual(
      expect.objectContaining({
        type: "controlled-vocabulary-item",
        group: "aafc",
        name: "New attribute",
        dinaComponent: "PERSON",
        vocabularyElementType: "STRING",
        relationships: {
          controlledVocabulary: {
            data: { id: "ma-id", type: "controlled-vocabulary" }
          }
        }
      })
    );
    // The vocabulary is sent only as a relationship, not as an attribute.
    expect(resource).not.toHaveProperty("controlledVocabulary");
    // The vocabulary isn't ordered, so the API rejects a position.
    expect(resource).not.toHaveProperty("position");
    expect(mockPush).toHaveBeenCalledWith(
      "/controlled-vocabulary-item/view?api=agent&id=new-item-id"
    );
  });

  it("Puts a new item of an ordered vocabulary after its last item.", async () => {
    const { wrapper } = mountPage({
      api: "agent",
      controlledVocabularyId: "ordered-id"
    });
    await waitForLoadingToDisappear();
    expect(wrapper.getByText("Ordered Vocabulary")).toBeInTheDocument();

    await selectOption(
      wrapper.getByRole("combobox", { name: /target data component type/i }),
      "Person"
    );
    await userEvent.type(
      wrapper.getByRole("textbox", { name: /name/i }),
      "New attribute"
    );
    await selectOption(
      wrapper.getByRole("combobox", { name: /vocabulary element type/i }),
      "Text"
    );
    await userEvent.click(wrapper.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));
    expect(mockGet).toHaveBeenCalledWith(
      "agent-api/controlled-vocabulary-item",
      expect.objectContaining({
        filter: { "controlledVocabulary.uuid": { EQ: "ordered-id" } },
        sort: "-position",
        page: { limit: 1 }
      })
    );
    expect(mockSave.mock.calls[0][0][0].resource).toEqual(
      expect.objectContaining({ name: "New attribute", position: 5 })
    );
  });

  it("Edits an existing item from the ?api= API and returns to its view page.", async () => {
    const { wrapper, mockPush } = mountPage({ api: "agent", id: "item-1" });
    await waitForLoadingToDisappear();

    expect(mockGet).toHaveBeenCalledWith(
      "agent-api/controlled-vocabulary-item/item-1",
      expect.objectContaining({ include: "controlledVocabulary" })
    );
    // The vocabulary isn't loaded separately when editing.
    expect(mockGet).not.toHaveBeenCalledWith(
      "agent-api/controlled-vocabulary/ma-id",
      expect.anything()
    );
    expect(
      wrapper.getByRole("link", { name: /back to read-only page/i })
    ).toHaveAttribute(
      "href",
      "/controlled-vocabulary-item/view?api=agent&id=item-1"
    );

    await clearAndType(
      wrapper.getByRole("textbox", { name: "English Description" }),
      "New description"
    );
    await userEvent.click(wrapper.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));
    const [[{ resource }], options] = mockSave.mock.calls[0];
    expect(options).toEqual({ apiBaseUrl: "/agent-api" });
    expect(resource).toEqual(
      expect.objectContaining({
        id: "item-1",
        multilingualDescription: {
          descriptions: [{ lang: "en", desc: "New description" }]
        }
      })
    );
    expect(mockPush).toHaveBeenCalledWith(
      "/controlled-vocabulary-item/view?api=agent&id=item-1"
    );
  });
});
