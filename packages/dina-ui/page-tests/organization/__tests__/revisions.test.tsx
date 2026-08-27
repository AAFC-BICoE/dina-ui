import { mountWithAppContext, waitForLoadingToDisappear } from "common-ui";
import OrganizationRevisionListPage from "../../../pages/organization/revisions";
import "@testing-library/jest-dom";
import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const TEST_SNAPSHOTS = [
  {
    instanceId: "organization/471bf855-f5da-492a-a58e-922238e5a257",
    version: 2,
    snapshotType: "UPDATE",
    changedProperties: ["names"],
    state: {
      names: [
        {
          typeName: "ca.gc.aafc.agent.api.entities.OrganizationName",
          ownerId: {
            typeName: "organization",
            cdoId: "471bf855-f5da-492a-a58e-922238e5a257"
          },
          fragment: "names/0"
        },
        {
          typeName: "ca.gc.aafc.agent.api.entities.OrganizationName",
          ownerId: {
            typeName: "organization",
            cdoId: "471bf855-f5da-492a-a58e-922238e5a257"
          },
          fragment: "names/1"
        }
      ]
    },
    author: "user2"
  },
  {
    instanceId: "organization/471bf855-f5da-492a-a58e-922238e5a257",
    version: 1,
    snapshotType: "INITIAL",
    changedProperties: ["names"],
    state: {
      names: [
        { languageCode: "en", name: "Agriculture and Agri-Food Canada" },
        { languageCode: "fr", name: "Agriculture et Agroalimentaire Canada" }
      ]
    },
    author: "user1"
  }
];

const mockGet = jest.fn(async (path, params) => {
  if (path === "agent-api/organization/471bf855-f5da-492a-a58e-922238e5a257") {
    return {
      data: {
        id: "471bf855-f5da-492a-a58e-922238e5a257",
        type: "organization",
        names: [
          { languageCode: "en", name: "Agriculture and Agri-Food Canada" },
          { languageCode: "fr", name: "Agriculture et Agroalimentaire Canada" }
        ]
      }
    };
  }
  if (path === "agent-api/audit-snapshot") {
    if (
      params?.filter?.instanceId ===
      "organization/471bf855-f5da-492a-a58e-922238e5a257#names/0"
    ) {
      return {
        data: [
          {
            state: {
              languageCode: "en",
              name: "Agriculture and Agri-Food Canada"
            }
          }
        ]
      };
    }
    if (
      params?.filter?.instanceId ===
      "organization/471bf855-f5da-492a-a58e-922238e5a257#names/1"
    ) {
      return {
        data: [
          {
            state: {
              languageCode: "fr",
              name: "Agriculture et Agroalimentaire Canada"
            }
          }
        ]
      };
    }
    return {
      data: TEST_SNAPSHOTS
    };
  }
});

jest.mock("next/router", () => ({
  useRouter: () => ({ query: { id: "471bf855-f5da-492a-a58e-922238e5a257" } })
}));

describe("OrganizationRevisionListPage", () => {
  it("Renders the page and shows simplified names.", async () => {
    const wrapper = mountWithAppContext(<OrganizationRevisionListPage />, {
      apiContext: { apiClient: { get: mockGet } as any }
    });

    await waitForLoadingToDisappear();

    // Renders the title:
    await waitFor(() => {
      expect(
        wrapper.getByRole("heading", {
          name: /revisions for Agriculture and Agri-Food Canada/i
        })
      ).toBeInTheDocument();

      // Renders the 2 revision rows:
      expect(wrapper.getByRole("cell", { name: "1" })).toBeInTheDocument();
      expect(wrapper.getByRole("cell", { name: "2" })).toBeInTheDocument();
    });

    // Expand the first row (version 2)
    const showChangesButtons = wrapper.getAllByRole("button", {
      name: /show changes/i
    });
    await userEvent.click(showChangesButtons[0]);

    // Check that names and language badges are rendered
    await waitFor(() => {
      expect(
        wrapper.getAllByText("Agriculture and Agri-Food Canada")[0]
      ).toBeInTheDocument();
      expect(
        wrapper.getAllByText("Agriculture et Agroalimentaire Canada")[0]
      ).toBeInTheDocument();
      expect(wrapper.getAllByText("English")[0]).toBeInTheDocument();
      expect(wrapper.getAllByText("French")[0]).toBeInTheDocument();
    });
  });
});
