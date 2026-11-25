import ControlledVocabularyEditPage from "../../../pages/controlled-vocabulary-type/edit";
import {
  clearAndType,
  mountWithAppContext,
  waitForLoadingToDisappear
} from "common-ui";
import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

const mockPush = jest.fn();

jest.mock("next/router", () => ({
  useRouter: () => ({ query: { id: "ma-id", api: "agent" }, push: mockPush })
}));

const TEST_VOCABULARY = {
  id: "ma-id",
  // The vocabulary's "type" attribute replaces the JSON:API type when deserialized.
  type: "MANAGED_ATTRIBUTE",
  name: "Managed Attribute",
  key: "managed_attribute",
  vocabClass: "QUALIFIED_VALUE",
  version: "1",
  multilingualTitle: { titles: [{ lang: "en", title: "Managed Attribute" }] },
  multilingualDescription: {
    descriptions: [{ lang: "en", desc: "Old description" }]
  }
};

const mockGet = jest.fn<any, any>(async (path: string) =>
  path === "agent-api/controlled-vocabulary/ma-id"
    ? { data: TEST_VOCABULARY }
    : { data: [] }
);

const mockSave = jest.fn<any, any>(async () => [TEST_VOCABULARY]);

const apiContext: any = { apiClient: { get: mockGet }, save: mockSave };

describe("Controlled vocabulary edit page", () => {
  beforeEach(jest.clearAllMocks);

  it("Saves only the changed fields, then goes to the view page.", async () => {
    const wrapper = mountWithAppContext(<ControlledVocabularyEditPage />, {
      apiContext
    });
    await waitForLoadingToDisappear();

    // The key and type can't be edited.
    expect(wrapper.getByRole("textbox", { name: "Key" })).toBeDisabled();
    expect(wrapper.getByRole("textbox", { name: "Type" })).toBeDisabled();

    await clearAndType(
      wrapper.getByRole("textbox", { name: "Name" }),
      "Managed Attribute Renamed"
    );
    await clearAndType(
      wrapper.getByRole("textbox", { name: "English Description" }),
      "New description"
    );
    await userEvent.click(wrapper.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(mockSave).toHaveBeenLastCalledWith(
        [
          {
            resource: {
              id: "ma-id",
              type: "controlled-vocabulary",
              name: "Managed Attribute Renamed",
              multilingualDescription: {
                descriptions: [{ lang: "en", desc: "New description" }]
              }
            },
            type: "controlled-vocabulary"
          }
        ],
        { apiBaseUrl: "/agent-api" }
      )
    );
    expect(mockPush).toHaveBeenCalledWith(
      "/controlled-vocabulary-type/view?api=agent&id=ma-id"
    );
  });
});
