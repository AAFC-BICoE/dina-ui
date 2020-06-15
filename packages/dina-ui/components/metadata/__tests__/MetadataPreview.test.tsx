import { PersistedResource } from "kitsu";
import Link from "next/link";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import { Metadata } from "../../../types/objectstore-api";
import { MetadataPreview } from "../MetadataPreview";

const TEST_METADATA: PersistedResource<Metadata> = {
  acTags: ["tag1", "tag2"],
  bucket: "testbucket",
  dcType: "Image",
  fileExtension: ".png",
  fileIdentifier: "cf99c285-0353-4fed-a15d-ac963e0514f3",
  id: "232eda40-dc97-4255-91c4-f30485e2c707",
  type: "metadata"
};

const mockGet = jest.fn(async () => ({ data: TEST_METADATA }));
const apiContext: any = { apiClient: { get: mockGet } };

describe("MetadataPreview component", () => {
  it("Renders the metadata preview", async () => {
    const wrapper = mountWithAppContext(
      <MetadataPreview metadataId="232eda40-dc97-4255-91c4-f30485e2c707" />,
      { apiContext }
    );

    await new Promise(setImmediate);
    wrapper.update();

    expect(
      wrapper
        .find(".metadata-edit-link")
        .find(Link)
        .prop("href")
    ).toEqual(
      "/object-store/metadata/edit?ids=232eda40-dc97-4255-91c4-f30485e2c707"
    );
  });
});
