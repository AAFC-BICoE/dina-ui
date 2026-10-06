import { mountWithAppContext } from "common-ui";
import "@testing-library/jest-dom";
import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DatasetExportForm } from "../../../../components/collection/dataset/DatasetExportForm";
import { DATASET_EXPORT_DEFINITIONS } from "../../../../components/collection/dataset/datasetExportDefinitions";
import { Dataset } from "../../../../types/collection-api";

const TEST_DATASET: Dataset = {
  id: "dataset-uuid",
  type: "dataset",
  group: "test-group",
  datasetVersion: "1.1",
  multilingualTitle: {
    titles: [{ lang: "en", title: "Salmon dataset" }]
  }
};

const TEST_QUERY = {
  query: {
    bool: {
      must: [
        {
          nested: {
            path: "included",
            query: {
              term: { "included.attributes.name.keyword": "salmon" }
            }
          }
        }
      ]
    }
  },
  from: 0,
  size: 25,
  sort: [{ createdOn: "desc" }],
  _source: ["data.attributes.materialSampleName"]
};

const mockSave = jest.fn(async () => []);
const apiContext = {
  save: mockSave,
  apiClient: { get: jest.fn(async () => ({ data: [] })) },
  bulkGet: jest.fn(async () => [])
} as any;

describe("DatasetExportForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("requires an export name", async () => {
    const wrapper = mountWithAppContext(
      <DatasetExportForm
        dataset={TEST_DATASET}
        definition={DATASET_EXPORT_DEFINITIONS.DWCA}
        query={TEST_QUERY}
        totalRecords={5}
      />,
      { apiContext }
    );

    await userEvent.click(
      wrapper.getByRole("button", { name: /request export/i })
    );

    expect(mockSave).not.toHaveBeenCalled();
    expect(
      await wrapper.findByText(/required/i, { selector: ".invalid-feedback" })
    ).toBeInTheDocument();
  });

  it("submits the named DWCA request to the data-export endpoint", async () => {
    const wrapper = mountWithAppContext(
      <DatasetExportForm
        dataset={TEST_DATASET}
        definition={DATASET_EXPORT_DEFINITIONS.DWCA}
        query={TEST_QUERY}
        totalRecords={5}
      />,
      { apiContext }
    );

    await userEvent.type(
      wrapper.getByRole("textbox", { name: /export name/i }),
      "Salmon archive 2026"
    );
    await userEvent.click(
      wrapper.getByRole("button", { name: /request export/i })
    );

    await wrapper.findByRole("status");
    expect(mockSave).toHaveBeenCalledWith(
      [
        {
          resource: {
            type: "data-export",
            name: "Salmon archive 2026",
            exportType: "DWCA",
            source: "dina_material_sample_index",
            query: JSON.stringify({ query: TEST_QUERY.query }),
            dataset: {
              uuid: "dataset-uuid",
              group: "test-group",
              datasetVersion: "1.1",
              multilingualTitle: {
                titles: [{ lang: "en", title: "Salmon dataset" }]
              }
            }
          },
          type: "data-export"
        }
      ],
      { apiBaseUrl: "/dina-export-api" }
    );
  });

  it("disables export when the query has no matching records", () => {
    const wrapper = mountWithAppContext(
      <DatasetExportForm
        dataset={TEST_DATASET}
        definition={DATASET_EXPORT_DEFINITIONS.DWCA}
        query={TEST_QUERY}
        totalRecords={0}
      />,
      { apiContext }
    );

    expect(
      wrapper.getByRole("button", { name: /request export/i })
    ).toBeDisabled();
  });

  it("uses the selected export definition for request type and source", async () => {
    const wrapper = mountWithAppContext(
      <DatasetExportForm
        dataset={TEST_DATASET}
        definition={{
          exportType: "TABULAR_DATA",
          source: "alternate_source",
          indexName: "alternate_index"
        }}
        query={TEST_QUERY}
        totalRecords={5}
      />,
      { apiContext }
    );

    await userEvent.type(
      wrapper.getByRole("textbox", { name: /export name/i }),
      "Alternate export"
    );
    await userEvent.click(
      wrapper.getByRole("button", { name: /request export/i })
    );

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledWith(
        [
          {
            resource: expect.objectContaining({
              exportType: "TABULAR_DATA",
              source: "alternate_source"
            }),
            type: "data-export"
          }
        ],
        { apiBaseUrl: "/dina-export-api" }
      );
    });
  });

  it("rejects names longer than 100 characters", async () => {
    const wrapper = mountWithAppContext(
      <DatasetExportForm
        dataset={TEST_DATASET}
        definition={DATASET_EXPORT_DEFINITIONS.DWCA}
        query={TEST_QUERY}
        totalRecords={5}
      />,
      { apiContext }
    );

    await userEvent.type(
      wrapper.getByRole("textbox", { name: /export name/i }),
      "a".repeat(101)
    );
    await userEvent.click(
      wrapper.getByRole("button", { name: /request export/i })
    );

    expect(mockSave).not.toHaveBeenCalled();
    expect(
      await wrapper.findByText(/100 characters/i, {
        selector: ".invalid-feedback"
      })
    ).toBeInTheDocument();
  });
});
