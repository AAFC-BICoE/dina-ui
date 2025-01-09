import { mountWithAppContext } from "common-ui";
import GroupDetailsPage from "../../../pages/group/view";
import { waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async () => {
  return {
    data: {
      id: "cnc",
      type: "group-membership",
      managedBy: [
        {
          username: "cnc-su",
          agentId: "ba05d46b-6c75-4c92-82d6-e72237d9982f"
        }
      ]
    }
  };
});

const mockBulkGet = jest.fn(async (paths) => {
  return paths.map((path) => {
    if (path.startsWith("person")) {
      return null;
    }
    console.error("No mocked bulkGet response: ", paths);
  });
});

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => () => <div />);

// Pretend we are at the page for index set id#100
jest.mock("next/router", () => ({
  useRouter: () => ({ query: { id: "2b4549e9-9a95-489f-8e30-74c2d877d8a8" } })
}));

// Mock API requests:
const apiContext: any = {
  apiClient: { get: mockGet },
  bulkGet: mockBulkGet
};

describe("Group view page", () => {
  it("Render the group details", async () => {
    const wrapper = mountWithAppContext(<GroupDetailsPage />, {
      apiContext
    });

    // Wait for the page to load.
    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockBulkGet).toHaveBeenCalledTimes(1));
    const reactTable = await wrapper.findByTestId("ReactTable");
    expect(reactTable).toBeInTheDocument();
    expect(wrapper.queryByText("Managed By")).toBeInTheDocument();
    expect(wrapper.queryByText("Associated Agent")).toBeInTheDocument();
    expect(wrapper.queryByText("cnc-su")).toBeInTheDocument();
  });
});
