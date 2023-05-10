import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { FileView } from "../FileView";

// Mock out the FileViewer (3rd party library component) which should only be rendered in the browser.
jest.mock("next/dynamic", () => () => {
  return function MockDynamicComponent() {
    return <div>Mock dynamic component</div>;
  };
});

const MOCK_AXIOS_REPONSE = "test data";
const mockGet = jest.fn((path) => {
  if (path === "doc.pdf") {
    return {
      data: MOCK_AXIOS_REPONSE
    };
  }
});
const apiContext: any = {
  apiClient: { get: mockGet, axios: { get: mockGet } }
};

describe("FileView component", () => {
  it("Renders an image.", async () => {
    const wrapper = mountWithAppContext(
      <FileView filePath="image.png" fileType="png" />,
      { apiContext }
    );
    await new Promise(setImmediate);
    wrapper.update();

    // Renders the img.
    expect(wrapper.find("img").exists()).toEqual(true);
  });

  it("Renders a pdf.", async () => {
    const wrapper = mountWithAppContext(
      <FileView filePath="doc.pdf" fileType="pdf" />,
      { apiContext }
    );
    await new Promise(setImmediate);
    wrapper.update();
    // console.log(wrapper.debug());
    // It should just pass the file path and type to the FileViewer component.
    expect(wrapper.find("MockDynamicComponent").prop("filePath")).toContain(
      "doc.pdf"
    );
    expect(wrapper.find("MockDynamicComponent").prop("fileType")).toEqual(
      "pdf"
    );
  });
});
