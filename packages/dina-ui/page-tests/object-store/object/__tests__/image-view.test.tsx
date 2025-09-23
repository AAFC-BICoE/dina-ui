import ImageViewer from "../../../../pages/object-store/object/image-view";
import { useRouter } from "next/router";
import { mountWithAppContext, waitForLoadingToDisappear } from "common-ui";
import "@testing-library/jest-dom";
import { waitFor } from "@testing-library/dom";

// Mock next/router
jest.mock("next/router", () => ({
  useRouter: jest.fn()
}));

const mockGet = jest.fn<any, any>(async (path, params) => {
  switch (path) {
    // Successful object-upload cases
    case "objectstore-api/object-upload/success-regular":
      return {
        data: {
          id: "success-regular",
          type: "object-upload",
          isDerivative: false,
          bucket: "test-bucket"
        }
      };

    // For blob loading failure test - object-upload succeeds
    case "objectstore-api/object-upload/blob-failure":
      return {
        data: {
          id: "blob-failure",
          type: "object-upload",
          isDerivative: false,
          bucket: "test-bucket"
        }
      };

    // Failed object-upload cases - these will trigger derivative fallback
    case "objectstore-api/object-upload/fallback-to-derivative":
    case "objectstore-api/object-upload/complete-failure":
      throw new Error("Object upload not found");

    // Loading case
    case "objectstore-api/object-upload/loading":
      return new Promise(() => {});

    // Derivative fallback cases
    case "objectstore-api/derivative":
      const fileIdentifierValue = params?.filter?.fileIdentifier?.EQ;

      if (fileIdentifierValue === "fallback-to-derivative") {
        return {
          data: [
            {
              id: "derivative-1",
              type: "derivative",
              bucket: "fallback-bucket"
            }
          ],
          meta: { totalResourceCount: 1 }
        };
      }
      if (fileIdentifierValue === "complete-failure") {
        throw new Error("Derivative not found");
      }
      return { data: [], meta: { totalResourceCount: 0 } };

    // Blob loading cases
    case "/objectstore-api/file/test-bucket/success-regular":
      if (params?.responseType === "blob") {
        const mockBlob = new Blob(["mock image data"], { type: "image/jpeg" });
        return { data: mockBlob };
      }
      return new Blob(["mock image data"], { type: "image/jpeg" });

    case "/objectstore-api/file/test-bucket/blob-failure":
      throw new Error("Blob loading failed");

    case "/objectstore-api/file/fallback-bucket/derivative/fallback-to-derivative":
      if (params?.responseType === "blob") {
        const mockBlob = new Blob(["mock fallback derivative image data"], {
          type: "image/jpeg"
        });
        return { data: mockBlob };
      }
      return new Blob(["mock fallback derivative image data"], {
        type: "image/jpeg"
      });
  }

  throw new Error(`Unmocked API call: ${path}`);
});

const mockObjectURL = "blob:mock-url-12345";
global.URL.createObjectURL = jest.fn(() => mockObjectURL);
global.URL.revokeObjectURL = jest.fn();

const testCtx = {
  apiContext: {
    apiClient: {
      get: mockGet,
      axios: { get: mockGet }
    }
  }
};

describe("ImageViewer", () => {
  const mockUseRouter = useRouter as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows spinner when object-upload is loading", async () => {
    mockUseRouter.mockReturnValue({
      query: { id: "loading" }
    });

    const wrapper = mountWithAppContext(<ImageViewer />, testCtx as any);
    expect(wrapper.getByText(/loading\.\.\./i)).toBeInTheDocument();
  });

  it("shows spinner when blob is loading", () => {
    mockUseRouter.mockReturnValue({
      query: { id: "success-regular" }
    });

    const wrapper = mountWithAppContext(<ImageViewer />, testCtx as any);
    expect(wrapper.getByText(/loading\.\.\./i)).toBeInTheDocument();
  });

  it("shows error message when both object-upload and derivative fail", async () => {
    mockUseRouter.mockReturnValue({
      query: { id: "complete-failure" }
    });

    const wrapper = mountWithAppContext(<ImageViewer />, testCtx as any);
    await waitForLoadingToDisappear();

    await waitFor(() => {
      expect(wrapper.getByText("Preview Not Available")).toBeInTheDocument();
    });
  });

  it("shows error message when blob loading fails", async () => {
    mockUseRouter.mockReturnValue({
      query: { id: "blob-failure" }
    });

    const wrapper = mountWithAppContext(<ImageViewer />, testCtx as any);
    await waitForLoadingToDisappear();

    await waitFor(
      () => {
        expect(wrapper.getByText("Preview Not Available")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it("shows image when loaded from object-upload", async () => {
    mockUseRouter.mockReturnValue({
      query: { id: "success-regular" }
    });

    const wrapper = mountWithAppContext(<ImageViewer />, testCtx as any);
    await waitForLoadingToDisappear();

    await waitFor(
      () => {
        const img = wrapper.getByRole("img");
        expect(img).toHaveAttribute("src", mockObjectURL);
        expect(img).toHaveAttribute("alt", "success-regular");
      },
      { timeout: 3000 }
    );
  });

  it("shows image when loaded from derivative fallback", async () => {
    mockUseRouter.mockReturnValue({
      query: { id: "fallback-to-derivative" }
    });

    const wrapper = mountWithAppContext(<ImageViewer />, testCtx as any);
    await waitForLoadingToDisappear();

    await waitFor(
      () => {
        const img = wrapper.getByRole("img");
        expect(img).toHaveAttribute("src", mockObjectURL);
        expect(img).toHaveAttribute("alt", "fallback-to-derivative");
      },
      { timeout: 3000 }
    );
  });

  it("makes correct API calls for successful object-upload", async () => {
    mockUseRouter.mockReturnValue({
      query: { id: "success-regular" }
    });

    mountWithAppContext(<ImageViewer />, testCtx as any);
    await waitForLoadingToDisappear();

    expect(mockGet).toHaveBeenCalledWith(
      "objectstore-api/object-upload/success-regular",
      expect.objectContaining({
        fields: { "object-upload": "isDerivative,bucket" }
      })
    );
  });

  it("makes correct API calls for derivative fallback", async () => {
    mockUseRouter.mockReturnValue({
      query: { id: "fallback-to-derivative" }
    });

    mountWithAppContext(<ImageViewer />, testCtx as any);
    await waitForLoadingToDisappear();

    expect(mockGet).toHaveBeenCalledWith(
      "objectstore-api/object-upload/fallback-to-derivative",
      expect.any(Object)
    );

    // Since the object-upload failed, then the derivative should be called.
    expect(mockGet).toHaveBeenCalledWith(
      "objectstore-api/derivative",
      expect.objectContaining({
        filter: { fileIdentifier: { EQ: "fallback-to-derivative" } },
        page: { limit: 1 }
      })
    );
  });
});
