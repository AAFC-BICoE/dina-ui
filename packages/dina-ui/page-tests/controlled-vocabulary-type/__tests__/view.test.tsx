import ControlledVocabularyViewPage from "../../../pages/controlled-vocabulary-type/view";
import { mountWithAppContext, waitForLoadingToDisappear } from "common-ui";
import { waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

jest.mock("next/router", () => ({
  useRouter: () => ({ query: { id: "ma-id", api: "agent" }, push: jest.fn() })
}));

function testVocabulary(permissions: string[]) {
  return {
    id: "ma-id",
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

function mountPage(permissions: string[], itemPermissions: string[] = []) {
  const mockGet = jest.fn<any, any>(async (path: string) =>
    path === "agent-api/controlled-vocabulary/ma-id"
      ? { data: testVocabulary(permissions) }
      : path === "/agent-api/controlled-vocabulary-item"
      ? { data: [TEST_ITEM], meta: { totalResourceCount: 1 } }
      : { data: [] }
  );
  const mockPost = jest.fn(async () => ({
    data: { data: { attributes: { permissions: itemPermissions } } }
  }));
  const wrapper = mountWithAppContext(<ControlledVocabularyViewPage />, {
    apiContext: {
      apiClient: { get: mockGet, axios: { post: mockPost } } as any
    }
  });
  return { wrapper, mockGet };
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
});
