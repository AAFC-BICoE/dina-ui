import { waitForElementToBeRemoved } from "@testing-library/react";
import { mountWithAppContext } from "common-ui";
import { FileView } from "../FileView";
import "@testing-library/jest-dom";

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

  it("Links to the image viewer page.", async () => {
    const wrapper = mountWithAppContext(
      <FileView
        filePath="/objectstore-api/file/bucket/0198a952-20e2-7f25-b8c7-a2ef0aa1f183"
        fileType="png"
      />,
      { apiContext }
    );

    // Wait for loading to be finished...
    await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));

    const link = document.querySelector(".file-viewer-wrapper a");
    expect(link?.getAttribute("href")).toBe(
      "/object-store/object/image-view?id=0198a952-20e2-7f25-b8c7-a2ef0aa1f183&bucket=bucket"
    );
  });

  it("Links to the image viewer page for derivatives.", async () => {
    const wrapper = mountWithAppContext(
      <FileView
        filePath="/objectstore-api/file/bucket/0198a952-20e2-7f25-b8c7-a2ef0aa1f183"
        fileType="png"
      />,
      { apiContext }
    );

    // Wait for loading to be finished...
    await waitForElementToBeRemoved(wrapper.getByText(/loading\.\.\./i));

    const link = document.querySelector(".file-viewer-wrapper a");
    expect(link?.getAttribute("href")).toBe(
      "/object-store/object/image-view?id=0198a952-20e2-7f25-b8c7-a2ef0aa1f183&bucket=bucket"
    );
  });

  const noPreviewFileTypes = [
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
