/* eslint react/prop-types: 0, jsx-a11y/label-has-for: 0 */
import { render } from "@testing-library/react";
import StyledDropzone from "../dnd";

describe(" Styled dropzone tests", () => {
  describe("behavior", () => {
    it("renders the root and input nodes with the necessary props", () => {
      const ui = <StyledDropzone />;
      const { container } = render(ui);
      const rootDiv = container.querySelector("div.container");
      expect(rootDiv).toHaveProperty("style.border-color");
    });
  });
});
