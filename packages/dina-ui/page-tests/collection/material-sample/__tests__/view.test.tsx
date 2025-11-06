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

const mockPost = jest.fn<any, any>(async (path) => {
  switch (path) {
    // Elastic search response with object store mock metadata data.
    case "search-api/search-ws/search":
      return {};
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
});
