import ControlledVocabularyViewPage from "../../../pages/controlled-vocabulary-type/view";
import { mountWithAppContext, waitForLoadingToDisappear } from "common-ui";
import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

jest.mock("next/router", () => ({
  useRouter: () => ({ query: { id: "ma-id", api: "agent" }, push: jest.fn() })
}));

function testVocabulary(permissions: string[], ordered = false) {
  return {
    id: "ma-id",
    ordered,
    // The vocabulary's "type" attribute replaces the JSON:API type when deserialized.
    type: "MANAGED_ATTRIBUTE",
    name: "Managed Attribute",
    key: "managed_attribute",
    vocabClass: "QUALIFIED_VALUE",
    meta: {
      permissionsProvider: "DinaAdminCUDAuthorizationService",
      permissions
    }
  };
}

const TEST_ITEM = {
  id: "item-1",
  type: "controlled-vocabulary-item",
  name: "Agent attribute",
  dinaComponent: "PERSON"
};

/** The items table's requests: the Change Order button counts with limit 1, the modal loads 1000. */
function tableRequests(mockGet: jest.Mock) {
  return mockGet.mock.calls.filter(
    ([path, params]) =>
      path === "/agent-api/controlled-vocabulary-item" &&
      ![1, 1000].includes(params?.page?.limit)
  );
}

const ORDERED_ITEMS = [
  { ...TEST_ITEM, position: 1 },
  { ...TEST_ITEM, id: "item-2", name: "Second attribute", position: 2 },
  { ...TEST_ITEM, id: "item-3", name: "Third attribute", position: 3 }
];

function mountPage(
  permissions: string[],
  itemPermissions: string[] | number = [],
  ordered = false,
  items: any[] = ordered ? ORDERED_ITEMS : [TEST_ITEM]
) {
  const mockGet = jest.fn<any, any>(async (path: string) =>
    path === "agent-api/controlled-vocabulary/ma-id"
      ? { data: testVocabulary(permissions, ordered) }
      : path === "/agent-api/controlled-vocabulary-item"
      ? { data: items, meta: { totalResourceCount: items.length } }
      : { data: [] }
  );
  const mockPost = jest.fn(async () => {
    if (typeof itemPermissions === "number") {
      throw { response: { status: itemPermissions } };
    }
    return {
      data: { data: { attributes: { permissions: itemPermissions } } }
    };
  });
  const mockSave = jest.fn<any, any>(async () => []);
  const wrapper = mountWithAppContext(<ControlledVocabularyViewPage />, {
    apiContext: {
      apiClient: { get: mockGet, axios: { post: mockPost } } as any,
      save: mockSave
    }
  });
  return { wrapper, mockGet, mockSave };
}

