import { waitForElementToBeRemoved } from "@testing-library/react";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { FileView } from "../FileView";
import "@testing-library/jest-dom";

// Mock out the FileViewer (3rd party library component) which should only be rendered in the browser.
jest.mock("next/dynamic", () => () => {
  return function MockDynamicComponent() {
    return <div>Mock dynamic component</div>;
  };
});

const mockGet = jest.fn((path) => {
  return path;
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

    // Wait for loading to be finished...
    await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));

    // It should just render the image element.
    expect(
      wrapper.getByRole("img", { name: /file path : image\.png/i })
    ).toBeInTheDocument();
  });

  const noPreviewFileTypes = [
    "pdf",
    "doc",
    "docx",
    "ods",
    "xls",
    "xlsm",
    "xlsx",
    "csv"
  ];

  test.each(noPreviewFileTypes)(
    "No preview available for %s files",
    async (fileType) => {
      const wrapper = mountWithAppContext(
        <FileView filePath={`testFile.${fileType}`} fileType={fileType} />,
        { apiContext }
      );

      // Wait for loading to be finished...
      await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));

      // Expect "Preview not available" to be displayed.
      expect(wrapper.getByText(/preview not available/i)).toBeInTheDocument();
    }
  );
});
