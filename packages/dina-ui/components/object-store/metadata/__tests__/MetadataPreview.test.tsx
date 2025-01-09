import { PersistedResource } from "kitsu";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { Metadata } from "../../../../types/objectstore-api";
import { MetadataPreview } from "../MetadataPreview";
import { waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

const TEST_METADATA: PersistedResource<Metadata> = {
  acTags: ["tag1", "tag2"],
  bucket: "testbucket",
  dcType: "IMAGE",
  fileExtension: ".png",
  fileIdentifier: "cf99c285-0353-4fed-a15d-ac963e0514f3",
  id: "232eda40-dc97-4255-91c4-f30485e2c707",
  managedAttributes: {
    "0763db31-a0c9-43f8-b7fc-705a783c35df": "attr1 value",
    "e5b9765e-1246-4119-b4e4-8d2267175662": "attr2 value"
  },
  originalFilename: "testFileName",
  type: "metadata"
};

const TEST_MANAGED_ATTRIBUTES = [
  {
    id: "2c854835-f5b0-4258-8475-16c986810083",
    type: "managed-attribute",
    name: "attr1 name",
    key: "0763db31-a0c9-43f8-b7fc-705a783c35df"
  },
  {
    id: "f04cff05-50d8-4544-a620-30993ed44736",
    type: "managed-attribute",
    name: "attr2 name",
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

    // Wait for the loading spinner to not be visible.
    await waitFor(() => {
      expect(wrapper.queryByRole("status")).toBeNull();
    });

    const detailsButton = wrapper.getByRole("link", { name: /details page/i });
    const editButton = wrapper.getByRole("link", { name: /edit/i });
    const revisionButton = wrapper.getByRole("link", { name: /revisions/i });

    // Ensure button bar is working correctly:
    expect(detailsButton).toHaveAttribute(
      "href",
      "/object-store/object/view?id=232eda40-dc97-4255-91c4-f30485e2c707"
    );
    expect(editButton).toHaveAttribute(
      "href",
      "/object-store/metadata/edit?id=232eda40-dc97-4255-91c4-f30485e2c707"
    );
    expect(revisionButton).toHaveAttribute(
      "href",
      "/object-store/metadata/revisions?id=232eda40-dc97-4255-91c4-f30485e2c707&isExternalResourceMetadata=false"
    );

    // Ensure object details section is rendered.
    expect(
      wrapper.getByRole("cell", { name: /testfilename/i })
    ).toBeInTheDocument();

    // Ensure media section is rendered.
    expect(wrapper.getByRole("cell", { name: /\.png/i })).toBeInTheDocument();

    // Ensure Managed Attributes are loaded.
    expect(wrapper.getByText(/attr1 name/i)).toBeInTheDocument();
    expect(wrapper.getByText(/attr2 name/i)).toBeInTheDocument();
    expect(wrapper.getByText(/attr1 value/i)).toBeInTheDocument();
    expect(wrapper.getByText(/attr2 value/i)).toBeInTheDocument();

    // Ensure EXIF properties are rendered.
    expect(wrapper.getByText(/flash did not fire/i)).toBeInTheDocument();
  });
});
