import { mountWithAppContext, waitForLoadingToDisappear } from "common-ui";
import PersonRevisionListPage from "../../../pages/person/revisions";
import "@testing-library/jest-dom";
import { waitFor } from "@testing-library/react";

const TEST_SNAPSHOTS = [
  {
    version: 2,
    snapshotType: "UPDATE",
    changedProperties: ["email"],
    state: { displayName: "person a", email: "newemail@a.b" },
    author: "user2"
  },
  {
    version: 1,
    snapshotType: "INITIAL",
    changedProperties: ["displayName", "email"],
    state: { displayName: "person a", email: "oldemail@a.b" },
    author: "user1"
  }
];

const mockGet = jest.fn(async (path) => {
  if (path === "agent-api/person/471bf855-f5da-492a-a58e-922238e5a257") {
    return {
      data: {
        id: "471bf855-f5da-492a-a58e-922238e5a257",
        type: "person",
        displayName: "person a"
      }
    };
  }
  if (path === "agent-api/audit-snapshot") {
    return {
      data: TEST_SNAPSHOTS
    };
  }
});

jest.mock("next/router", () => ({
  useRouter: () => ({ query: { id: "471bf855-f5da-492a-a58e-922238e5a257" } })
}));

describe("PersonRevisionListPage", () => {
  it("Renders the page.", async () => {
    const wrapper = mountWithAppContext(<PersonRevisionListPage />, {
      apiContext: { apiClient: { get: mockGet } as any }
    });

    await waitForLoadingToDisappear();

    // Renders the title:
    await waitFor(() => {
      expect(
        wrapper.getByRole("heading", { name: /revisions for person a/i })
      ).toBeInTheDocument();

      // Renders the 2 revision rows:
      expect(wrapper.getByRole("cell", { name: "1" })).toBeInTheDocument();
      expect(wrapper.getByRole("cell", { name: "2" })).toBeInTheDocument();
    });
  });
});
