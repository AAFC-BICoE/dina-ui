import { clearAndType, mountWithAppContext } from "common-ui";
import { fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { PersistedResource } from "kitsu";
import DatasetEditPage, {
  DatasetForm
} from "../../../../pages/collection/dataset/edit";
import { Dataset } from "../../../../types/collection-api";
import { License } from "../../../../types/objectstore-api";

const TEST_LICENSES: PersistedResource<License>[] = [
  {
    id: "open-government-license-canada",
    type: "license",
    url: "https://open.canada.ca/en/open-government-licence-canada",
    titles: { en: "Open Government Licence - Canada" }
  },
  {
    id: "cc-by",
    type: "license",
    url: "https://creativecommons.org/licenses/by/4.0/",
    titles: { en: "CC-BY" }
  }
];

const TEST_DATASET_WITH_LICENSE: PersistedResource<Dataset> = {
  id: "333",
  type: "dataset",
  group: "test-group",
  datasetVersion: "1.0",
  multilingualTitle: { titles: [{ lang: "en", title: "Existing" }] },
  usageRights: {
    licenseName: "Open Government Licence - Canada",
    licenseUrl: "https://open.canada.ca/en/open-government-licence-canada"
  }
};

const mockGet = jest.fn<any, any>(async (path, params) => {
  switch (path) {
    case "user-api/group":
      return { data: [] };
    case "collection-api/dataset/333":
      return { data: TEST_DATASET_WITH_LICENSE };
    case "objectstore-api/license":
      // The edit page filters by URL to resolve a stored licence; the
      // picker itself fetches with no filter to list every licence.
      return params?.filter?.url
        ? { data: TEST_LICENSES.filter((it) => it.url === params.filter.url) }
        : { data: TEST_LICENSES };
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

/** Mock next.js' router "push" function for navigating pages. */
const mockPush = jest.fn();

/** The mock URL query string params, set per-test. */
let mockQuery: any = {};

jest.mock("next/router", () => ({
  useRouter: () => ({
    push: mockPush,
    query: mockQuery
  })
}));

describe("Dataset form.", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery = {};
  });

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

  it("Lets you pick a Licence from the dropdown, and saves its name and URL", async () => {
    const wrapper = mountWithAppContext(<DatasetForm onSaved={mockOnSaved} />, {
      apiContext
    });

    const titleInput = await wrapper.findByRole("textbox", {
      name: /english title/i
    });
    await clearAndType(titleInput, "Ants of Canada");

    // Open the licence picker and choose the second licence:
    await userEvent.click(
      wrapper.getByRole("combobox", { name: /licen[cs]e/i })
    );
    await userEvent.click(wrapper.getByRole("option", { name: /cc-by/i }));

    fireEvent.submit(wrapper.container.querySelector("form")!);

    await waitFor(() => {
      expect(mockSave).lastCalledWith(
        [
          {
            resource: expect.objectContaining({
              usageRights: {
                licenseName: "CC-BY",
                licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
                usageTerms: undefined
              }
            }),
            type: "dataset"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      );
    });
  });
});

describe("Dataset edit page.", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery = {};
  });

  it("Loads an existing Dataset by id, resolves its stored Licence, and redirects to the view page on save", async () => {
    mockQuery = { id: "333" };

    const wrapper = mountWithAppContext(<DatasetEditPage />, { apiContext });

    const versionInput = await wrapper.findByRole("textbox", {
      name: /dataset version/i
    });
    await waitFor(() => {
      expect(versionInput).toHaveDisplayValue("1.0");
    });

    // The GET for the existing Dataset, and the follow-up GET that resolves
    // the stored licence URL to a License resource, both happened:
    expect(mockGet).toHaveBeenCalledWith(
      "collection-api/dataset/333",
      expect.anything()
    );
    expect(mockGet).toHaveBeenCalledWith("objectstore-api/license", {
      filter: {
        url: "https://open.canada.ca/en/open-government-licence-canada"
      }
    });

    // The resolved licence is shown as the picker's selected value, proving the
    // resolved License object (not just the raw stored URL) made it into the form:
    expect(
      wrapper.getByText(/open government licence - canada/i)
    ).toBeInTheDocument();

    await clearAndType(versionInput, "2.0");

    fireEvent.submit(wrapper.container.querySelector("form")!);

    await waitFor(() => {
      expect(mockSave).lastCalledWith(
        [
          {
            resource: expect.objectContaining({
              id: "333",
              type: "dataset",
              datasetVersion: "2.0"
            }),
            type: "dataset"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      );
      // Redirected to the view page for the saved (existing) record:
      expect(mockPush).lastCalledWith("/collection/dataset/view?id=333");
    });
  });

  it("Doesn't fetch a Licence when the Dataset has none stored", async () => {
    mockQuery = { id: "444" };
    mockGet.mockImplementationOnce(async (path) =>
      path === "collection-api/dataset/444"
        ? {
            data: {
              id: "444",
              type: "dataset",
              multilingualTitle: {
                titles: [{ lang: "en", title: "No licence" }]
              }
            } as PersistedResource<Dataset>
          }
        : { data: [] }
    );

    const wrapper = mountWithAppContext(<DatasetEditPage />, { apiContext });

    await wrapper.findByRole("textbox", { name: /english title/i });

    // The licence picker itself still fetches the full list of licences to
    // populate its options; what should NOT happen is the page's own lookup
    // that resolves a *stored* licence URL to a License resource:
    expect(mockGet).not.toHaveBeenCalledWith(
      "objectstore-api/license",
      expect.objectContaining({ filter: expect.anything() })
    );
  });

  it("Submits a new Dataset without a leading id GET request", async () => {
    mockQuery = {};

    const wrapper = mountWithAppContext(<DatasetEditPage />, { apiContext });

    const titleInput = await wrapper.findByRole("textbox", {
      name: /english title/i
    });
    await clearAndType(titleInput, "New Dataset");

    fireEvent.submit(wrapper.container.querySelector("form")!);

    await waitFor(() => {
      expect(mockSave).lastCalledWith(
        [
          {
            resource: expect.objectContaining({ type: "dataset" }),
            type: "dataset"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      );
      expect(mockPush).lastCalledWith("/collection/dataset/view?id=123");
    });

    expect(mockGet).not.toHaveBeenCalledWith(
      expect.stringMatching(/^collection-api\/dataset\//),
      expect.anything()
    );
  });
});
