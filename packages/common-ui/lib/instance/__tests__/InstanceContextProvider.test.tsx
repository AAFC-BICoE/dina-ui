import "@testing-library/jest-dom";
import { render, waitFor } from "@testing-library/react";
import {
  ApiClientProvider,
  InstanceContextProvider,
  InstanceContextValue,
  mountWithAppContext,
  useInstanceContext
} from "common-ui";
import { ReactNode } from "react";

// Test component to access context values
const TestComponent = () => {
  const instanceContext = useInstanceContext();
  return (
    <div>
      <p data-testid="supportedLanguages">
        {instanceContext?.supportedLanguages}
      </p>
      <p data-testid="instanceMode">{instanceContext?.instanceMode}</p>
      <p data-testid="instanceName">{instanceContext?.instanceName}</p>
      <p data-testid="instanceBannerColor">
        {instanceContext?.instanceBannerColor}
      </p>
      <p data-testid="supportedGeographicReferences">
        {instanceContext?.supportedGeographicReferences}
      </p>
      <p data-testid="tgnSearchBaseUrl">{instanceContext?.tgnSearchBaseUrl}</p>
      <p data-testid="scientificNamesSearchEndpoint">
        {instanceContext?.scientificNamesSearchEndpoint}
      </p>
      <p data-testid="scientificNamesDatasetsEndpoint">
        {instanceContext?.scientificNamesDatasetsEndpoint}
      </p>
    </div>
  );
};

const createMockApiContext = (mockResponse: any) => ({
  apiClient: {
    get: jest.fn().mockResolvedValue(mockResponse)
  }
});

const createMockApiContextWithError = (error: any) => ({
  apiClient: {
    get: jest.fn().mockRejectedValue(error)
  }
});

const renderWithProvider = (apiContext: any) => {
  return render(
    <ApiClientProvider value={apiContext}>
      <InstanceContextProvider>
        <TestComponent />
      </InstanceContextProvider>
    </ApiClientProvider>
  );
};

/**
 * AI assisted test coverage.
 */
