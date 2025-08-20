import { render, screen } from "@testing-library/react";
import ImageViewer from "../../../../pages/object-store/object/image-view/[id]";
import { useRouter } from "next/router";
import { useBlobLoad } from "common-ui";
import "@testing-library/jest-dom";

// Mock next/router
jest.mock("next/router", () => ({
  useRouter: jest.fn()
}));

// Mock useBlobLoad
jest.mock("common-ui", () => ({
  useBlobLoad: jest.fn(),
  LoadingSpinner: ({ loading }: { loading: boolean }) =>
    loading ? <div data-testid="spinner" /> : null
}));

// Mock DinaMessage
jest.mock("../../../../intl/dina-ui-intl", () => ({
  DinaMessage: ({ id }: { id: string }) => (
    <div data-testid="dina-message">{id}</div>
  )
}));

describe("ImageViewer", () => {
  const mockUseRouter = useRouter as jest.Mock;
  const mockUseBlobLoad = useBlobLoad as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows spinner when loading", () => {
    mockUseRouter.mockReturnValue({
      query: { id: "123", bucket: "bucket1", type: undefined }
    });
    mockUseBlobLoad.mockReturnValue({
      objectUrl: null,
      error: null,
      isLoading: true
    });

    render(<ImageViewer />);
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
  });

  it("shows error message when error occurs", () => {
    mockUseRouter.mockReturnValue({
      query: { id: "123", bucket: "bucket1", type: undefined }
    });
    mockUseBlobLoad.mockReturnValue({
      objectUrl: null,
      error: "Some error",
      isLoading: false
    });

    render(<ImageViewer />);
    expect(screen.getByTestId("dina-message")).toHaveTextContent(
      "previewNotAvailable"
    );
  });

  it("shows image when loaded", () => {
    mockUseRouter.mockReturnValue({
      query: { id: "123", bucket: "bucket1", type: undefined }
    });
    mockUseBlobLoad.mockReturnValue({
      objectUrl: "http://example.com/image.jpg",
      error: null,
      isLoading: false
    });

    render(<ImageViewer />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "http://example.com/image.jpg");
    expect(img).toHaveAttribute("alt", "123");
  });

  it("uses derivative file path when type is DERIVATIVE", () => {
    mockUseRouter.mockReturnValue({
      query: { id: "abc", bucket: "bucket2", type: "DERIVATIVE" }
    });
    mockUseBlobLoad.mockReturnValue({
      objectUrl: "http://example.com/derivative.jpg",
      error: null,
      isLoading: false
    });

    render(<ImageViewer />);
    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "http://example.com/derivative.jpg"
    );
    // Check that useBlobLoad was called with the correct filePath
    expect(mockUseBlobLoad).toHaveBeenCalledWith(
      expect.objectContaining({
        filePath: "/objectstore-api/file/bucket2/derivative/abc",
        autoOpen: false,
        disabled: false
      })
    );
  });

  it("disables blob load if fileUrl is falsy", async () => {
    mockUseRouter.mockReturnValue({
      query: { id: undefined, bucket: undefined, type: undefined }
    });
    mockUseBlobLoad.mockReturnValue({
      objectUrl: null,
      error: null,
      isLoading: false
    });

    render(<ImageViewer />);
    expect(mockUseBlobLoad).toHaveBeenCalledWith(
      expect.objectContaining({
        disabled: true
      })
    );
  });
});
