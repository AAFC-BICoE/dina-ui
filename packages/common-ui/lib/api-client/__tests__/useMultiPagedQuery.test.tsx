import { waitFor } from "@testing-library/react";
import { mountWithAppContext } from "common-ui";
import { useEffect } from "react";
import { QueryConfig, useMultiPagedQuery } from "../useMultiPagedQuery";

interface TestResource {
  id: string;
  type: string;
  name: string;
}

// Mock responses for first query (5 items total)
const MOCK_QUERY1_COUNT_RESPONSE = {
  data: [],
  meta: { totalResourceCount: 5 }
};

const MOCK_QUERY1_PAGE1_RESPONSE = {
  data: [
    { id: "1", type: "resource", name: "Resource 1" },
    { id: "2", type: "resource", name: "Resource 2" },
    { id: "3", type: "resource", name: "Resource 3" }
  ],
  meta: { totalResourceCount: 5 }
};

// Mock responses for second query (3 items total)
const MOCK_QUERY2_COUNT_RESPONSE = {
  data: [],
  meta: { totalResourceCount: 3 }
};

const MOCK_QUERY2_PAGE1_RESPONSE = {
  data: [
    { id: "6", type: "resource", name: "Resource 6" },
    { id: "7", type: "resource", name: "Resource 7" },
    { id: "8", type: "resource", name: "Resource 8" }
  ],
  meta: { totalResourceCount: 3 }
};

const mockGet = jest.fn<any, any>();

interface TestComponentProps {
  queries: QueryConfig[];
  pageSize: number;
  offset: number;
  onResult?: (result: {
    data: TestResource[];
    loading: boolean;
    totalCount: number;
    error: any;
    reload: () => void;
  }) => void;
}

function TestComponent({
  queries,
  pageSize,
  offset,
  onResult
}: TestComponentProps) {
  const result = useMultiPagedQuery<TestResource>(queries, pageSize, offset);

  useEffect(() => {
    if (onResult) {
      onResult(result);
    }
  }, [result.data, result.loading, result.totalCount, result.error, onResult]);

  return null;
}

const testCtx = {
  apiContext: { apiClient: { get: mockGet } }
};

