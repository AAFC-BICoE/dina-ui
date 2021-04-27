import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { Metadata } from "../../../../types/objectstore-api";
import { MetadataFileView } from "../MetadataFileView";

const TEST_METADATA = {
  id: "9978066e-4367-4975-8e32-cc46068ff7f0",
  type: "metadata",
  derivatives: [],
  bucket: "dao",
  fileIdentifier: "7baa76e3-8c35-4e4a-95b2-0209268a6cc7",
  fileExtension: ".jpg"
};

const TEST_METADATA_WITH_LARGE_IMAGE_DERIVATIVE = {
  id: "9978066e-4367-4975-8e32-cc46068ff7f0",
  type: "metadata",
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
  fileExtension: ".cr2"
};

describe("MetadataFileView component", () => {
  it("Displays the LARGE_IMAGE derivative when there is one.", async () => {
    const wrapper = mountWithAppContext(
      <MetadataFileView
        metadata={TEST_METADATA_WITH_LARGE_IMAGE_DERIVATIVE as Metadata}
      />
    );

    expect(wrapper.find("img").prop("src")).toEqual(
      "/api/objectstore-api/file/dao/derivative/529755e1-7d36-478c-b29b-679385de155b?access_token=test-token"
    );
  });

  it("Displays the main Metadata's fileIdentifier by default.", async () => {
    const wrapper = mountWithAppContext(
      <MetadataFileView metadata={TEST_METADATA as Metadata} />
    );

    expect(wrapper.find("img").prop("src")).toEqual(
      "/api/objectstore-api/file/dao/7baa76e3-8c35-4e4a-95b2-0209268a6cc7?access_token=test-token"
    );
  });

  it("Displays 3 download links by default", async () => {
    const wrapper = mountWithAppContext(
      <MetadataFileView
        metadata={TEST_METADATA_WITH_LARGE_IMAGE_DERIVATIVE as Metadata}
      />
    );
    expect(wrapper.find("a").length).toBe(4);

    expect(wrapper.find("a.original").prop("href")).toEqual(
      "/api/objectstore-api/file/dao/7baa76e3-8c35-4e4a-95b2-0209268a6cc7?access_token=test-token"
    );
    expect(wrapper.find("a.thumbnail").prop("href")).toEqual(
      "/api/objectstore-api/file/dao/7baa76e3-8c35-4e4a-95b2-0209268a6cc7/thumbnail?access_token=test-token"
    );
    expect(wrapper.find("a.large").prop("href")).toEqual(
      "/api/objectstore-api/file/dao/derivative/529755e1-7d36-478c-b29b-679385de155b?access_token=test-token"
    );
  });
});
