import SystemInfoPage from "../../../pages/admin/system-info";
import { mountWithAppContext } from "common-ui";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

// Mock out the Link component, which normally fails when used outside of a Next app
jest.mock("next/link", () => () => <div />);

const mockPush = jest.fn();
jest.mock("next/router", () => ({
  useRouter: () => ({ push: mockPush })
}));

const MODULE_NAMES = [
  "Collection API",
  "User API",
  "Object Store API",
  "SeqDB API",
  "Agent API",
  "Loan Transaction API",
  "Export API",
  "Search WS API"
];

const API_ENDPOINTS = [
  "collection-api",
  "user-api",
  "objectstore-api",
  "seqdb-api",
  "agent-api",
  "loan-transaction-api",
  "dina-export-api",
  "search-api"
];

/** Mock Kitsu "get" method. */
const mockGet = jest.fn<any, any>(async (path) => {
  switch (path) {
    // Online module with all the fields provided
    case "collection-api/api-info":
      return {
        data: {
          id: "1.28",
          type: "api-info",
          messageProducer: true,
          messageConsumer: true,
          attentionRequired: false,
          moduleInfo: {
            asyncIndexing: true,
            supportedLicenses: "CC-BY-4.0"
          }
        }
      };

    // Online module that requires attention
    case "agent-api/api-info":
      return {
        data: {
          id: "0.99",
          type: "api-info",
          messageProducer: true,
          messageConsumer: false,
          attentionRequired: true
        }
      };

    // Offline module returning a structured error from the api
    case "loan-transaction-api/api-info": {
      const error: any = new Error("Request failed with status code 503");
      error.cause = {
        status: "503",
        statusText: "Service Unavailable",
        data: { error: "Service is down for maintenance" }
      };
      throw error;
    }

    // Offline module returning a structured error from the api
    case "search-api/api-info":
      return {
        data: {
          id: "0.57",
          type: "api-info",
          messageProducer: false,
          messageConsumer: false,
          attentionRequired: false,
          moduleInfo: {
            indices: {
              dina_collecting_event_index: {
                schemaVersion: "1.4",
                online: true
              },
              dina_material_sample_index: {
                schemaVersion: "2.10",
                online: false
              }
            },
            isSearchIndexReachable: true
          }
        }
      };

    // Offline module with a plain network error
    case "seqdb-api/api-info":
      throw new Error("Network Error");

    // All other modules are online with minimal info provided
    default:
      return {
        data: {
          id: "0.45",
          type: "api-info"
        }
      };
  }
});

// Mock API requests
const apiContext = {
  apiClient: { get: mockGet }
};

// The system info page is admin-only
const adminAccount = { isAdmin: true };

/**
 * Returns the api-info requests made so far. Filters out unrelated requests made by
 * the app wrapper (e.g. /instance.json).
 */
function apiInfoRequests() {
  return mockGet.mock.calls.filter(([path]) =>
    String(path).endsWith("/api-info")
  );
}

/** Returns testing-library queries scoped to a single module's card. */
function getCard(moduleName: string) {
  const card = screen.getByText(moduleName).closest(".card");
  if (!card) {
    throw new Error(`Card not found for module: ${moduleName}`);
  }
  return within(card as HTMLElement);
}

