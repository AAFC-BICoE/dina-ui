import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { FileView } from "../FileView";

// Mock out the FileViewer (3rd party library component) which should only be rendered in the browser.
jest.mock("next/dynamic", () => () => {
  return function MockDynamicComponent() {
    return <div>Mock dynamic component</div>;
  };
});

describe("FileView component", () => {
  it("Renders an image.", async () => {
    const wrapper = mountWithAppContext(
      <FileView filePath="image.png" fileType="png" />
    );
    await new Promise(setImmediate);
    wrapper.update();

    // Renders the img.
    expect(wrapper.find("img").exists()).toEqual(true);
  });

  it("Renders a pdf.", async () => {
    const wrapper = mountWithAppContext(
      <FileView filePath="doc.pdf" fileType="pdf" />
    );
    await new Promise(setImmediate);
    wrapper.update();
    // It should just pass the file path and type to the FileViewer component.
    expect(wrapper.find("MockDynamicComponent").prop("filePath")).toContain(
      "doc.pdf"
    );
    expect(wrapper.find("MockDynamicComponent").prop("fileType")).toEqual(
      "pdf"
    );
  });
});
