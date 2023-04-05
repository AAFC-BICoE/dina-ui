import { PersistedResource } from "kitsu";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { Metadata } from "../../../../types/objectstore-api";
import { MetadataPreview } from "../MetadataPreview";

const TEST_METADATA: PersistedResource<Metadata> = {
  acTags: ["tag1", "tag2"],
  bucket: "testbucket",
  dcType: "Image",
  fileExtension: ".png",
  fileIdentifier: "cf99c285-0353-4fed-a15d-ac963e0514f3",
  id: "232eda40-dc97-4255-91c4-f30485e2c707",
  managedAttributes: {
    "0763db31-a0c9-43f8-b7fc-705a783c35df": "attr1 value",
    "e5b9765e-1246-4119-b4e4-8d2267175662": "attr2 value"
  },
  type: "metadata"
};

const TEST_MANAGED_ATTRIBUTES = [
  {
    id: "2c854835-f5b0-4258-8475-16c986810083",
    type: "managed-attribute",
    name: "attr1 value",
    key: "0763db31-a0c9-43f8-b7fc-705a783c35df"
  },
  {
    id: "f04cff05-50d8-4544-a620-30993ed44736",
    type: "managed-attribute",
    name: "attr2 value",
    key: "e5b9765e-1246-4119-b4e4-8d2267175662"
  }
];

const mockBulkGet = jest.fn(async (paths) =>
  paths.map((path) => {
    switch (path) {
      case "object-upload/cf99c285-0353-4fed-a15d-ac963e0514f3":
        return {
          id: "cf99c285-0353-4fed-a15d-ac963e0514f3",
          type: "object-upload",
          exif: {
            Flash: "Flash did not fire"
          }
        };
    }
  })
);

const mockGet = jest.fn(async (path) => {
  if (path.startsWith("objectstore-api/managed-attribute"))
    return { data: TEST_MANAGED_ATTRIBUTES };
  else return { data: TEST_METADATA };
});
const apiContext: any = { apiClient: { get: mockGet }, bulkGet: mockBulkGet };

describe("MetadataPreview component", () => {
  it("Renders the metadata preview", async () => {
    const wrapper = mountWithAppContext(
      <MetadataPreview metadataId="232eda40-dc97-4255-91c4-f30485e2c707" />,
      { apiContext }
    );

    await new Promise(setImmediate);
    wrapper.update();

    // There should be a link to single-edit a Metadata:
    expect(wrapper.find("a.metadata-edit-link").prop("href")).toEqual(
      "/object-store/metadata/edit?id=232eda40-dc97-4255-91c4-f30485e2c707"
    );

    // Shows the EXIF data:
    expect(wrapper.contains("Flash did not fire")).toEqual(true);
  });
});
