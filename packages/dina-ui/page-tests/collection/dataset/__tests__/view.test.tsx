import { mountWithAppContext } from "common-ui";
import "@testing-library/jest-dom";
import DatasetDetailsPage from "../../../../pages/collection/dataset/view";
import { Dataset } from "../../../../types/collection-api";

const TEST_DATASET: Dataset = {
  id: "333",
  type: "dataset",
  datasetVersion: "1.0",
  multilingualTitle: { titles: [{ lang: "en", title: "Test dataset" }] }
};

const mockGet = jest.fn(async (path: string) => {
  if (path === "collection-api/dataset/333") {
    return { data: TEST_DATASET };
  }
  return { data: [] };
});

const apiContext = {
  save: jest.fn(),
  apiClient: { get: mockGet },
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

  it("links to DWCA curation for the viewed dataset and keeps the edit action", async () => {
    const wrapper = mountWithAppContext(<DatasetDetailsPage />, { apiContext });

    const exportLink = await wrapper.findByRole("link", {
      name: /export dwca/i
    });

    expect(exportLink).toHaveAttribute(
      "href",
      "/collection/dataset/export?id=333"
    );
    expect(wrapper.getByRole("link", { name: /edit/i })).toHaveAttribute(
      "href",
      "/collection/dataset/edit?id=333"
    );
  });
});
