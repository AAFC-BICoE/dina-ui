import { mountWithAppContext, QueryPage } from "common-ui";
import "@testing-library/jest-dom";
import { waitFor } from "@testing-library/react";
import React from "react";
import { DatasetExportForm } from "../../../../components/collection/dataset/DatasetExportForm";
import DatasetExportPage from "../../../../pages/collection/dataset/export";
import { Dataset } from "../../../../types/collection-api";

jest.mock("common-ui/lib/list-page/QueryPage", () => ({
  QueryPage: jest.fn(() => null)
}));

const TEST_DATASET: Dataset = {
  id: "333",
  type: "dataset",
  datasetVersion: "1.0",
  multilingualTitle: { titles: [{ lang: "en", title: "Test dataset" }] }
};

const mockGet = jest.fn<any, any>(async (path) => {
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

describe("Dataset export curation page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery = { id: "333" };
  });

  it("renders the export panel beside results with the active query and count", async () => {
    mountWithAppContext(<DatasetExportPage />, { apiContext });

    await waitForQueryPage();
    const queryPageProps = (QueryPage as jest.Mock).mock.calls[0][0];

    expect(queryPageProps).toEqual(
      expect.objectContaining({
        indexName: "dina_material_sample_index",
        uniqueName: "dataset-export-dwca-333"
      })
    );
    expect(queryPageProps).not.toHaveProperty("dataExportProps");
    expect(queryPageProps).not.toHaveProperty("tabs");
    expect(queryPageProps.resultsAside).toEqual(expect.any(Function));

    const exportPanel = queryPageProps.resultsAside({
      query: { query: { match_all: {} } },
      totalRecords: 5
    });
    expect(exportPanel.type).toBe("section");
    const formElement = React.Children.only(exportPanel.props.children);
    expect(React.isValidElement(formElement)).toBe(true);
    expect(formElement.type).toBe(DatasetExportForm);
    expect(React.isValidElement(formElement) && formElement.props).toEqual(
      expect.objectContaining({
        dataset: TEST_DATASET,
        totalRecords: 5,
        query: { query: { match_all: {} } },
        definition: {
          exportType: "DWCA",
          source: "dina_material_sample_index",
          indexName: "dina_material_sample_index"
        }
      })
    );
  });
});

async function waitForQueryPage() {
  await waitFor(() => {
    expect(QueryPage).toHaveBeenCalled();
  });
}
