/* eslint react/prop-types: 0, jsx-a11y/label-has-for: 0 */
import { cleanup, render } from "@testing-library/react";
import MediaUploadView from "../../pages/media-uploadView/upload";

describe("MediaUploadView test", () => {
  let files;
  beforeEach(() => {
    files = [createFile("file1.pdf", 1111, "application/pdf")];
  });

  afterEach(cleanup);

  it("renders the root and input nodes with the necessary props", () => {
    const { container } = render(<MediaUploadView />);
    const rootDiv = container.querySelector("div#dndRoot");
    expect(rootDiv).toHaveProperty("style.border-color");
    expect(rootDiv.querySelector("div.container>input")).toHaveProperty(
      "multiple"
    );
  });

  it("When dropped the files, react table get populated with file names", async () => {
    const event = createDtWithFiles(files);
    const ui = <MediaUploadView />;
    const { container } = render(ui);
    const dropzone = container.querySelector(".container");
    dispatchEvt(dropzone, "drop", event);
    await flushPromises(ui, container);
    expect(
      container.querySelector("div.rt-tbody div.rt-td").innerHTML
    ).toContain("file1.pdf");
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