describe("InstanceContextProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should render with all fields from API response", async () => {
    const mockResponse = {
      "supported-languages-iso": "en,fr,es",
      "instance-mode": "production",
      "instance-name": "Test Instance",
      "instance-banner-color": "#FF5733",
      "supported-geographic-references": "TGN",
      "tgn-search-base-url": "https://tgn.example.com",
      "scientific-names-search-endpoint": "https://custom-search.example.com",
      "scientific-names-datasets-endpoint":
        "https://custom-datasets.example.com"
    };

    const apiContext = createMockApiContext(mockResponse);
    const wrapper = renderWithProvider(apiContext);

    await waitFor(() =>
      expect(apiContext.apiClient.get).toHaveBeenCalledWith(
        "/instance.json",
        {}
      )
    );

    expect(await wrapper.findByTestId("supportedLanguages")).toHaveTextContent(
      "en,fr,es"
    );
    expect(await wrapper.findByTestId("instanceMode")).toHaveTextContent(
      "production"
    );
    expect(await wrapper.findByTestId("instanceName")).toHaveTextContent(
      "Test Instance"
    );
    expect(await wrapper.findByTestId("instanceBannerColor")).toHaveTextContent(
      "#FF5733"
    );
    expect(
      await wrapper.findByTestId("supportedGeographicReferences")
    ).toHaveTextContent("TGN");
    expect(await wrapper.findByTestId("tgnSearchBaseUrl")).toHaveTextContent(
      "https://tgn.example.com"
    );
    expect(
      await wrapper.findByTestId("scientificNamesSearchEndpoint")
    ).toHaveTextContent("https://custom-search.example.com");
    expect(
      await wrapper.findByTestId("scientificNamesDatasetsEndpoint")
    ).toHaveTextContent("https://custom-datasets.example.com");
  });

  it("should use default values when API returns empty response", async () => {
    const apiContext = createMockApiContext({});
    const wrapper = renderWithProvider(apiContext);

    await waitFor(() =>
      expect(apiContext.apiClient.get).toHaveBeenCalledTimes(1)
    );

    expect(await wrapper.findByTestId("supportedLanguages")).toHaveTextContent(
      "en"
    );
    expect(await wrapper.findByTestId("instanceMode")).toHaveTextContent(
      "developer"
    );
    expect(await wrapper.findByTestId("instanceName")).toHaveTextContent(
      "AAFC"
    );
    expect(await wrapper.findByTestId("instanceBannerColor")).toHaveTextContent(
      "#38414d"
    );
    expect(
      await wrapper.findByTestId("supportedGeographicReferences")
    ).toHaveTextContent("OSM");
    expect(await wrapper.findByTestId("tgnSearchBaseUrl")).toHaveTextContent(
      ""
    );
    expect(
      await wrapper.findByTestId("scientificNamesSearchEndpoint")
    ).toHaveTextContent(
      "https://verifier.globalnames.org/api/v1/verifications/"
    );
    expect(
      await wrapper.findByTestId("scientificNamesDatasetsEndpoint")
    ).toHaveTextContent("https://verifier.globalnames.org/api/v1/data_sources");
  });

  it("should merge API values with defaults for partial response", async () => {
    const mockResponse = {
      "supported-languages-iso": "de,it",
      "instance-name": "Partial Config"
    };

    const apiContext = createMockApiContext(mockResponse);
    const wrapper = renderWithProvider(apiContext);

    await waitFor(() =>
      expect(apiContext.apiClient.get).toHaveBeenCalledTimes(1)
    );

    // Custom values
    expect(await wrapper.findByTestId("supportedLanguages")).toHaveTextContent(
      "de,it"
    );
    expect(await wrapper.findByTestId("instanceName")).toHaveTextContent(
      "Partial Config"
    );

    // Default values
    expect(await wrapper.findByTestId("instanceMode")).toHaveTextContent(
      "developer"
    );
    expect(await wrapper.findByTestId("instanceBannerColor")).toHaveTextContent(
      "#38414d"
    );
    expect(
      await wrapper.findByTestId("supportedGeographicReferences")
    ).toHaveTextContent("OSM");
  });

  it("should use defaults when API returns empty strings", async () => {
    const mockResponse = {
      "supported-languages-iso": "",
      "instance-mode": "",
      "instance-name": ""
    };

    const apiContext = createMockApiContext(mockResponse);
    const wrapper = renderWithProvider(apiContext);

    await waitFor(() =>
      expect(apiContext.apiClient.get).toHaveBeenCalledTimes(1)
    );

    // Empty strings are falsy, so defaults should be used
    expect(await wrapper.findByTestId("supportedLanguages")).toHaveTextContent(
      "en"
    );
    expect(await wrapper.findByTestId("instanceMode")).toHaveTextContent(
      "developer"
    );
    expect(await wrapper.findByTestId("instanceName")).toHaveTextContent(
      "AAFC"
    );
  });

  it("should handle API error and use default values", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error");
    const apiContext = createMockApiContextWithError(
      new Error("Network error")
    );
    const wrapper = renderWithProvider(apiContext);

    await waitFor(() =>
      expect(apiContext.apiClient.get).toHaveBeenCalledTimes(1)
    );

    // Should log error with both the message and error object
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to fetch instance config, using defaults.",
      expect.any(Error)
    );

    // Should use default values
    expect(await wrapper.findByTestId("supportedLanguages")).toHaveTextContent(
      "en"
    );
    expect(await wrapper.findByTestId("instanceMode")).toHaveTextContent(
      "developer"
    );
    expect(await wrapper.findByTestId("instanceName")).toHaveTextContent(
      "AAFC"
    );

    // Clean up
    consoleErrorSpy.mockRestore();
  });

  it("should handle API timeout error", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error");
    const apiContext = createMockApiContextWithError(new Error("Timeout"));
    const wrapper = renderWithProvider(apiContext);

    await waitFor(() =>
      expect(apiContext.apiClient.get).toHaveBeenCalledWith(
        "/instance.json",
        {}
      )
    );

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(await wrapper.findByTestId("supportedLanguages")).toHaveTextContent(
      "en"
    );
  });

  it("should only call API once on mount", async () => {
    const apiContext = createMockApiContext({
      "instance-name": "Test"
    });
    renderWithProvider(apiContext);

    await waitFor(() =>
      expect(apiContext.apiClient.get).toHaveBeenCalledTimes(1)
    );

    // Should only be called once
    expect(apiContext.apiClient.get).toHaveBeenCalledTimes(1);
  });

  it("should handle undefined context gracefully", async () => {
    const apiContext = createMockApiContext({});

    const ComponentWithConditionalRender = () => {
      const instanceContext = useInstanceContext();
      return instanceContext ? (
        <div data-testid="loaded">Loaded</div>
      ) : (
        <div data-testid="loading">Loading</div>
      );
    };

    const wrapper = mountWithAppContext(<ComponentWithConditionalRender />, {
      apiContext
    });

    // Initially context might be undefined
    const loading = wrapper.queryByTestId("loading");
    if (loading) {
      expect(loading).toBeInTheDocument();
    }

    // Wait for context to be loaded
    await waitFor(() => {
      expect(wrapper.getByTestId("loaded")).toBeInTheDocument();
    });
  });

  function MockInstanceContextProvider({ children }: { children: ReactNode }) {
    const instanceJson: InstanceContextValue = {
      supportedLanguages: "en,fr",
      instanceMode: "developer",
      instanceName: "",
      supportedGeographicReferences: ""
    };

    return (
      <InstanceContextProvider value={instanceJson}>
        {children}
      </InstanceContextProvider>
    );
  }

  it("useInstanceContext", async () => {
    // get instance context
    const DummyComponent = () => {
      const instanceContext = useInstanceContext();
      return (
        <>
          <p data-testid="supportedLanguages">
            {instanceContext?.supportedLanguages}
          </p>
          <p data-testid="instanceMode">{instanceContext?.instanceMode}</p>
        </>
      );
    };

    const component = render(
      <ApiClientProvider value={{} as any}>
        <MockInstanceContextProvider>
          <DummyComponent />
        </MockInstanceContextProvider>
      </ApiClientProvider>
    );

    const p1 = await component.findByTestId("supportedLanguages");
    expect(p1).toBeInTheDocument();
    expect(p1.textContent).toBe("en,fr");
    const p2 = await component.findByTestId("instanceMode");
    expect(p2).toBeInTheDocument();
    expect(p2.textContent).toBe("developer");
  });
});
