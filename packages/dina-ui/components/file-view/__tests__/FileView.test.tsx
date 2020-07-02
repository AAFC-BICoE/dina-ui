import { mountWithAppContext } from "../../../test-util/mock-app-context";
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

    // Renders the img.
    expect(wrapper.find("img").exists()).toEqual(true);

    // Includes the access token in the img src:
    expect(wrapper.find("img").prop("src")).toEqual(
      "image.png?access_token=test-token"
    );
  });

  it("Renders a pdf.", async () => {
    const wrapper = mountWithAppContext(
      <FileView filePath="doc.pdf" fileType="pdf" />
    );

    // It should just pass the file path and type to the FileViewer component.
    expect(wrapper.find("MockDynamicComponent").prop("filePath")).toEqual(
      "doc.pdf?access_token=test-token"
    );
    expect(wrapper.find("MockDynamicComponent").prop("fileType")).toEqual(
      "pdf"
    );
  });
});
