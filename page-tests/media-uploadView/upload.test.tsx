/* eslint react/prop-types: 0, jsx-a11y/label-has-for: 0 */
import { render } from "@testing-library/react";
import MediaUploadView from "../../pages/media-uploadView/upload";

describe("MediaUploadView should have the styles and accepting multiple files", () => {
  describe("behavior", () => {
    it("renders the root and input nodes with the necessary props", () => {
      const { container } = render(<MediaUploadView />);
      const rootDiv = container.querySelector("div");
      expect(rootDiv).toHaveProperty("style.border-color");
      expect(rootDiv.querySelector("div.container>div input")).toHaveProperty(
        "multiple"
      );
    });
  });
});
