import {
  ImageLinkButton,
  ImageLinkButtonProps,
  IMAGE_VIEW_LINK
} from "../QueryBuilderImageLink";
import "@testing-library/jest-dom";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";

// Test coverage is AI assisted.
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

      const wrapper = mountWithAppContext(<ImageLinkButton {...props} />);

      const link = wrapper.getByRole("link", { name: /view image/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute(
        "href",
        `${IMAGE_VIEW_LINK}original-file-123`
      );
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
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

      const wrapper = mountWithAppContext(<ImageLinkButton {...props} />);
      expect(wrapper.queryByRole("link")).not.toBeInTheDocument();
    });

    it("does not render when metadata.data is undefined for ORIGINAL type", () => {
      const props: ImageLinkButtonProps = {
        imageType: "ORIGINAL",
        metadata: {}
      };

      const wrapper = mountWithAppContext(<ImageLinkButton {...props} />);
      expect(wrapper.queryByRole("link")).not.toBeInTheDocument();
    });

    it("does not render when fileExtension is a raw format for ORIGINAL type", () => {
      const props: ImageLinkButtonProps = {
        imageType: "ORIGINAL",
        metadata: {
          data: {
            attributes: {
              fileIdentifier: "original-file-123",
              fileExtension: ".cr2"
            }
          }
        }
      };

      const wrapper = mountWithAppContext(<ImageLinkButton {...props} />);
      expect(wrapper.queryByRole("link")).not.toBeInTheDocument();
    });

    it("renders link when fileExtension is not a raw format for ORIGINAL type", () => {
      const props: ImageLinkButtonProps = {
        imageType: "ORIGINAL",
        metadata: {
          data: {
            attributes: {
              fileIdentifier: "original-file-123",
              fileExtension: ".jpg"
            }
          }
        }
      };

      const wrapper = mountWithAppContext(<ImageLinkButton {...props} />);

      const link = wrapper.getByRole("link", { name: /view image/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute(
        "href",
        `${IMAGE_VIEW_LINK}original-file-123`
      );
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

      const wrapper = mountWithAppContext(<ImageLinkButton {...props} />);

      const link = wrapper.getByRole("link", { name: /view image/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute(
        "href",
        `${IMAGE_VIEW_LINK}thumbnail-file-456`
      );
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
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

      const wrapper = mountWithAppContext(<ImageLinkButton {...props} />);
      expect(wrapper.queryByRole("link")).not.toBeInTheDocument();
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

      const wrapper = mountWithAppContext(<ImageLinkButton {...props} />);
      expect(wrapper.queryByRole("link")).not.toBeInTheDocument();
    });

    it("does not render when derivatives is undefined", () => {
      const props: ImageLinkButtonProps = {
        imageType: "THUMBNAIL_IMAGE",
        metadata: {
          included: {}
        }
      };

      const wrapper = mountWithAppContext(<ImageLinkButton {...props} />);
      expect(wrapper.queryByRole("link")).not.toBeInTheDocument();
    });

    it("does not render when included is undefined", () => {
      const props: ImageLinkButtonProps = {
        imageType: "THUMBNAIL_IMAGE",
        metadata: {}
      };

      const wrapper = mountWithAppContext(<ImageLinkButton {...props} />);
      expect(wrapper.queryByRole("link")).not.toBeInTheDocument();
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

      const wrapper = mountWithAppContext(<ImageLinkButton {...props} />);
      expect(wrapper.queryByRole("link")).not.toBeInTheDocument();
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

      const wrapper = mountWithAppContext(<ImageLinkButton {...props} />);
      expect(wrapper.queryByRole("link")).not.toBeInTheDocument();
    });
  });

  describe("Edge cases", () => {
    it("handles null metadata", () => {
      const props: ImageLinkButtonProps = {
        imageType: "ORIGINAL",
        metadata: null
      };

      const wrapper = mountWithAppContext(<ImageLinkButton {...props} />);
      expect(wrapper.queryByRole("link")).not.toBeInTheDocument();
    });

    it("handles undefined metadata", () => {
      const props: ImageLinkButtonProps = {
        imageType: "ORIGINAL",
        metadata: undefined
      };

      const wrapper = mountWithAppContext(<ImageLinkButton {...props} />);
      expect(wrapper.queryByRole("link")).not.toBeInTheDocument();
    });

    it("re-renders when imageType changes", () => {
      const initialProps = {
        imageType: "ORIGINAL",
        metadata: {
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
        }
      };

      const wrapper = mountWithAppContext(
        <ImageLinkButton {...initialProps} />
      );

      expect(wrapper.getByRole("link")).toHaveAttribute(
        "href",
        `${IMAGE_VIEW_LINK}original-123`
      );

      const updatedProps = {
        ...initialProps,
        imageType: "THUMBNAIL_IMAGE"
      };

      wrapper.rerender(<ImageLinkButton {...updatedProps} />);

      expect(wrapper.getByRole("link")).toHaveAttribute(
        "href",
        `${IMAGE_VIEW_LINK}thumb-456`
      );
    });

    it("re-renders when metadata changes", () => {
      const initialProps = {
        imageType: "ORIGINAL",
        metadata: {
          data: { attributes: { fileIdentifier: "original-123" } }
        }
      };

      const wrapper = mountWithAppContext(
        <ImageLinkButton {...initialProps} />
      );

      expect(wrapper.getByRole("link")).toHaveAttribute(
        "href",
        `${IMAGE_VIEW_LINK}original-123`
      );

      const updatedProps = {
        ...initialProps,
        metadata: {
          data: { attributes: { fileIdentifier: "original-456" } }
        }
      };

      wrapper.rerender(<ImageLinkButton {...updatedProps} />);

      expect(wrapper.getByRole("link")).toHaveAttribute(
        "href",
        `${IMAGE_VIEW_LINK}original-456`
      );
    });
  });
});
