import { mount } from "enzyme";
import { useEffect } from "react";
import { ApiClientContext, createContextValue } from "../ApiClientContext";
import { useCacheableQueryLoader } from "../useCacheableQueryLoader";

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async (_, {}) => {
  return [];
});

// Mock Kitsu, the client class that talks to the backend.
jest.mock(
  "kitsu",
  () =>
    class {
      public get = mockGet;
    }
);

const contextValue = createContextValue();

function MockContextProvider({ children }) {
  return (
    <ApiClientContext.Provider value={contextValue}>
      {children}
    </ApiClientContext.Provider>
  );
}

describe("useCacheableQueryLoader hook", () => {
  it("Provides a function to re-use responses for duplicate HTTP requests.", async () => {
    function TestComponent() {
      const cacheableGet = useCacheableQueryLoader();
      useEffect(() => {
        (async () => {
          await Promise.all([
            // 3 of the same request
            cacheableGet("pcrPrimer", { filter: { name: "name==101F" } }),
            cacheableGet("pcrPrimer", { filter: { name: "name==101F" } }),
            cacheableGet("pcrPrimer", { filter: { name: "name==101F" } }),
            // A second unique request
            cacheableGet("region", { filter: { name: "name==101F" } })
          ]);
        })();
      }, []);
      return null;
    }

    mount(
      <MockContextProvider>
        <TestComponent />
      </MockContextProvider>
    );

    await new Promise(setImmediate);

    // Expect only the two unique requests to have been dispatched.
    expect(mockGet.mock.calls).toEqual([
      ["pcrPrimer", { filter: { name: "name==101F" } }],
      ["region", { filter: { name: "name==101F" } }]
    ]);
  });
});