describe("useMultiPagedQuery hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Returns empty data when queries array is empty", async () => {
    const mockOnResult = jest.fn();

    mountWithAppContext(
      <TestComponent
        queries={[]}
        pageSize={10}
        offset={0}
        onResult={mockOnResult}
      />,
      testCtx
    );

    await waitFor(() => {
      expect(mockOnResult).toHaveBeenCalledWith(
        expect.objectContaining({
          data: [],
          loading: false,
          totalCount: 0,
          error: null
        })
      );
    });

    // Should not make any API calls
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("Fetches data from a single query with pagination", async () => {
    mockGet.mockImplementation(async (path, options) => {
      if (path === "resource" && options?.page?.limit === 0) {
        return MOCK_QUERY1_COUNT_RESPONSE;
      }
      if (path === "resource") {
        return MOCK_QUERY1_PAGE1_RESPONSE;
      }
    });

    const mockOnResult = jest.fn();
    const queries: QueryConfig[] = [{ path: "resource" }];

    mountWithAppContext(
      <TestComponent
        queries={queries}
        pageSize={3}
        offset={0}
        onResult={mockOnResult}
      />,
      testCtx
    );

    // Initially loading
    expect(mockOnResult).toHaveBeenCalledWith(
      expect.objectContaining({ loading: true })
    );

    await waitFor(() => {
      expect(mockOnResult).toHaveBeenCalledWith(
        expect.objectContaining({
          data: MOCK_QUERY1_PAGE1_RESPONSE.data,
          loading: false,
          totalCount: 5,
          error: null
        })
      );
    });

    // Should have made 2 API calls: 1 for count, 1 for data
    expect(mockGet).toHaveBeenCalledTimes(2);
  });

  it("Fetches data from multiple queries and combines results", async () => {
    mockGet.mockImplementation(async (path, options) => {
      if (path === "resource1" && options?.page?.limit === 0) {
        return MOCK_QUERY1_COUNT_RESPONSE;
      }
      if (path === "resource2" && options?.page?.limit === 0) {
        return MOCK_QUERY2_COUNT_RESPONSE;
      }
      if (path === "resource1") {
        return MOCK_QUERY1_PAGE1_RESPONSE;
      }
      if (path === "resource2") {
        return MOCK_QUERY2_PAGE1_RESPONSE;
      }
    });

    const mockOnResult = jest.fn();
    const queries: QueryConfig[] = [
      { path: "resource1" },
      { path: "resource2" }
    ];

    mountWithAppContext(
      <TestComponent
        queries={queries}
        pageSize={10}
        offset={0}
        onResult={mockOnResult}
      />,
      testCtx
    );

    await waitFor(() => {
      expect(mockOnResult).toHaveBeenCalledWith(
        expect.objectContaining({
          loading: false,
          totalCount: 8, // 5 + 3
          error: null
        })
      );
    });

    // Verify combined data
    const lastCall =
      mockOnResult.mock.calls[mockOnResult.mock.calls.length - 1][0];
    expect(lastCall.data).toHaveLength(6); // 3 from first + 3 from second
  });

  it("Handles pagination across multiple queries correctly", async () => {
    // Query 1 has 5 items, Query 2 has 3 items
    // Request offset 4, pageSize 3 should get: 1 from query1, 2 from query2
    mockGet.mockImplementation(async (path, options) => {
      if (path === "resource1" && options?.page?.limit === 0) {
        return MOCK_QUERY1_COUNT_RESPONSE;
      }
      if (path === "resource2" && options?.page?.limit === 0) {
        return MOCK_QUERY2_COUNT_RESPONSE;
      }
      if (path === "resource1" && options?.page?.offset === 4) {
        return {
          data: [{ id: "5", type: "resource", name: "Resource 5" }],
          meta: { totalResourceCount: 5 }
        };
      }
      if (path === "resource2" && options?.page?.limit === 2) {
        return {
          data: [
            { id: "6", type: "resource", name: "Resource 6" },
            { id: "7", type: "resource", name: "Resource 7" }
          ],
          meta: { totalResourceCount: 3 }
        };
      }
    });

    const mockOnResult = jest.fn();
    const queries: QueryConfig[] = [
      { path: "resource1" },
      { path: "resource2" }
    ];

    mountWithAppContext(
      <TestComponent
        queries={queries}
        pageSize={3}
        offset={4}
        onResult={mockOnResult}
      />,
      testCtx
    );

    await waitFor(() => {
      expect(mockOnResult).toHaveBeenCalledWith(
        expect.objectContaining({
          loading: false,
          totalCount: 8
        })
      );
    });

    const lastCall =
      mockOnResult.mock.calls[mockOnResult.mock.calls.length - 1][0];
    expect(lastCall.data).toHaveLength(3);
  });

  it("Handles errors gracefully", async () => {
    const mockError = new Error("API Error");
    mockGet.mockRejectedValue(mockError);

    const mockOnResult = jest.fn();
    const queries: QueryConfig[] = [{ path: "resource" }];

    mountWithAppContext(
      <TestComponent
        queries={queries}
        pageSize={3}
        offset={0}
        onResult={mockOnResult}
      />,
      testCtx
    );

    await waitFor(() => {
      expect(mockOnResult).toHaveBeenCalledWith(
        expect.objectContaining({
          loading: false,
          error: mockError
        })
      );
    });
  });

  it("Supports reload functionality", async () => {
    mockGet.mockImplementation(async (_path, options) => {
      if (options?.page?.limit === 0) {
        return MOCK_QUERY1_COUNT_RESPONSE;
      }
      return MOCK_QUERY1_PAGE1_RESPONSE;
    });

    let reloadFn: (() => void) | undefined;
    const mockOnResult = jest.fn((result) => {
      reloadFn = result.reload;
    });

    const queries: QueryConfig[] = [{ path: "resource" }];

    mountWithAppContext(
      <TestComponent
        queries={queries}
        pageSize={3}
        offset={0}
        onResult={mockOnResult}
      />,
      testCtx
    );

    await waitFor(() => {
      expect(mockOnResult).toHaveBeenCalledWith(
        expect.objectContaining({ loading: false })
      );
    });

    const initialCallCount = mockGet.mock.calls.length;

    // Trigger reload
    reloadFn?.();

    await waitFor(() => {
      expect(mockGet.mock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });

  it("Passes filter, sort, fields, and include options to API", async () => {
    mockGet.mockImplementation(async (_path, options) => {
      if (options?.page?.limit === 0) {
        return MOCK_QUERY1_COUNT_RESPONSE;
      }
      return MOCK_QUERY1_PAGE1_RESPONSE;
    });

    const mockOnResult = jest.fn();
    const queries: QueryConfig[] = [
      {
        path: "resource",
        filter: { name: "test" },
        sort: "-createdOn",
        fields: { resource: "name,description" },
        include: "relatedResource"
      }
    ];

    mountWithAppContext(
      <TestComponent
        queries={queries}
        pageSize={3}
        offset={0}
        onResult={mockOnResult}
      />,
      testCtx
    );

    await waitFor(() => {
      expect(mockOnResult).toHaveBeenCalledWith(
        expect.objectContaining({ loading: false })
      );
    });

    // Find the data fetch call (not the count call)
    const dataFetchCall = mockGet.mock.calls.find(
      (call) => call[1]?.page?.limit !== 0
    );

    expect(dataFetchCall).toBeDefined();
    expect(dataFetchCall?.[1]).toMatchObject({
      filter: { name: "test" },
      sort: "-createdOn",
      fields: { resource: "name,description" },
      include: "relatedResource"
    });
  });

  it("Skips queries that do not overlap with requested range", async () => {
    // Query 1 has 5 items (indices 0-4), Query 2 has 3 items (indices 5-7)
    // Request offset 5, pageSize 3 should only fetch from query 2
    mockGet.mockImplementation(async (path, options) => {
      if (path === "resource1" && options?.page?.limit === 0) {
        return MOCK_QUERY1_COUNT_RESPONSE;
      }
      if (path === "resource2" && options?.page?.limit === 0) {
        return MOCK_QUERY2_COUNT_RESPONSE;
      }
      if (path === "resource2") {
        return MOCK_QUERY2_PAGE1_RESPONSE;
      }
      // Should not reach here for resource1 data fetch
      if (path === "resource1" && options?.page?.limit !== 0) {
        throw new Error("Should not fetch data from resource1");
      }
    });

    const mockOnResult = jest.fn();
    const queries: QueryConfig[] = [
      { path: "resource1" },
      { path: "resource2" }
    ];

    mountWithAppContext(
      <TestComponent
        queries={queries}
        pageSize={3}
        offset={5}
        onResult={mockOnResult}
      />,
      testCtx
    );

    await waitFor(() => {
      expect(mockOnResult).toHaveBeenCalledWith(
        expect.objectContaining({
          loading: false,
          totalCount: 8
        })
      );
    });

    // Verify only resource2 data was fetched (count calls for both + data call for resource2)
    const dataFetchCalls = mockGet.mock.calls.filter(
      (call) => call[1]?.page?.limit !== 0
    );
    expect(dataFetchCalls).toHaveLength(1);
    expect(dataFetchCalls[0][0]).toBe("resource2");
  });

  it("Re-fetches when queries change", async () => {
    mockGet.mockImplementation(async (path, options) => {
      if (options?.page?.limit === 0) {
        return { data: [], meta: { totalResourceCount: 3 } };
      }
      return {
        data: [{ id: "1", type: "resource", name: path }],
        meta: { totalResourceCount: 3 }
      };
    });

    const mockOnResult = jest.fn();

    const { rerender } = mountWithAppContext(
      <TestComponent
        queries={[{ path: "resource1" }]}
        pageSize={3}
        offset={0}
        onResult={mockOnResult}
      />,
      testCtx
    );

    await waitFor(() => {
      expect(mockOnResult).toHaveBeenCalledWith(
        expect.objectContaining({ loading: false })
      );
    });

    const callCountAfterFirstRender = mockGet.mock.calls.length;

    // Change queries
    rerender(
      <TestComponent
        queries={[{ path: "resource2" }]}
        pageSize={3}
        offset={0}
        onResult={mockOnResult}
      />
    );

    await waitFor(() => {
      expect(mockGet.mock.calls.length).toBeGreaterThan(
        callCountAfterFirstRender
      );
    });

    // Verify the new path was called
    const lastCalls = mockGet.mock.calls.slice(callCountAfterFirstRender);
    expect(lastCalls.some((call) => call[0] === "resource2")).toBe(true);
  });

  it("Re-fetches when pageSize changes", async () => {
    mockGet.mockImplementation(async (_path, options) => {
      if (options?.page?.limit === 0) {
        return MOCK_QUERY1_COUNT_RESPONSE;
      }
      return {
        data: Array(options?.page?.limit || 0)
          .fill(null)
          .map((_, i) => ({
            id: `${i}`,
            type: "resource",
            name: `Resource ${i}`
          }))
      };
    });

    const mockOnResult = jest.fn();

    const { rerender } = mountWithAppContext(
      <TestComponent
        queries={[{ path: "resource" }]}
        pageSize={3}
        offset={0}
        onResult={mockOnResult}
      />,
      testCtx
    );

    await waitFor(() => {
      expect(mockOnResult).toHaveBeenCalledWith(
        expect.objectContaining({ loading: false })
      );
    });

    const callCountAfterFirst = mockGet.mock.calls.length;

    // Change pageSize
    rerender(
      <TestComponent
        queries={[{ path: "resource" }]}
        pageSize={5}
        offset={0}
        onResult={mockOnResult}
      />
    );

    await waitFor(() => {
      expect(mockGet.mock.calls.length).toBeGreaterThan(callCountAfterFirst);
    });
  });

  it("Returns empty data when offset is beyond total count", async () => {
    mockGet.mockImplementation(async (_path, options) => {
      if (options?.page?.limit === 0) {
        return MOCK_QUERY1_COUNT_RESPONSE; // 5 items
      }
      return MOCK_QUERY1_PAGE1_RESPONSE;
    });

    const mockOnResult = jest.fn();
    const queries: QueryConfig[] = [{ path: "resource" }];

    mountWithAppContext(
      <TestComponent
        queries={queries}
        pageSize={3}
        offset={10} // Beyond the 5 items
        onResult={mockOnResult}
      />,
      testCtx
    );

    await waitFor(() => {
      expect(mockOnResult).toHaveBeenCalledWith(
        expect.objectContaining({
          loading: false,
          data: [],
          totalCount: 5
        })
      );
    });
  });
});
