import { render, screen } from "@testing-library/react";
import {
  ImageLinkButton,
  ImageLinkButtonProps,
  IMAGE_VIEW_LINK
} from "../QueryBuilderImageLink";
import "@testing-library/jest-dom";

// Mock the FontAwesome icon
jest.mock("react-icons/fa6", () => ({
  FaArrowUpRightFromSquare: () => <span data-testid="external-link-icon" />
}));

// Test coverage is AI generated.
describe("ImageLinkButton", () => {
  describe("ORIGINAL image type", () => {
    it("renders link when fileIdentifier exists in metadata for ORIGINAL type", () => {
      const props: ImageLinkButtonProps = {
        imageType: "ORIGINAL",
        metadata: {
          data: {
            attributes: {
              fileIdentifier: "original-file-123"
            }
          }
        }
      };

      render(<ImageLinkButton {...props} />);

      const link = screen.getByRole("link", { name: /view image/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute(
        "href",
        `${IMAGE_VIEW_LINK}original-file-123`
      );
      expect(screen.getByTestId("external-link-icon")).toBeInTheDocument();
    });

    it("does not render when fileIdentifier is missing for ORIGINAL type", () => {
      const props: ImageLinkButtonProps = {
        imageType: "ORIGINAL",
        metadata: {
          data: {
            attributes: {}
          }
        }
      };

      const { container } = render(<ImageLinkButton {...props} />);
      expect(container).toBeEmptyDOMElement();
    });

    it("does not render when metadata.data is undefined for ORIGINAL type", () => {
      const props: ImageLinkButtonProps = {
        imageType: "ORIGINAL",
        metadata: {}
      };

      const { container } = render(<ImageLinkButton {...props} />);
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("Derivative image types", () => {
    it("renders link when matching derivative exists", () => {
      const props: ImageLinkButtonProps = {
        imageType: "THUMBNAIL_IMAGE",
        metadata: {
          included: {
            derivatives: [
              {
                attributes: {
                  derivativeType: "LARGE",
                  fileIdentifier: "large-file-123"
                }
              },
              {
                attributes: {
                  derivativeType: "THUMBNAIL_IMAGE",
                  fileIdentifier: "thumbnail-file-456"
                }
              }
            ]
          }
        }
      };

      render(<ImageLinkButton {...props} />);

      const link = screen.getByRole("link", { name: /view image/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute(
        "href",
        `${IMAGE_VIEW_LINK}thumbnail-file-456`
      );
    });

    it("does not render when no matching derivative type found", () => {
      const props: ImageLinkButtonProps = {
        imageType: "MEDIUM",
        metadata: {
          included: {
            derivatives: [
              {
                attributes: {
                  derivativeType: "LARGE",
                  fileIdentifier: "large-file-123"
                }
              },
              {
                attributes: {
                  derivativeType: "THUMBNAIL_IMAGE",
                  fileIdentifier: "thumbnail-file-456"
                }
              }
            ]
          }
        }
      };

      const { container } = render(<ImageLinkButton {...props} />);
      expect(container).toBeEmptyDOMElement();
    });

    it("does not render when derivatives array is empty", () => {
      const props: ImageLinkButtonProps = {
        imageType: "THUMBNAIL_IMAGE",
        metadata: {
          included: {
            derivatives: []
          }
        }
      };

      const { container } = render(<ImageLinkButton {...props} />);
      expect(container).toBeEmptyDOMElement();
    });

    it("does not render when derivatives is undefined", () => {
      const props: ImageLinkButtonProps = {
        imageType: "THUMBNAIL_IMAGE",
        metadata: {
          included: {}
        }
      };

      const { container } = render(<ImageLinkButton {...props} />);
      expect(container).toBeEmptyDOMElement();
    });

    it("does not render when included is undefined", () => {
      const props: ImageLinkButtonProps = {
        imageType: "THUMBNAIL_IMAGE",
        metadata: {}
      };

      const { container } = render(<ImageLinkButton {...props} />);
      expect(container).toBeEmptyDOMElement();
    });

    it("does not render when derivative has no fileIdentifier", () => {
      const props: ImageLinkButtonProps = {
        imageType: "THUMBNAIL_IMAGE",
        metadata: {
          included: {
            derivatives: [
              {
                attributes: {
                  derivativeType: "THUMBNAIL_IMAGE"
                  // fileIdentifier is missing
                }
              }
            ]
          }
        }
      };

      const { container } = render(<ImageLinkButton {...props} />);
      expect(container).toBeEmptyDOMElement();
    });

    it("does not render when derivative has no attributes", () => {
      const props: ImageLinkButtonProps = {
        imageType: "THUMBNAIL_IMAGE",
        metadata: {
          included: {
            derivatives: [
              {
                // attributes is missing
              }
            ]
          }
        }
      };

      const { container } = render(<ImageLinkButton {...props} />);
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("Edge cases", () => {
    it("handles null metadata", () => {
      const props: ImageLinkButtonProps = {
        imageType: "ORIGINAL",
        metadata: null
      };

      const { container } = render(<ImageLinkButton {...props} />);
      expect(container).toBeEmptyDOMElement();
    });

    it("handles undefined metadata", () => {
      const props: ImageLinkButtonProps = {
        imageType: "ORIGINAL",
        metadata: undefined
      };

      const { container } = render(<ImageLinkButton {...props} />);
      expect(container).toBeEmptyDOMElement();
    });

    it("re-renders when imageType changes", () => {
      const { rerender } = render(
        <ImageLinkButton
          imageType="ORIGINAL"
          metadata={{
            data: { attributes: { fileIdentifier: "original-123" } },
            included: {
              derivatives: [
                {
                  attributes: {
                    derivativeType: "THUMBNAIL_IMAGE",
                    fileIdentifier: "thumb-456"
                  }
                }
              ]
            }
          }}
        />
      );

      expect(screen.getByRole("link")).toHaveAttribute(
        "href",
        `${IMAGE_VIEW_LINK}original-123`
      );

      rerender(
        <ImageLinkButton
          imageType="THUMBNAIL_IMAGE"
          metadata={{
            data: { attributes: { fileIdentifier: "original-123" } },
            included: {
              derivatives: [
                {
                  attributes: {
                    derivativeType: "THUMBNAIL_IMAGE",
                    fileIdentifier: "thumb-456"
                  }
                }
              ]
            }
          }}
        />
      );

      expect(screen.getByRole("link")).toHaveAttribute(
        "href",
        `${IMAGE_VIEW_LINK}thumb-456`
      );
    });

    it("re-renders when metadata changes", () => {
      const { rerender } = render(
        <ImageLinkButton
          imageType="ORIGINAL"
          metadata={{
            data: { attributes: { fileIdentifier: "original-123" } }
          }}
        />
      );

      expect(screen.getByRole("link")).toHaveAttribute(
        "href",
        `${IMAGE_VIEW_LINK}original-123`
      );

      rerender(
        <ImageLinkButton
          imageType="ORIGINAL"
          metadata={{
            data: { attributes: { fileIdentifier: "original-456" } }
          }}
        />
      );

      expect(screen.getByRole("link")).toHaveAttribute(
        "href",
        `${IMAGE_VIEW_LINK}original-456`
      );
    });
  });
});
