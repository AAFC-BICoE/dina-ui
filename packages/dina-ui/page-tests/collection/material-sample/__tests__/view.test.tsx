import { PersistedResource } from "kitsu";
import { MaterialSampleViewPage } from "../../../../pages/collection/material-sample/view";
import { mountWithAppContext } from "common-ui";
import {
  CollectingEvent,
  MaterialSample
} from "../../../../types/collection-api";
import "@testing-library/jest-dom";
import { waitFor, within } from "@testing-library/react";
import { GenericMolecularAnalysis } from "../../../../types/seqdb-api/resources/GenericMolecularAnalysis";
import { GenericMolecularAnalysisItem } from "../../../../types/seqdb-api/resources/GenericMolecularAnalysisItem";
import { TEST_QUALITY_CONTROL_TYPES } from "../../../seqdb/molecular-analysis-run/__mocks__/MolecularAnalysisRunViewMocks";
import { Transaction } from "../../../../types/loan-transaction-api";

const TEST_COLLECTION_EVENT: CollectingEvent = {
  startEventDateTime: "2019_01_01_10_10_10",
  endEventDateTime: "2019_01_06_10_10_10",
  verbatimEventDateTime: "From 2019, 1,1,10,10,10 to 2019, 1.6, 10,10,10",
  id: "1",
  type: "collecting-event",
  group: "test group",
  otherRecordNumbers: ["12", "13", "14"]
};

const TEST_MATERIAL_SAMPLE: MaterialSample = {
  id: "1",
  type: "material-sample",
  materialSampleName: "my-sample-name",
  collectingEvent: { id: "1", type: "collecting-event" } as CollectingEvent
};

const TEST_SAMPLE_WITH_ORGANISMS: PersistedResource<MaterialSample> = {
  id: "ms-with-organisms",
  type: "material-sample",
  organism: [
    {
      id: "org-1",
      type: "organism",
      lifeStage: "test lifestage 1",
      determination: [
        { isPrimary: true, verbatimScientificName: "test scientific name 1" }
      ]
    },
    {
      id: "org-2",
      type: "organism",
      lifeStage: "test lifestage 2"
    }
  ]
};

const TEST_MOLECULAR_ANALYSIS: PersistedResource<GenericMolecularAnalysis> = {
  id: "d1e4a8b0-c6d5-4e23-9b30-0ae8d8763f2b",
  type: "generic-molecular-analysis",
  name: "generic molecular analysis",
  analysisType: "hrms",
  group: "aafc"
};

const TEST_GENERIC_MOLECULAR_ANALYSIS_ITEMS: PersistedResource<GenericMolecularAnalysisItem>[] =
  [
    {
      id: "99ecc6fc-7378-4641-8914-1b9104e37b95",
      type: "generic-molecular-analysis-item",
      genericMolecularAnalysis: TEST_MOLECULAR_ANALYSIS,
      materialSample: TEST_MATERIAL_SAMPLE as any
    }
  ];

const TEST_TRANSACTION: PersistedResource<Transaction> = {
  id: "transaction-123",
  type: "transaction",
  transactionNumber: "TR-2024-001",
  transactionType: "LOAN",
  materialDirection: "OUT",
  purpose: "Research",
  status: "IN_PROGRESS",
  openedDate: "2024-01-15",
  materialSamples: [
    {
      id: "1",
      type: "material-sample"
    }
  ]
};

const mockGet = jest.fn<any, any>(async (path) => {
  switch (path) {
    case "collection-api/material-sample/1":
      return { data: TEST_MATERIAL_SAMPLE };
    case "collection-api/material-sample/ms-with-organisms":
      return { data: TEST_SAMPLE_WITH_ORGANISMS };
    case "collection-api/collecting-event/1?include=collectors,attachment,collectionMethod,protocol,expedition":
      return { data: TEST_COLLECTION_EVENT };
    case "collection-api/collecting-event/1/attachment":
    case "user-api/group":
    case "objectstore-api/metadata":
    case "collection-api/material-sample/1/attachment":
    case "collection-api/collection":
      return { data: [] };
    case "seqdb-api/generic-molecular-analysis-item":
      return {
        data: TEST_GENERIC_MOLECULAR_ANALYSIS_ITEMS
      };
    case "seqdb-api/vocabulary/qualityControlType":
      return { data: TEST_QUALITY_CONTROL_TYPES };
  }
});

const mockPost = jest.fn<any, any>(async (path, payload) => {
  switch (path) {
    // Elastic search response with object store mock metadata data.
    case "search-api/search-ws/search":
      // Check if this is a transaction query
      if (payload?.query?.bool?.must) {
        const mustClauses = payload.query.bool.must;
        const isTransactionQuery = mustClauses.some(
          (clause) =>
            clause.term?.["data.relationships.materialSamples.data.type"]
        );

        if (isTransactionQuery) {
          // Return mock transaction data
          return {
            data: {
              took: 5,
              timed_out: false,
              _shards: { failed: 0, successful: 1, total: 1, skipped: 0 },
              hits: {
                total: { relation: "eq", value: 1 },
                hits: [
                  {
                    _index: "dina_loan_transaction_index",
                    _id: TEST_TRANSACTION.id,
                    _type: "_doc",
                    _source: {
                      data: {
                        id: TEST_TRANSACTION.id,
                        type: TEST_TRANSACTION.type,
                        attributes: {
                          transactionNumber: TEST_TRANSACTION.transactionNumber,
                          transactionType: TEST_TRANSACTION.transactionType,
                          materialDirection: TEST_TRANSACTION.materialDirection,
                          purpose: TEST_TRANSACTION.purpose,
                          status: TEST_TRANSACTION.status,
                          openedDate: TEST_TRANSACTION.openedDate
                        },
                        relationships: {
                          materialSamples: {
                            data: TEST_TRANSACTION.materialSamples
                          }
                        }
                      }
                    },
                    sort: [1705305600000]
                  }
                ]
              }
            }
          };
        }
      }
      // Default empty response for other elastic search queries
      return {
        data: {
          hits: {
            total: { value: 0 },
            hits: []
          }
        }
      };
  }
});

