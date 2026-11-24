import ControlledVocabularyItemViewPage from "../../../pages/controlled-vocabulary-item/view";
import { mountWithAppContext, waitForLoadingToDisappear } from "common-ui";
import "@testing-library/jest-dom";

jest.mock("next/router", () => ({
  useRouter: () => ({ query: { id: "item-1", api: "sequencing" } }),
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

const mockGet = jest.fn<any, any>(async (path: string) =>
  path === "seqdb-api/controlled-vocabulary-item/item-1"
    ? { data: TEST_ITEM }
    : { data: [] }
);

describe("Controlled vocabulary item view page", () => {
  it("Loads the item from the ?api= API and links to its edit page and list tab.", async () => {
    const wrapper = mountWithAppContext(<ControlledVocabularyItemViewPage />, {
      apiContext: { apiClient: { get: mockGet } as any }
    });
    await waitForLoadingToDisappear();

    expect(mockGet).toHaveBeenCalledWith(
      "seqdb-api/controlled-vocabulary-item/item-1",
      expect.objectContaining({ include: "controlledVocabulary" })
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
});
