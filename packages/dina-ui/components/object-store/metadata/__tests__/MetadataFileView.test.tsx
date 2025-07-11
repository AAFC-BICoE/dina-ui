import { mountWithAppContext } from "common-ui";
import { Metadata } from "../../../../types/objectstore-api";
import { MetadataFileView } from "../MetadataFileView";
import "@testing-library/jest-dom";
import { waitFor } from "@testing-library/react";

const TEST_METADATA = {
  id: "9978066e-4367-4975-8e32-cc46068ff7f0",
  type: "metadata",
  derivatives: [],
  bucket: "dao",
  fileIdentifier: "7baa76e3-8c35-4e4a-95b2-0209268a6cc7",
  fileExtension: ".jpg",
  acCaption: "test caption 1",
  dcType: "IMAGE"
};

const TEST_METADATA_WITH_LARGE_IMAGE_DERIVATIVE = {
  id: "9978066e-4367-4975-8e32-cc46068ff7f0",
  type: "metadata",
  acCaption: "test caption 2",
  derivatives: [
    {
      id: "1a572c4b-747b-4e80-a6ad-0755a5b5730e",
      type: "derivative",
      bucket: "dao",
      fileIdentifier: "053eb70f-da3f-4943-b9ac-72d01f0826a2",
      fileExtension: ".jpg",
      derivativeType: "THUMBNAIL_IMAGE"
    },
    {
      id: "772976f6-16aa-43a6-8a6d-0ac6f4af5cc8",
      type: "derivative",
      bucket: "dao",
      fileIdentifier: "529755e1-7d36-478c-b29b-679385de155b",
      fileExtension: ".jpg",
      derivativeType: "LARGE_IMAGE"
    }
  ],
  bucket: "dao",
  fileIdentifier: "7baa76e3-8c35-4e4a-95b2-0209268a6cc7",
  fileExtension: ".cr2",
  dcType: "IMAGE"
};
const mockGet = jest.fn((path) => {
  return path;
});
const apiContext: any = {
  apiClient: { get: mockGet, axios: { get: mockGet } }
};

describe("MetadataFileView component", () => {
  window.URL.revokeObjectURL = jest.fn();

  it("Displays the LARGE_IMAGE derivative when there is one.", async () => {
    window.URL.createObjectURL = jest.fn(
      () =>
        "/objectstore-api/file/dao/derivative/529755e1-7d36-478c-b29b-679385de155b"
    );
    const wrapper = mountWithAppContext(
      <MetadataFileView
        metadata={TEST_METADATA_WITH_LARGE_IMAGE_DERIVATIVE as Metadata}
      />,
      { apiContext }
    );

    await waitFor(() => {
      const image = wrapper.getByRole("img", { name: /test caption 2/i });
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute(
        "src",
        "/objectstore-api/file/dao/derivative/529755e1-7d36-478c-b29b-679385de155b"
      );
    });
  });

  it("Displays the main Metadata's fileIdentifier by default.", async () => {
    window.URL.createObjectURL = jest.fn(
      () => "/objectstore-api/file/dao/7baa76e3-8c35-4e4a-95b2-0209268a6cc7"
    );
    const wrapper = mountWithAppContext(
      <MetadataFileView metadata={TEST_METADATA as Metadata} />,
      { apiContext }
    );

    await waitFor(() => {
      const image = wrapper.getByRole("img", { name: /test caption 1/i });
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute(
        "src",
        "/objectstore-api/file/dao/7baa76e3-8c35-4e4a-95b2-0209268a6cc7"
      );
    });
  });

  it("Displays the shown file's type and caption.", async () => {
    const wrapper1 = mountWithAppContext(
      <MetadataFileView metadata={TEST_METADATA as Metadata} />,
      { apiContext }
    );

    await waitFor(() => {
      expect(wrapper1.getByText(/test caption 1/i)).toBeInTheDocument();
    });

    const wrapper2 = mountWithAppContext(
      <MetadataFileView
        metadata={TEST_METADATA_WITH_LARGE_IMAGE_DERIVATIVE as Metadata}
      />,
      { apiContext }
    );

    await waitFor(() => {
      expect(wrapper2.getByText(/test caption 2/i)).toBeInTheDocument();
    });
  });
});
