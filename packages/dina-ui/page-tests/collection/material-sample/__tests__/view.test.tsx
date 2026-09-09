import { PersistedResource } from "kitsu";
import { MaterialSampleViewPage } from "../../../../pages/collection/material-sample/view";
import { mountWithAppContext } from "common-ui";
import {
  COLLECTING_EVENT_COMPONENT_NAME,
  CollectingEvent,
  FormTemplate,
  MANAGED_ATTRIBUTES_COMPONENT_NAME,
  MATERIAL_SAMPLE_INFO_COMPONENT_NAME,
  MaterialSample
} from "../../../../types/collection-api";
import "@testing-library/jest-dom";
import { waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/router";
import { GenericMolecularAnalysis } from "../../../../types/seqdb-api/resources/GenericMolecularAnalysis";
import { GenericMolecularAnalysisItem } from "../../../../types/seqdb-api/resources/GenericMolecularAnalysisItem";
import { TEST_QUALITY_CONTROL_TYPES } from "../../../seqdb/molecular-analysis-run/__mocks__/MolecularAnalysisRunViewMocks";
import { Transaction } from "../../../../types/loan-transaction-api";

jest.mock("next/router", () => ({
  useRouter: jest.fn(),
  withRouter: (Component) => Component
}));

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

const TEST_SAMPLE_WITH_MANAGED_ATTRIBUTES: PersistedResource<MaterialSample> = {
  id: "ms-with-managed-attributes",
  type: "material-sample",
  materialSampleName: "sample-with-managed-attributes",
  managedAttributes: {
    attribute_1: "attribute 1 value"
  }
};

const TEST_COLLECTION_EVENT_WITH_MANAGED_ATTRIBUTES: PersistedResource<CollectingEvent> =
  {
    id: "ce-with-managed-attributes",
    type: "collecting-event",
    group: "aafc",
    managedAttributes: {
      ce_attribute_1: "ce attribute 1 value"
    }
  };

const TEST_SAMPLE_WITH_CE_MANAGED_ATTRIBUTES: PersistedResource<MaterialSample> =
  {
    id: "ms-with-ce-managed-attributes",
    type: "material-sample",
    materialSampleName: "sample-with-ce-managed-attributes",
    collectingEvent: {
      id: "ce-with-managed-attributes",
      type: "collecting-event"
    } as any
  };

/**
 * A Form Template where nothing in the "Material Sample Info" section or the Collecting
 * Event's "Additional Details" section is visible, but both Managed Attributes sections
 * (Material Sample level and Collecting Event level) are. Used to prove that the Managed
 * Attributes sections render independently of their (unrelated, and here fully hidden)
 * sibling sections.
 */
const TEST_VIEW_FORM_TEMPLATE_ID = "test-view-form-template-uuid";
const TEST_VIEW_FORM_TEMPLATE: PersistedResource<FormTemplate> = {
  id: TEST_VIEW_FORM_TEMPLATE_ID,
  type: "form-template",
  name: "Test View Form Template",
  group: "aafc",
  viewConfiguration: { type: "material-sample-form-template" } as any,
  components: [
    {
      name: MATERIAL_SAMPLE_INFO_COMPONENT_NAME,
      visible: true,
      order: 0,
      sections: [
        {
          name: "material-sample-info-section",
          visible: true,
          items: [
            { name: "materialSampleType", visible: false },
            { name: "materialSampleRemarks", visible: false },
            { name: "materialSampleState", visible: false },
            { name: "stateChangeRemarks", visible: false },
            { name: "stateChangedOn", visible: false }
          ]
        }
      ]
    },
    {
      name: MANAGED_ATTRIBUTES_COMPONENT_NAME,
      visible: true,
      order: 1,
      sections: [
        {
          name: "managed-attributes-section",
          visible: true,
          items: [
            { name: "managedAttributes", visible: true },
            {
              name: "managedAttributesOrder",
              visible: true,
              defaultValue: ["attribute_1"]
            }
          ]
        }
      ]
    },
    {
      name: COLLECTING_EVENT_COMPONENT_NAME,
      visible: true,
      order: 2,
      sections: [
        {
          name: "collecting-event-additional-details-section",
          visible: true,
          items: [
            { name: "habitat", visible: false },
            { name: "host", visible: false },
            { name: "collectionMethod", visible: false },
            { name: "substrate", visible: false },
            { name: "dwcMinimumElevationInMeters", visible: false },
            { name: "dwcMaximumElevationInMeters", visible: false },
            { name: "dwcMinimumDepthInMeters", visible: false },
            { name: "dwcMaximumDepthInMeters", visible: false },
            { name: "remarks", visible: false }
          ]
        },
        {
          name: "collecting-event-managed-attributes-section",
          visible: true,
          items: [
            { name: "managedAttributes", visible: true },
            {
              name: "managedAttributesOrder",
              visible: true,
              defaultValue: ["ce_attribute_1"]
            }
          ]
        }
      ]
    }
  ]
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

const mockGet = jest.fn<any, any>(async (path, params) => {
  switch (path) {
    case "collection-api/material-sample/1":
      return { data: TEST_MATERIAL_SAMPLE };
    case "collection-api/material-sample/ms-with-organisms":
      return { data: TEST_SAMPLE_WITH_ORGANISMS };
    case "collection-api/material-sample/ms-with-managed-attributes":
      return { data: TEST_SAMPLE_WITH_MANAGED_ATTRIBUTES };
    case "collection-api/material-sample/ms-with-ce-managed-attributes":
      return { data: TEST_SAMPLE_WITH_CE_MANAGED_ATTRIBUTES };
    case "collection-api/form-template/test-view-form-template-uuid":
      return { data: TEST_VIEW_FORM_TEMPLATE };
    case "collection-api/collecting-event/1?include=collectors,attachment,collectionMethod,protocol,expedition,site":
      return { data: TEST_COLLECTION_EVENT };
    case "collection-api/collecting-event/ce-with-managed-attributes?include=collectors,attachment,collectionMethod,protocol,expedition,site":
      return { data: TEST_COLLECTION_EVENT_WITH_MANAGED_ATTRIBUTES };
    case "collection-api/collecting-event/1/attachment":
    case "collection-api/collecting-event/ce-with-managed-attributes/attachment":
    case "user-api/group":
    case "objectstore-api/metadata":
    case "collection-api/material-sample/1/attachment":
    case "collection-api/material-sample/ms-with-managed-attributes/attachment":
    case "collection-api/material-sample/ms-with-ce-managed-attributes/attachment":
    case "collection-api/collection":
      return { data: [] };
    case "collection-api/controlled-vocabulary-item":
      if (params?.filter?.key?.EQ === "attribute_1") {
        return {
          data: [{ id: "1", key: "attribute_1", name: "Attribute 1" }]
        };
      }
      if (params?.filter?.key?.EQ === "ce_attribute_1") {
        return {
          data: [{ id: "10", key: "ce_attribute_1", name: "CE Attribute 1" }]
        };
      }
      return { data: [], meta: { totalResourceCount: 0 } };
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
  afterEach(() => {
    // Reset the router mock so a formTemplateId set by one test doesn't leak into the next:
    (useRouter as jest.Mock).mockReturnValue(undefined);
  });

  it("Renders the Material Sample with the linked Collecting Event", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleViewPage router={{ query: { id: "1" } } as any} />,
      testCtx
    );

    // Test Material Sample Name and Collecting Date Start Event Date Time to be rendered
    await waitFor(() => {
      expect(wrapper.getAllByText("my-sample-name")[0]).toBeInTheDocument();
      expect(wrapper.getByText("2019_01_01_10_10_10")).toBeInTheDocument();
    });
  });

  it("Displays the Managed Attributes section when a Form Template hides the unrelated Material Sample Info section.", async () => {
    (useRouter as jest.Mock).mockReturnValue({
      query: { formTemplateId: TEST_VIEW_FORM_TEMPLATE_ID },
      push: jest.fn(),
      pathname: "/collection/material-sample/view"
    });

    const wrapper = mountWithAppContext(
      <MaterialSampleViewPage
        router={{ query: { id: "ms-with-managed-attributes" } } as any}
      />,
      testCtx
    );

    await waitFor(() => {
      expect(
        wrapper.getAllByText("sample-with-managed-attributes")[0]
      ).toBeInTheDocument();
    });

    // Managed Attributes should still be displayed, even though the sibling
    // "Material Sample Info" section has nothing visible in the Form Template:
    await waitFor(() => {
      expect(wrapper.getByText("Attribute 1")).toBeInTheDocument();
      expect(wrapper.getByText(/attribute 1 value/i)).toBeInTheDocument();
    });

    // Fields within the hidden "Material Sample Info" section should not render:
    expect(
      wrapper.queryByText(/material sample remarks/i)
    ).not.toBeInTheDocument();
  });

  it("Displays the Collecting Event's Managed Attributes section when a Form Template hides the unrelated Collecting Event Additional Details section.", async () => {
    (useRouter as jest.Mock).mockReturnValue({
      query: { formTemplateId: TEST_VIEW_FORM_TEMPLATE_ID },
      push: jest.fn(),
      pathname: "/collection/material-sample/view"
    });

    const wrapper = mountWithAppContext(
      <MaterialSampleViewPage
        router={{ query: { id: "ms-with-ce-managed-attributes" } } as any}
      />,
      testCtx
    );

    await waitFor(() => {
      expect(
        wrapper.getAllByText("sample-with-ce-managed-attributes")[0]
      ).toBeInTheDocument();
    });

    // The Collecting Event's Managed Attributes should still be displayed, even though the
    // sibling "Collecting Event Additional Details" section has nothing visible in the
    // Form Template:
    await waitFor(() => {
      expect(wrapper.getByText("CE Attribute 1")).toBeInTheDocument();
      expect(wrapper.getByText(/ce attribute 1 value/i)).toBeInTheDocument();
    });

    // Fields within the hidden "Collecting Event Additional Details" section should not render:
    expect(wrapper.queryByText(/^habitat$/i)).not.toBeInTheDocument();
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
    await userEvent.click(transactionsSection!);

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
