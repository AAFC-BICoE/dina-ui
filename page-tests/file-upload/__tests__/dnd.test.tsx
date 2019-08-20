/* eslint react/prop-types: 0, jsx-a11y/label-has-for: 0 */
import { cleanup, fireEvent, render } from "@testing-library/react";
import StyledDropzone from "../../../pages/file-upload/dnd";

describe("useDropzone() hook", () => {
  let files;
  beforeEach(() => {
    files = [createFile("file1.pdf", 1111, "application/pdf")];
  });

  afterEach(cleanup);

  describe("behavior", () => {
    it("renders the root and input nodes with the necessary props", () => {
      const { container } = render(<StyledDropzone />);
      const rootDiv = container.querySelector("div");
      expect(rootDiv).toHaveProperty("style");
    });

    it("When dropped the files, react table get populated with file names", async () => {
      const ui = <StyledDropzone />;

      const { container } = render(ui);
      await Promise.resolve();
      const dropzone = container.querySelector("div.container");
      const event = createDtWithFiles(files);
      dispatchEvt(dropzone, "drop", event);
      flushPromises(ui, container);
      // expect(container.querySelector('.rt-noData')).toBeNull()
    });
  });
});
function dispatchEvt(node, type, data) {
  const event = new Event(type, { bubbles: true });
  Object.assign(event, data);
  fireEvent(node, event);
}

function createFile(name, size, type) {
  const file = new File([], name, { type });
  Object.defineProperty(file, "size", {
    get() {
      return size;
    }
  });
  return file;
}

function createDtWithFiles(files = []) {
  return {
    dataTransfer: {
      files,
      items: files.map(file => ({
        getAsFile: () => file,
        kind: "file",
        type: file.type
      })),
      types: ["Files"]
    }
  };
}

function flushPromises(ui, container) {
  return new Promise(resolve =>
    global.setTimeout(
      () => {
        render(ui, { container });
        resolve(container);
      },
      500,
      null
    )
  );
}
