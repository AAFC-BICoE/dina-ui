import "@testing-library/jest-dom";
import { render, waitFor } from "@testing-library/react";
import { ApiClientProvider } from "../../api-client/ApiClientContext";
import { useInstanceContext } from "../useInstanceContext";
import { InstanceProvider } from "../InstanceContextProvider";

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
      <InstanceProvider>
        <TestComponent />
      </InstanceProvider>
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
    const { findByTestId } = renderWithProvider(apiContext);

    await waitFor(() =>
      expect(apiContext.apiClient.get).toHaveBeenCalledWith(
        "/instance.json",
        {}
      )
    );

    expect(await findByTestId("supportedLanguages")).toHaveTextContent(
      "en,fr,es"
    );
    expect(await findByTestId("instanceMode")).toHaveTextContent("production");
    expect(await findByTestId("instanceName")).toHaveTextContent(
      "Test Instance"
    );
    expect(await findByTestId("instanceBannerColor")).toHaveTextContent(
      "#FF5733"
    );
    expect(
      await findByTestId("supportedGeographicReferences")
    ).toHaveTextContent("TGN");
    expect(await findByTestId("tgnSearchBaseUrl")).toHaveTextContent(
      "https://tgn.example.com"
    );
    expect(
      await findByTestId("scientificNamesSearchEndpoint")
    ).toHaveTextContent("https://custom-search.example.com");
    expect(
      await findByTestId("scientificNamesDatasetsEndpoint")
    ).toHaveTextContent("https://custom-datasets.example.com");
  });

  it("should use default values when API returns empty response", async () => {
    const apiContext = createMockApiContext({});
    const { findByTestId } = renderWithProvider(apiContext);

    await waitFor(() =>
      expect(apiContext.apiClient.get).toHaveBeenCalledTimes(1)
    );

    expect(await findByTestId("supportedLanguages")).toHaveTextContent("en");
    expect(await findByTestId("instanceMode")).toHaveTextContent("developer");
    expect(await findByTestId("instanceName")).toHaveTextContent("AAFC");
    expect(await findByTestId("instanceBannerColor")).toHaveTextContent(
      "#38414d"
    );
    expect(
      await findByTestId("supportedGeographicReferences")
    ).toHaveTextContent("OSM");
    expect(await findByTestId("tgnSearchBaseUrl")).toHaveTextContent("");
    expect(
      await findByTestId("scientificNamesSearchEndpoint")
    ).toHaveTextContent(
      "https://verifier.globalnames.org/api/v1/verifications/"
    );
    expect(
      await findByTestId("scientificNamesDatasetsEndpoint")
    ).toHaveTextContent("https://verifier.globalnames.org/api/v1/data_sources");
  });

  it("should merge API values with defaults for partial response", async () => {
    const mockResponse = {
      "supported-languages-iso": "de,it",
      "instance-name": "Partial Config"
    };

    const apiContext = createMockApiContext(mockResponse);
    const { findByTestId } = renderWithProvider(apiContext);

    await waitFor(() =>
      expect(apiContext.apiClient.get).toHaveBeenCalledTimes(1)
    );

    // Custom values
    expect(await findByTestId("supportedLanguages")).toHaveTextContent("de,it");
    expect(await findByTestId("instanceName")).toHaveTextContent(
      "Partial Config"
    );

    // Default values
    expect(await findByTestId("instanceMode")).toHaveTextContent("developer");
    expect(await findByTestId("instanceBannerColor")).toHaveTextContent(
      "#38414d"
    );
    expect(
      await findByTestId("supportedGeographicReferences")
    ).toHaveTextContent("OSM");
  });

  it("should use defaults when API returns empty strings", async () => {
    const mockResponse = {
      "supported-languages-iso": "",
      "instance-mode": "",
      "instance-name": ""
    };

    const apiContext = createMockApiContext(mockResponse);
    const { findByTestId } = renderWithProvider(apiContext);

    await waitFor(() =>
      expect(apiContext.apiClient.get).toHaveBeenCalledTimes(1)
    );

    // Empty strings are falsy, so defaults should be used
    expect(await findByTestId("supportedLanguages")).toHaveTextContent("en");
    expect(await findByTestId("instanceMode")).toHaveTextContent("developer");
    expect(await findByTestId("instanceName")).toHaveTextContent("AAFC");
  });

  it("should handle API error and use default values", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error");
    const apiContext = createMockApiContextWithError(
      new Error("Network error")
    );
    const { findByTestId } = renderWithProvider(apiContext);

    await waitFor(() =>
      expect(apiContext.apiClient.get).toHaveBeenCalledTimes(1)
    );

    // Should log error with both the message and error object
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to fetch instance config, using defaults.",
      expect.any(Error)
    );

    // Should use default values
    expect(await findByTestId("supportedLanguages")).toHaveTextContent("en");
    expect(await findByTestId("instanceMode")).toHaveTextContent("developer");
    expect(await findByTestId("instanceName")).toHaveTextContent("AAFC");

    // Clean up
    consoleErrorSpy.mockRestore();
  });

  it("should handle API timeout error", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error");
    const apiContext = createMockApiContextWithError(new Error("Timeout"));
    const { findByTestId } = renderWithProvider(apiContext);

    await waitFor(() =>
      expect(apiContext.apiClient.get).toHaveBeenCalledWith(
        "/instance.json",
        {}
      )
    );

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(await findByTestId("supportedLanguages")).toHaveTextContent("en");
  });

  it("should only call API once on mount", async () => {
    const apiContext = createMockApiContext({
      "instance-name": "Test"
    });
    const { rerender } = renderWithProvider(apiContext);

    await waitFor(() =>
      expect(apiContext.apiClient.get).toHaveBeenCalledTimes(1)
    );

    // Rerender component
    rerender(
      <ApiClientProvider value={apiContext as any}>
        <InstanceProvider>
          <TestComponent />
        </InstanceProvider>
      </ApiClientProvider>
    );

    // Should still only be called once
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

    const { getByTestId, queryByTestId } = render(
      <ApiClientProvider value={apiContext as any}>
        <InstanceProvider>
          <ComponentWithConditionalRender />
        </InstanceProvider>
      </ApiClientProvider>
    );

    // Initially context might be undefined
    const loading = queryByTestId("loading");
    if (loading) {
      expect(loading).toBeInTheDocument();
    }

    // Wait for context to be loaded
    await waitFor(() => {
      expect(getByTestId("loaded")).toBeInTheDocument();
    });
  });
});
