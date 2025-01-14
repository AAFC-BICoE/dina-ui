import { mountWithAppContext } from "common-ui";
import MolecularAnalysisRunViewPage from "../../../../pages/seqdb/molecular-analysis-run/view";
import "@testing-library/jest-dom";
import { waitForElementToBeRemoved } from "@testing-library/react";
import {
  TEST_METADATA,
  TEST_MOLECULAR_ANALYSIS_RUN,
  TEST_MOLECULAR_ANALYSIS_RUN_ID
} from "../__mocks__/MolecularAnalysisRunViewMocks";

const mockGet = jest.fn(async (path) => {
  switch (path) {
    // Molecular Analysis Run
    case "seqdb-api/molecular-analysis-run/" + TEST_MOLECULAR_ANALYSIS_RUN_ID:
      return { data: TEST_MOLECULAR_ANALYSIS_RUN };

    // Attachments
    case "objectstore-api/metadata":
    case "seqdb-api/molecular-analysis-run/" +
      TEST_MOLECULAR_ANALYSIS_RUN_ID +
      "/attachments":
      return {
        data: [TEST_METADATA]
      };

    // Blob storage
    case "":
      return {};

    default:
      return { data: [] };
  }
});

const mockBulkGet = jest.fn(async (paths) => {
  return paths.map((path: string) => {
    switch (path) {
      // Attachments
      case "metadata/7f3eccfa-3bc1-412f-9385-bb00e2319ac6?include=derivatives":
      case "metadata/7f3eccfa-3bc1-412f-9385-bb00e2319ac6?include=acMetadataCreator,derivatives":
        return TEST_METADATA;
    }
  });
});

const apiContext: any = {
  apiClient: { get: mockGet },
  bulkGet: mockBulkGet
};

jest.mock("next/router", () => ({
  useRouter: () => ({ query: { id: "b4c78082-61a8-4784-a116-8601f76c85d7" } }),
  withRouter: (fn) => fn
}));

describe("Molecular Analysis Run View", () => {
  it("Renders initially with a loading spinner.", () => {
    const wrapper = mountWithAppContext(<MolecularAnalysisRunViewPage />, {
      apiContext
    });

    // Test loading spinner to render
    expect(wrapper.getByText(/loading\.\.\./i));
  });

  it("Renders the molecular analysis run details for generic molecular analysis", async () => {
    const wrapper = mountWithAppContext(<MolecularAnalysisRunViewPage />, {
      apiContext
    });
    await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));

    // Ensure the title is displayed of the run.
    expect(wrapper.getAllByText(/run name 1/i)[0]).toBeInTheDocument();

    // Ensure attachment appears.
    expect(
      wrapper.getByRole("heading", {
        name: /sequencing run attachments \(1\)/i
      })
    ).toBeInTheDocument();
  });
});
