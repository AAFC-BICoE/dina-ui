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

function mountPage(permissions: string[]) {
  const mockGet = jest.fn<any, any>(async (path: string) =>
    path === "agent-api/controlled-vocabulary/ma-id"
      ? { data: testVocabulary(permissions) }
      : path === "/agent-api/controlled-vocabulary-item"
      ? { data: [TEST_ITEM], meta: { totalResourceCount: 1 } }
      : { data: [] }
  );
  const wrapper = mountWithAppContext(<ControlledVocabularyViewPage />, {
    apiContext: { apiClient: { get: mockGet } as any }
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

  it("Shows the Create Item and Edit buttons to users who can edit the vocabulary.", async () => {
    const { wrapper } = mountPage(["update"]);
    await waitForLoadingToDisappear();

    expect(wrapper.getByRole("link", { name: "Create Item" })).toHaveAttribute(
      "href",
      "/controlled-vocabulary-item/edit?api=agent&controlledVocabularyId=ma-id"
    );
    expect(wrapper.getByRole("link", { name: "Edit" })).toHaveAttribute(
      "href",
      "/controlled-vocabulary-type/edit?api=agent&id=ma-id"
    );
  });

  it("Hides the Create Item and Edit buttons from users who can't edit the vocabulary.", async () => {
    const { wrapper } = mountPage([]);
    await waitForLoadingToDisappear();

    expect(wrapper.getByText("managed_attribute")).toBeInTheDocument();
    expect(wrapper.queryByRole("link", { name: "Create Item" })).toBeNull();
    expect(wrapper.queryByRole("link", { name: "Edit" })).toBeNull();
  });
});
