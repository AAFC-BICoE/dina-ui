import CollectionDetailsPage from "../../../pages/collection/collection/view";
import { mountWithAppContext } from "common-ui";
import { Collection } from "../../../types/collection-api";
import { screen, waitFor, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom";

const TEST_COLLECTION: Collection = {
  id: "123",
  type: "collection",
  name: "test collection",
  code: "test-code",
  group: "cnc",
  institution: { id: "1", type: "institution", name: "test institution" }
};

const mockGet = jest.fn<any, any>(async (path) => {
  switch (path) {
    case "collection-api/collection/123":
      return { data: TEST_COLLECTION };
    case "user-api/group":
      return [];
  }
});

// Mock API requests:
const apiContext = {
  apiClient: { get: mockGet }
};

jest.mock("next/router", () => ({
  useRouter: () => ({ query: { id: "123" } })
}));

describe("Collection view page", () => {
  it("Renders the Collection details", async () => {
    const wrapper = mountWithAppContext(<CollectionDetailsPage />, {
      apiContext
    });

    // Wait for the page to load and check for the collection name in the .name-field
    await waitFor(() => {
      const heading = screen.getByRole("heading", {
        name: /test collection/i
      });

      expect(within(heading).getByText(/test collection/i)).toBeInTheDocument();

      expect(within(heading).getByText(/cnc/i)).toBeInTheDocument();

      expect(screen.getByText(/test\-code/i)).toBeInTheDocument();
    });
  });
});
