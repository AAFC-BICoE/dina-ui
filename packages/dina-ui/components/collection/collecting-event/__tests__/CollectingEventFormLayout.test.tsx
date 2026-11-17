import { mountWithAppContext } from "common-ui";
import { fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import CollectingEventEditPage from "../../../../pages/collection/collecting-event/edit";

// Mock out the dynamic component, which should only be rendered in the browser
jest.mock("next/dynamic", () => () => {
  return function MockDynamicComponent() {
    return <div>Mock dynamic component</div>;
  };
});

// Mock out the Link component, which normally fails when used outside of a Next app.
jest.mock("next/link", () => ({ children }) => <div>{children}</div>);

jest.mock("next/router", () => ({
  useRouter: () => ({ push: jest.fn(), query: { id: "1" } })
}));

const COLLECTING_EVENT = {
  id: "1",
  type: "collecting-event",
  group: "aafc",
  geoReferenceAssertions: []
};

const mockGet = jest.fn<any, any>(async (path) => {
  switch (path) {
    case "collection-api/collecting-event/1?include=collectors,attachment,collectionMethod,protocol,expedition,site":
      return { data: COLLECTING_EVENT };
    case "collection-api/collecting-event":
      return {
        data: [
          {
            id: "2",
            type: "collecting-event",
            substrate: "rotten log",
            dwcRecordedBy: "Jane Doe"
          }
        ]
      };
  }
  return { data: [], meta: { totalResourceCount: 0 } };
});

// Elasticsearch fails, so the Verbatim Collectors field falls back to the JSON API backend.
const mockAxiosGet = jest.fn<any, any>(async (path) => {
  if (path === "search-api/search-ws/auto-complete") {
    throw new Error("Elasticsearch is down");
  }
  return { data: {} };
});

// Elasticsearch distinct-term searches (search-api/search-ws/search) stay pending, as in the edit page test.
const mockAxiosPost = jest.fn<any, any>(() => new Promise(() => undefined));

// Extended timeout for mounting the full edit page under load.
const PAGE_WAIT = { timeout: 10000 };

const apiContext = {
  apiClient: {
    get: mockGet,
    axios: { get: mockAxiosGet, post: mockAxiosPost, patch: jest.fn() }
  },
  bulkGet: jest.fn<any, any>(async (paths: string[]) => paths.map(() => null))
} as any;

function collectingEventSuggestionParams() {
  return mockGet.mock.calls
    .filter(([path]) => path === "collection-api/collecting-event")
    .map(([, params]) => params);
}

describe("CollectingEventFormLayout suggestions", () => {
  beforeEach(jest.clearAllMocks);

  it("Sends the Substrate suggestion filter, with the form's group, as a simple filter.", async () => {
    const wrapper = mountWithAppContext(<CollectingEventEditPage />, {
      apiContext
    });
    const substrate = await wrapper.findByRole(
      "textbox",
      { name: /substrate/i },
      PAGE_WAIT
    );

    fireEvent.focus(substrate);
    await userEvent.type(substrate, "rot");
    await waitFor(
      () =>
        expect(collectingEventSuggestionParams()).toContainEqual({
          filter: { substrate: { ILIKE: "%rot%" }, group: { EQ: "aafc" } },
          sort: "-createdOn"
        }),
      { timeout: 3000 }
    );
    await waitFor(
      () => expect(wrapper.getByText("rotten log")).toBeInTheDocument(),
      PAGE_WAIT
    );
  });

  it("Sends the Verbatim Collectors fallback filter as a simple filter when Elasticsearch fails.", async () => {
    const wrapper = mountWithAppContext(<CollectingEventEditPage />, {
      apiContext
    });
    const recordedBy = await wrapper.findByRole(
      "textbox",
      { name: /verbatim collectors/i },
      PAGE_WAIT
    );

    fireEvent.focus(recordedBy);
    await userEvent.type(recordedBy, "jan");
    await waitFor(
      () =>
        expect(collectingEventSuggestionParams()).toContainEqual({
          filter: { dwcRecordedBy: { ILIKE: "%jan%" }, group: { EQ: "aafc" } },
          sort: "-createdOn"
        }),
      { timeout: 3000 }
    );
    expect(mockAxiosGet).toHaveBeenCalledWith(
      "search-api/search-ws/auto-complete",
      expect.anything()
    );
  });
});