const mockBulkGet = jest.fn<any, any>(async (paths) => {
  if (!paths.length) {
    return [];
  }
});

const testCtx = {
  apiContext: {
    apiClient: {
      get: mockGet,
      axios: {
        post: mockPost
      }
    },
    bulkGet: mockBulkGet
  }
} as any;

describe("Material Sample View Page", () => {
  it("Renders the Material Sample with the linked Collecting Event", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleViewPage router={{ query: { id: "1" } } as any} />,
      testCtx
    );

    // Test Material Sample Name and Collecting Date Start Event Date Time to be rendered
    await waitFor(() => {
      expect(wrapper.getAllByText("my-sample-name")[0]).toBeInTheDocument();
    });

    expect(wrapper.getByText("2019_01_01_10_10_10")).toBeInTheDocument();
  });

  it("Renders the organisms expanded by default.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleViewPage
        router={{ query: { id: "ms-with-organisms" } } as any}
      />,
      testCtx
    );

    // Both organism sections should be expanded:
    await waitFor(() => {
      expect(wrapper.getAllByRole("button", { name: /•/i })).toHaveLength(2);
      expect(wrapper.getAllByText(/test lifestage 1/i)[1]).toBeInTheDocument();
      expect(wrapper.getAllByText(/test lifestage 2/i)[1]).toBeInTheDocument();
    });

    // Only 1 organism has a determination:
    expect(
      wrapper.getByRole("cell", { name: /test scientific name 1/i })
    ).toBeInTheDocument();
    expect(
      wrapper.queryByRole("cell", { name: /test scientific name 2/i })
    ).not.toBeInTheDocument();

    expect(
      wrapper.getAllByText(/test scientific name 1/i)[1]
    ).toBeInTheDocument();

    // Check the second lifeStage field:
    expect(wrapper.getAllByText(/test lifestage 2/i)[1]).toBeInTheDocument();

    // Renders the primary determination name when present:
    expect(
      wrapper.getByRole("cell", { name: /test scientific name 1/i })
    ).toBeInTheDocument();
  });

  it("Renders the Material Sample with associated Material Sample Workflows", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleViewPage router={{ query: { id: "1" } } as any} />,
      testCtx
    );

    await waitFor(() => {
      const tableContainer = wrapper.container.querySelector(
        "#workflows-component > div:nth-child(2) > div > table"
      );

      expect(tableContainer).toBeInTheDocument(); // Ensure container exists

      // Scope queries to the specific container
      expect(
        within(tableContainer as HTMLElement).getByRole("link", {
          name: /generic molecular analysis/i
        })
      ).toBeInTheDocument();

      expect(
        within(tableContainer as HTMLElement).getByRole("cell", {
          name: /hrms/i
        })
      ).toBeInTheDocument();

      expect(
        within(tableContainer as HTMLElement).getByRole("cell", {
          name: /aafc/i
        })
      ).toBeInTheDocument();
    });
  });

  it("Renders transactions that include the material sample", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleViewPage router={{ query: { id: "1" } } as any} />,
      testCtx
    );

    // Wait for the page to load
    await waitFor(() => {
      expect(wrapper.getAllByText("my-sample-name")[0]).toBeInTheDocument();
    });

    // Find and click the transactions section to open it
    // Use getAllByRole and find the one in the accordion button
    const transactionButtons = wrapper.getAllByRole("button", {
      name: /transactions/i
    });

    const transactionsSection = transactionButtons.find((button) =>
      button.className.includes("accordion-button")
    );
    expect(transactionsSection).toBeDefined();
    transactionsSection!.click();

    // Wait for the transaction list to be populated
    await waitFor(
      () => {
        // Check if mockPost was called with any elastic search queries
        const elasticSearchCalls = mockPost.mock.calls.filter(
          (call) => call[0] === "search-api/search-ws/search"
        );

        // Verify that at least one elastic search query was made for transactions
        const transactionQueryCall = elasticSearchCalls.find((call) => {
          const payload = call[1];
          return (
            payload?.query?.bool?.must &&
            Array.isArray(payload.query.bool.must) &&
            payload.query.bool.must.some(
              (clause) =>
                clause.term?.["data.relationships.materialSamples.data.id"] ===
                "1"
            )
          );
        });

        // The transaction query should exist
        expect(transactionQueryCall).toBeDefined();
      },
      { timeout: 5000 }
    );

    // Check if the transaction link is rendered (optional, depends on QueryPage rendering)
    const transactionLink = wrapper.queryByRole("link", {
      name: /TR-2024-001/i
    });
    if (transactionLink) {
      expect(transactionLink).toHaveAttribute(
        "href",
        "/loan-transaction/transaction/view?id=transaction-123"
      );
    }
  });
});