describe("Controlled vocabulary view page", () => {
  it("Shows the vocabulary and only its items from the page's API.", async () => {
    const { wrapper, mockGet } = mountPage(["update"]);
    await waitForLoadingToDisappear();

    expect(mockGet).toHaveBeenCalledWith(
      "agent-api/controlled-vocabulary/ma-id",
      expect.objectContaining({
        header: { "include-dina-permission": "true" }
      })
    );
    expect(wrapper.getByText("managed_attribute")).toBeInTheDocument();
    expect(wrapper.getByText("QUALIFIED_VALUE")).toBeInTheDocument();

    await waitFor(() =>
      expect(mockGet).toHaveBeenCalledWith(
        "/agent-api/controlled-vocabulary-item",
        expect.objectContaining({
          filter: { "controlledVocabulary.uuid": { EQ: "ma-id" } }
        })
      )
    );
    expect(
      await wrapper.findByRole("link", { name: "Agent attribute" })
    ).toHaveAttribute(
      "href",
      "/controlled-vocabulary-item/view?api=agent&id=item-1"
    );
  });

  it("Shows the Edit button only to users who can edit the vocabulary.", async () => {
    const { wrapper } = mountPage(["update"]);
    await waitForLoadingToDisappear();
    expect(wrapper.getByRole("link", { name: "Edit" })).toHaveAttribute(
      "href",
      "/controlled-vocabulary-type/edit?api=agent&id=ma-id"
    );

    wrapper.unmount();
    const { wrapper: readOnly } = mountPage([]);
    await waitForLoadingToDisappear();
    expect(readOnly.getByText("managed_attribute")).toBeInTheDocument();
    expect(readOnly.queryByRole("link", { name: "Edit" })).toBeNull();
  });

  it("Shows the Create Item button to users who can create items, even without edit access to the vocabulary.", async () => {
    const { wrapper } = mountPage([], ["read", "create"]);
    await waitForLoadingToDisappear();

    expect(
      await wrapper.findByRole("link", { name: "Create Item" })
    ).toHaveAttribute(
      "href",
      "/controlled-vocabulary-item/edit?api=agent&controlledVocabularyId=ma-id"
    );
  });

  it("Hides the Create Item button from users who can't create items.", async () => {
    const { wrapper } = mountPage(["update"], ["read"]);
    await waitForLoadingToDisappear();

    await wrapper.findByRole("link", { name: "Edit" });
    expect(wrapper.queryByRole("link", { name: "Create Item" })).toBeNull();
  });

  it("Shows the Create Item button when the permission check is unavailable, since the API still checks on save.", async () => {
    const { wrapper } = mountPage([], 500);
    await waitForLoadingToDisappear();

    expect(
      await wrapper.findByRole("link", { name: "Create Item" })
    ).toBeInTheDocument();
  });

  it("Hides the Create Item button when the permission check refuses the user.", async () => {
    const { wrapper } = mountPage(["update"], 403);
    await waitForLoadingToDisappear();

    await wrapper.findByRole("link", { name: "Edit" });
    expect(wrapper.queryByRole("link", { name: "Create Item" })).toBeNull();
  });

  it("Shows the Change Order button only for ordered vocabularies.", async () => {
    const { wrapper } = mountPage([], ["read", "update"]);
    await waitForLoadingToDisappear();
    await wrapper.findByRole("link", { name: "Agent attribute" });
    expect(wrapper.queryByRole("button", { name: "Change Order" })).toBeNull();
    expect(
      wrapper.queryByRole("columnheader", { name: "Position" })
    ).toBeNull();

    wrapper.unmount();
    const { wrapper: ordered } = mountPage([], ["read", "update"], true);
    await waitForLoadingToDisappear();
    await waitFor(() =>
      expect(
        ordered.getByRole("button", { name: "Change Order" })
      ).toBeEnabled()
    );
    expect(
      ordered.getByRole("columnheader", { name: /Position/ })
    ).toBeInTheDocument();
  });

  it.each([
    ["no items", []],
    ["one item", [ORDERED_ITEMS[0]]]
  ])(
    "Disables the Change Order button when the vocabulary has %s.",
    async (_, items) => {
      const { wrapper } = mountPage([], ["read", "update"], true, items);
      await waitForLoadingToDisappear();

      const button = await wrapper.findByRole("button", {
        name: "Change Order"
      });
      await waitFor(() => expect(button).toBeDisabled());
      // The disabled button ignores the pointer, so hover its wrapper.
      await userEvent.hover(button.parentElement as HTMLElement);
      expect(
        await wrapper.findByText(
          "At least two items are needed to change the order."
        )
      ).toBeInTheDocument();
    }
  );

  it("Sorts an ordered vocabulary's items by position and shows System Defined.", async () => {
    const { wrapper, mockGet } = mountPage([], ["read"], true);
    await waitForLoadingToDisappear();
    await wrapper.findByRole("link", { name: "Second attribute" });

    expect(tableRequests(mockGet)[0][1]).toEqual(
      expect.objectContaining({ sort: "position" })
    );
    expect(
      wrapper.getByRole("columnheader", { name: /System Defined/ })
    ).toBeInTheDocument();
  });

  it("Saves a new order from the page, closes the modal and reloads the table.", async () => {
    const { wrapper, mockGet, mockSave } = mountPage(
      [],
      ["read", "update"],
      true
    );
    await waitForLoadingToDisappear();
    const button = await wrapper.findByRole("button", {
      name: "Change Order"
    });
    await waitFor(() => expect(button).toBeEnabled());
    const tableLoads = tableRequests(mockGet).length;

    await userEvent.click(button);
    await userEvent.click(
      await wrapper.findByRole("button", { name: "Move Agent attribute down" })
    );
    await userEvent.click(wrapper.getByRole("button", { name: "Save Order" }));

    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));
    expect(mockSave.mock.calls[0][1]).toEqual({ apiBaseUrl: "/agent-api" });
    await waitFor(() =>
      expect(wrapper.queryByRole("button", { name: "Save Order" })).toBeNull()
    );
    await waitFor(() =>
      expect(tableRequests(mockGet).length).toBeGreaterThan(tableLoads)
    );
  });

  it("Ignores a sort saved from an unordered vocabulary's items table.", async () => {
    localStorage.setItem(
      "controlled-vocabulary-items_tableSort",
      JSON.stringify([{ id: "createdOn", desc: true }])
    );
    try {
      const { wrapper, mockGet } = mountPage([], ["read"], true);
      await waitForLoadingToDisappear();
      await wrapper.findByRole("link", { name: "Second attribute" });

      expect(tableRequests(mockGet)[0][1]).toEqual(
        expect.objectContaining({ sort: "position" })
      );
    } finally {
      localStorage.removeItem("controlled-vocabulary-items_tableSort");
    }
  });
});
