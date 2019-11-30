/* eslint react/prop-types: 0, jsx-a11y/label-has-for: 0 */
import { cleanup, render } from "@testing-library/react";
import MediaUploadViewPage from "../../pages/media-uploadView/uploadFile";

describe("MediaUploadView test", () => {
  let files;
  beforeEach(() => {
    files = [createFile("file1.pdf", 1111, "application/pdf")];
  });

  afterEach(cleanup);

  it("renders the root and input nodes with the necessary props", () => {
    const { container } = render(<MediaUploadViewPage />);
    const rootDiv = container.querySelector("div#dndRoot");
    expect(rootDiv).toHaveProperty("style.border-color");
    expect(rootDiv.querySelector("div.root>input")).toHaveProperty("multiple");
  });

  it("When dropped the files, page shows file names", async () => {
    const event = createDtWithFiles(files);
    const ui = <MediaUploadViewPage />;
    const { container } = render(ui);
    const dropzone = container.querySelector(".root");
    dispatchEvt(dropzone, "drop", event);
    await flushPromises(ui, container);
    expect(container.querySelector("a[href$='file1.pdf']")).toBeDefined();
  });
});

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

function dispatchEvt(node, type, data) {
  const event = new Event(type, { bubbles: true });
  Object.assign(event, data);

  event.preventDefault();
  node.dispatchEvent(event);
}

function flushPromises(ui, container) {
  return new Promise(resolve =>
    global.setImmediate(() => {
      render(ui, { container });
      resolve(container);
    })
  );
}
