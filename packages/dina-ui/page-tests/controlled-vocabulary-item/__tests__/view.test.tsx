import ControlledVocabularyItemViewPage from "../../../pages/controlled-vocabulary-item/view";
import { mountWithAppContext, waitForLoadingToDisappear } from "common-ui";
import "@testing-library/jest-dom";

let mockQuery: Record<string, string> = { id: "item-1", api: "sequencing" };

jest.mock("next/router", () => ({
  useRouter: () => ({ query: mockQuery }),
  withRouter: (Component) => Component
}));

const TEST_ITEM = {
  id: "item-1",
  type: "controlled-vocabulary-item",
  name: "SeqDB attribute",
  key: "seqdb_attribute",
  vocabularyElementType: "STRING",
  controlledVocabulary: {
    id: "ma-id",
    type: "MANAGED_ATTRIBUTE",
    name: "Managed Attribute"
  }
};

/** Item GET from the given API returning the given per-record permissions. */
function mockGetWithPermissions(
  permissions: string[],
  apiPath = "seqdb-api",
  item: Record<string, unknown> = TEST_ITEM
) {
  return jest.fn<any, any>(async (path: string) =>
    path === `${apiPath}/controlled-vocabulary-item/item-1`
      ? {
          data: {
            ...item,
            meta: {
              permissionsProvider: "SuperUserInGroupCUDAuthorizationService",
              permissions
            }
          }
        }
      : { data: [] }
  );
}

describe("Controlled vocabulary item view page", () => {
  beforeEach(() => {
    mockQuery = { id: "item-1", api: "sequencing" };
  });

  it("Loads the item from the ?api= API and links to its edit page and list tab.", async () => {
    const mockGet = mockGetWithPermissions(["read", "update"]);
    const wrapper = mountWithAppContext(<ControlledVocabularyItemViewPage />, {
      apiContext: { apiClient: { get: mockGet } as any }
    });
    await waitForLoadingToDisappear();

    expect(mockGet).toHaveBeenCalledWith(
      "seqdb-api/controlled-vocabulary-item/item-1",
      expect.objectContaining({
        include: "controlledVocabulary",
        header: { "include-dina-permission": "true" }
      })
    );
    expect(wrapper.getByText("seqdb_attribute")).toBeInTheDocument();
    expect(wrapper.getByRole("link", { name: "Edit" })).toHaveAttribute(
      "href",
      "/controlled-vocabulary-item/edit?api=sequencing&id=item-1"
    );
    expect(
      wrapper.getByRole("link", { name: /back to list/i })
    ).toHaveAttribute("href", "/controlled-vocabulary/list?tab=2");
  });

  it("Links back to the vocabulary the item was opened from.", async () => {
    mockQuery = {
      id: "item-1",
      api: "sequencing",
      controlledVocabularyId: "ma-id"
    };
    const wrapper = mountWithAppContext(<ControlledVocabularyItemViewPage />, {
      apiContext: {
        apiClient: { get: mockGetWithPermissions(["read"]) } as any
      }
    });
    await waitForLoadingToDisappear();

    expect(
      wrapper.getByRole("link", { name: "Back to controlled vocabulary" })
    ).toHaveAttribute(
      "href",
      "/controlled-vocabulary-type/view?api=sequencing&id=ma-id"
    );
  });

  it("Hides the Edit button from users who can't update the item.", async () => {
    const wrapper = mountWithAppContext(<ControlledVocabularyItemViewPage />, {
      apiContext: {
        apiClient: { get: mockGetWithPermissions(["read"]) } as any
      }
    });
    await waitForLoadingToDisappear();

    expect(wrapper.getByText("seqdb_attribute")).toBeInTheDocument();
    expect(wrapper.queryByRole("link", { name: "Edit" })).toBeNull();
  });

  it("Loads the item from the collection API when ?api= is missing.", async () => {
    mockQuery = { id: "item-1" };
    const mockGet = mockGetWithPermissions(
      ["read", "update"],
      "collection-api"
    );
    const wrapper = mountWithAppContext(<ControlledVocabularyItemViewPage />, {
      apiContext: { apiClient: { get: mockGet } as any }
    });
    await waitForLoadingToDisappear();

    expect(mockGet).toHaveBeenCalledWith(
      "collection-api/controlled-vocabulary-item/item-1",
      expect.anything()
    );
    expect(wrapper.getByRole("link", { name: "Edit" })).toHaveAttribute(
      "href",
      "/controlled-vocabulary-item/edit?api=collection&id=item-1"
    );
    expect(
      wrapper.getByRole("link", { name: /back to list/i })
    ).toHaveAttribute("href", "/controlled-vocabulary/list");
  });

  it("Shows the Delete button to users who can delete the item.", async () => {
    const wrapper = mountWithAppContext(<ControlledVocabularyItemViewPage />, {
      apiContext: {
        apiClient: {
          get: mockGetWithPermissions(["read", "update", "delete"])
        } as any
      }
    });
    await waitForLoadingToDisappear();

    expect(wrapper.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("Hides the Delete button for system-defined items, even with delete permission.", async () => {
    const wrapper = mountWithAppContext(<ControlledVocabularyItemViewPage />, {
      apiContext: {
        apiClient: {
          get: mockGetWithPermissions(
            ["read", "update", "delete"],
            "seqdb-api",
            {
              ...TEST_ITEM,
              systemDefined: true
            }
          )
        } as any
      }
    });
    await waitForLoadingToDisappear();

    expect(wrapper.getByText("seqdb_attribute")).toBeInTheDocument();
    expect(wrapper.queryByRole("button", { name: "Delete" })).toBeNull();
    expect(wrapper.getByRole("link", { name: "Edit" })).toBeInTheDocument();
  });

  it("Shows the position only for items that have one.", async () => {
    const wrapper = mountWithAppContext(<ControlledVocabularyItemViewPage />, {
      apiContext: {
        apiClient: {
          get: mockGetWithPermissions(["read"], "seqdb-api", {
            ...TEST_ITEM,
            position: 3
          })
        } as any
      }
    });
    await waitForLoadingToDisappear();
    expect(wrapper.getByText("Position")).toBeInTheDocument();
    expect(wrapper.getByText("3")).toBeInTheDocument();

    wrapper.unmount();
    const unordered = mountWithAppContext(
      <ControlledVocabularyItemViewPage />,
      {
        apiContext: {
          apiClient: { get: mockGetWithPermissions(["read"]) } as any
        }
      }
    );
    await waitForLoadingToDisappear();
    expect(unordered.getAllByText("SeqDB attribute").length).toBeGreaterThan(0);
    expect(unordered.queryByText("Position")).toBeNull();
  });
});