describe("System Info page", () => {
  beforeEach(() => {
    mockGet.mockClear();
    mockPush.mockClear();
  });

  it("Renders the loading indicator while the module statuses are being fetched.", async () => {
    mountWithAppContext(<SystemInfoPage />, {
      apiContext,
      accountContext: adminAccount
    });

    expect(screen.getByText(/fetching system info/i)).toBeInTheDocument();

    // The loading indicator goes away once the module statuses are fetched
    expect(await screen.findByText("Collection API")).toBeInTheDocument();
    expect(screen.queryByText(/fetching system info/i)).not.toBeInTheDocument();
  });

  it("Redirects non-admin users to the home page without requesting anything.", async () => {
    // The default mock account context is a non-admin user
    mountWithAppContext(<SystemInfoPage />, { apiContext });

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/"));

    // Nothing should be rendered and no api-info requests should be made
    expect(screen.queryByRole("main")).not.toBeInTheDocument();
    expect(apiInfoRequests()).toHaveLength(0);
  });

  it("Renders a status card for each configured module.", async () => {
    mountWithAppContext(<SystemInfoPage />, {
      apiContext,
      accountContext: adminAccount
    });

    // Page title
    expect(
      await screen.findByRole("heading", { name: /system information/i })
    ).toBeInTheDocument();

    // Every module has a card
    for (const moduleName of MODULE_NAMES) {
      expect(await screen.findByText(moduleName)).toBeInTheDocument();
    }

    // One api-info request per module
    expect(apiInfoRequests()).toHaveLength(API_ENDPOINTS.length);
    for (const endpoint of API_ENDPOINTS) {
      expect(mockGet).toHaveBeenCalledWith(`${endpoint}/api-info`, {});
    }

    // 6 modules online, 2 offline
    // 1 indicies online, 1 offline
    expect(screen.getAllByText(/^online$/i)).toHaveLength(7);
    expect(screen.getAllByText(/^offline$/i)).toHaveLength(3);

    // The last refreshed time is displayed
    expect(screen.getByText(/last refreshed/i)).toBeInTheDocument();
  });

  it("Displays the details of an online module.", async () => {
    mountWithAppContext(<SystemInfoPage />, {
      apiContext,
      accountContext: adminAccount
    });
    await screen.findByText("Collection API");

    const collectionCard = getCard("Collection API");

    // Version and endpoint
    expect(collectionCard.getByText("1.28")).toBeInTheDocument();
    expect(
      collectionCard.getByText(
        (_, element) =>
          element?.tagName === "CODE" &&
          element?.textContent === "/api/collection-api/"
      )
    ).toBeInTheDocument();

    // Message producer and consumer are both enabled
    expect(
      collectionCard.getAllByText(/^enabled$/i).length
    ).toBeGreaterThanOrEqual(2);

    // Module info table is rendered with the extra info
    expect(collectionCard.getByText(/module info/i)).toBeInTheDocument();
    expect(collectionCard.getByText("asyncIndexing")).toBeInTheDocument();
    expect(collectionCard.getByText("supportedLicenses")).toBeInTheDocument();
    expect(collectionCard.getByText("CC-BY-4.0")).toBeInTheDocument();

    // Attention required badge only shows on modules that need attention
    expect(
      collectionCard.queryByText(/attention required/i)
    ).not.toBeInTheDocument();
    const agentCard = getCard("Agent API");
    expect(agentCard.getByText(/attention required/i)).toBeInTheDocument();

    // Producer / consumer flags missing from the response default to disabled
    const userCard = getCard("User API");
    expect(userCard.getAllByText(/^disabled$/i)).toHaveLength(2);
  });

  it("Displays the error details of an offline module.", async () => {
    mountWithAppContext(<SystemInfoPage />, {
      apiContext,
      accountContext: adminAccount
    });
    await screen.findByText("Loan Transaction API");

    // Structured API error with status code and message
    const searchCard = getCard("Loan Transaction API");
    expect(searchCard.getByText(/^offline$/i)).toBeInTheDocument();
    expect(searchCard.getByText(/attention required/i)).toBeInTheDocument();
    expect(searchCard.getByText(/503 Service Unavailable/)).toBeInTheDocument();
    expect(
      searchCard.getByText(/Service is down for maintenance/)
    ).toBeInTheDocument();

    // The version and producer/consumer states are unknown
    expect(searchCard.getAllByText(/^unknown$/i)).toHaveLength(3);

    // Plain network error
    const seqdbCard = getCard("SeqDB API");
    expect(seqdbCard.getByText(/Network Error/)).toBeInTheDocument();
  });

  it("Displays the request latency of each module.", async () => {
    mountWithAppContext(<SystemInfoPage />, {
      apiContext,
      accountContext: adminAccount
    });
    await screen.findByText("Collection API");

    // Every module (online or offline) displays a latency label
    expect(screen.getAllByText(/^latency$/i)).toHaveLength(MODULE_NAMES.length);

    // Every module displays a latency value in milliseconds e.g. "12 ms"
    const latencyValues = screen.getAllByText(
      (_, element) =>
        element?.tagName === "SPAN" &&
        /^\d+ ms$/.test(element?.textContent?.trim() ?? "")
    );
    expect(latencyValues).toHaveLength(MODULE_NAMES.length);
  });

  it("Displays the last refreshed time as a seconds counter.", async () => {
    mountWithAppContext(<SystemInfoPage />, {
      apiContext,
      accountContext: adminAccount
    });
    await screen.findByText("Collection API");

    // The relative time is displayed with second-level precision e.g. "0 seconds ago",
    // so the text can visibly tick between refreshes.
    const lastRefreshed = screen.getByText(/last refreshed/i).closest("div");
    expect(lastRefreshed?.textContent).toMatch(/\d+ seconds? ago/);
  });

  it("Fetches all the module statuses again when the refresh button is clicked.", async () => {
    mountWithAppContext(<SystemInfoPage />, {
      apiContext,
      accountContext: adminAccount
    });
    await screen.findByText("Collection API");
    mockGet.mockClear();

    await userEvent.click(screen.getByRole("button", { name: /refresh/i }));

    // One new api-info request per module
    await waitFor(() =>
      expect(apiInfoRequests()).toHaveLength(API_ENDPOINTS.length)
    );
    for (const endpoint of API_ENDPOINTS) {
      expect(mockGet).toHaveBeenCalledWith(`${endpoint}/api-info`, {});
    }

    // The module cards are still displayed after the refresh
    expect(await screen.findByText("Collection API")).toBeInTheDocument();
  });

  it("Displays elastic search info for the indicies.", async () => {
    mountWithAppContext(<SystemInfoPage />, {
      apiContext,
      accountContext: adminAccount
    });
    await screen.findByText("Search WS API");

    const searchCard = getCard("Search WS API");

    // Verify index names and versions render inside full-width index cards
    expect(
      await searchCard.findByText("dina_collecting_event_index")
    ).toBeVisible();
    expect(searchCard.getByText("v1.4")).toBeVisible();

    expect(searchCard.getByText("dina_material_sample_index")).toBeVisible();
    expect(searchCard.getByText("v2.10")).toBeVisible();

    // Check inner status badges for online/offline indices within the card
    const onlineBadges = searchCard.getAllByText(/^online$/i);
    const offlineBadges = searchCard.getAllByText(/^offline$/i);
    expect(onlineBadges.length).toBeGreaterThanOrEqual(1);
    expect(offlineBadges.length).toBeGreaterThanOrEqual(1);

    // Verify top-level scalar values inside moduleInfo (e.g. isSearchIndexReachable) render correctly
    expect(searchCard.getByText("isSearchIndexReachable")).toBeVisible();
    expect(searchCard.getAllByText(/^enabled$/i).length).toBeGreaterThanOrEqual(
      1
    );
  });
});
