import { mountWithAppContext } from "common-ui";
import MolecularAnalysisRunViewPage from "../../../../pages/seqdb/molecular-analysis-run/view";
import "@testing-library/jest-dom";

const apiContext: any = { apiClient: {} };

jest.mock("next/router", () => ({
  useRouter: () => ({ query: { id: "100" } }),
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

  // it("Render the molecular analysis run details for generic molecular analysis", async () => {
  //   const wrapper = mountWithAppContext(<MolecularAnalysisRunViewPage />, {
  //     apiContext
  //   });

  //   // Wait for the page to load.
  //   await new Promise(setImmediate);

  //   // Expect loading spinner to not be in the UI
  //   expect(wrapper.queryByText(/loading\.\.\./i)).not.toBeInTheDocument();
  // });
});
