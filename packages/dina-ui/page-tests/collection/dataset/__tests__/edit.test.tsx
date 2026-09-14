import { clearAndType, mountWithAppContext } from "common-ui";
import { fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { DatasetForm } from "../../../../pages/collection/dataset/edit";
import { Dataset } from "../../../../types/collection-api";

const mockGet = jest.fn<any, any>(async (path) => {
  switch (path) {
    case "user-api/group":
      return { data: [] };
    default:
      return { data: [] };
  }
});

const mockSave = jest.fn(async (saves) =>
  saves.map((save) => ({
    ...save.resource,
    id: save.resource.id ?? "123"
  }))
);

const apiContext = {
  save: mockSave,
  apiClient: { get: mockGet },
  bulkGet: jest.fn(async () => [])
};

const mockOnSaved = jest.fn();

describe("Dataset form.", () => {
  beforeEach(jest.clearAllMocks);

  it("Lets you add a new Dataset", async () => {
    const wrapper = mountWithAppContext(<DatasetForm onSaved={mockOnSaved} />, {
      apiContext
    });

    const titleInput = await wrapper.findByRole("textbox", {
      name: /english title/i
    });
    await clearAndType(titleInput, "Ants of Canada");

    fireEvent.submit(wrapper.container.querySelector("form")!);

    await waitFor(() => {
      expect(mockSave).lastCalledWith(
        [
          {
            resource: expect.objectContaining({
              type: "dataset",
              multilingualTitle: {
                titles: [{ lang: "en", title: "Ants of Canada" }]
              }
            }),
            type: "dataset"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      );
    });
  });

  it("Submits the agent as a UUID and the keywords as an array", async () => {
    const fetchedDataset: Dataset = {
      id: "333",
      type: "dataset",
      group: "test-group",
      multilingualTitle: { titles: [{ lang: "en", title: "Existing" }] },
      agentRoles: [{ agent: "agent-uuid-1", roles: ["creator"] }],
      keywordSets: [{ keywords: ["ants"], thesaurus: "GBIF" }]
    };

    const wrapper = mountWithAppContext(
      <DatasetForm fetchedDataset={fetchedDataset} onSaved={mockOnSaved} />,
      { apiContext }
    );

    const keywordsInput = await wrapper.findByRole("textbox", {
      name: /keywords/i
    });
    await clearAndType(keywordsInput, "ants\nFormicidae");

    fireEvent.submit(wrapper.container.querySelector("form")!);

    await waitFor(() => {
      expect(mockSave).lastCalledWith(
        [
          {
            resource: expect.objectContaining({
              id: "333",
              type: "dataset",
              // The agent goes back to the API as a bare UUID:
              agentRoles: [{ agent: "agent-uuid-1", roles: ["creator"] }],
              keywordSets: [
                { keywords: ["ants", "Formicidae"], thesaurus: "GBIF" }
              ]
            }),
            type: "dataset"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      );
    });
  });

  it("Lets you remove a keyword set row", async () => {
    const fetchedDataset: Dataset = {
      id: "444",
      type: "dataset",
      multilingualTitle: { titles: [{ lang: "en", title: "Existing" }] },
      keywordSets: [
        { keywords: ["ants"], thesaurus: "GBIF" },
        { keywords: ["Canada"], thesaurus: "GEONAMES" }
      ]
    };

    const wrapper = mountWithAppContext(
      <DatasetForm fetchedDataset={fetchedDataset} onSaved={mockOnSaved} />,
      { apiContext }
    );

    const section = wrapper.container.querySelector(
      "#dataset-keyword-sets-section"
    )!;
    await waitFor(() => {
      expect(section.querySelectorAll(".remove-row-button").length).toEqual(2);
    });

    await userEvent.click(
      section.querySelectorAll(".remove-row-button")[0] as HTMLElement
    );

    await waitFor(() => {
      expect(section.querySelectorAll(".remove-row-button").length).toEqual(1);
    });

    fireEvent.submit(wrapper.container.querySelector("form")!);

    await waitFor(() => {
      expect(mockSave).lastCalledWith(
        [
          {
            resource: expect.objectContaining({
              keywordSets: [{ keywords: ["Canada"], thesaurus: "GEONAMES" }]
            }),
            type: "dataset"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      );
    });
  });
});
