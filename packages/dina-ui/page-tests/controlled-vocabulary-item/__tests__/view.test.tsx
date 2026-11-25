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
function mockGetWithPermissions(permissions: string[], apiPath = "seqdb-api") {
  return jest.fn<any, any>(async (path: string) =>
    path === `${apiPath}/controlled-vocabulary-item/item-1`
      ? {
          data: {
            ...TEST_ITEM,
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
});
