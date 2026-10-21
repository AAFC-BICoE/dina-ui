import { mountWithAppContext } from "common-ui";
import "@testing-library/jest-dom";
import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DatasetDetailsPage from "../../../../pages/collection/dataset/view";
import { Dataset } from "../../../../types/collection-api";

const CURATED_QUERY = JSON.stringify({
  id: "group-id",
  type: "group",
  children1: [
    {
      type: "rule",
      id: "rule-id",
      properties: {
        field: "data.attributes.materialSampleName",
        operator: "exactMatch",
        value: ["Salmon"],
        valueSrc: ["value"],
        valueType: ["text"],
        valueError: []
      }
    }
  ],
  properties: { conjunction: "AND" }
});

const TEST_DATASET: Dataset = {
  id: "333",
  type: "dataset",
  datasetType: "DWCA",
  exportName: "Salmon archive",
  query: CURATED_QUERY,
  datasetVersion: "1.0",
  multilingualTitle: { titles: [{ lang: "en", title: "Test dataset" }] }
};

const TEST_DATASET_MAPPING = {
  data: {
    attributes: [
      {
        name: "materialSampleName",
        type: "text",
        fields: ["keyword"],
        path: "data.attributes"
      }
    ],
    relationships: []
  }
};

const mockGet = jest.fn(async (path: string) => {
  if (path === "collection-api/dataset/333") {
    return { data: TEST_DATASET };
  }
  if (path === "search-api/search-ws/mapping") {
    return TEST_DATASET_MAPPING;
  }
  return { data: [] };
});

const mockSave = jest.fn<any, any>(async () => []);

const apiContext = {
  save: mockSave,
  apiClient: { get: mockGet, axios: { get: mockGet } },
  bulkGet: jest.fn(async () => [])
} as any;

let mockQuery: Record<string, string> = {};

jest.mock("next/router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    query: mockQuery
  })
}));

describe("Dataset details page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery = { id: "333" };
  });

  it("shows the export button and the edit action", async () => {
    const wrapper = mountWithAppContext(<DatasetDetailsPage />, { apiContext });

    expect(
      await wrapper.findByRole("button", { name: /^export$/i })
    ).toBeInTheDocument();
    expect(wrapper.getByRole("link", { name: /edit/i })).toHaveAttribute(
      "href",
      "/collection/dataset/edit?id=333"
    );
  });

  it("requests a DWCA export from the dataset's saved query", async () => {
    const wrapper = mountWithAppContext(<DatasetDetailsPage />, { apiContext });

    const exportButton = await wrapper.findByRole("button", {
      name: /^export$/i
    });

    // The query is converted once the query builder configuration has loaded.
    await waitFor(() => expect(exportButton).toBeEnabled(), { timeout: 3000 });

    await userEvent.click(exportButton);

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledWith(
        [
          {
            resource: expect.objectContaining({
              type: "data-export",
              name: "Salmon archive",
              exportType: "DWCA",
              source: "dina_material_sample_index",
              dataset: expect.objectContaining({ uuid: "333" })
            }),
            type: "data-export"
          }
        ],
        { apiBaseUrl: "/dina-export-api" }
      );
    });

    // The stored tree is converted to an Elasticsearch query.
    const savedRequest = mockSave.mock.calls[0][0][0].resource;
    expect(JSON.stringify(savedRequest.query)).toContain("Salmon");

    expect(await wrapper.findByRole("status")).toBeInTheDocument();
  });
});
