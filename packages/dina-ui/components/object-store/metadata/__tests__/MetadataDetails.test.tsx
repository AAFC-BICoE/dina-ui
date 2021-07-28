import { PersistedResource } from "kitsu";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import { Metadata } from "../../../../types/objectstore-api";
import { MetadataDetails } from "../MetadataDetails";

const TEST_METADATA: PersistedResource<Metadata> = {
  acTags: ["tag1", "tag2"],
  bucket: "testbucket",
  dcType: "Image",
  fileExtension: ".png",
  fileIdentifier: "cf99c285-0353-4fed-a15d-ac963e0514f3",
  id: "232eda40-dc97-4255-91c4-f30485e2c707",
  managedAttributeValues: {
    "0763db31-a0c9-43f8-b7fc-705a783c35df": "attr1 value",
    "e5b9765e-1246-4119-b4e4-8d2267175662": "attr2 value"
  },
  type: "metadata"
};

/** Mock Kitsu "get" method. */
const mockGet = jest.fn();

const apiContext: any = {
  apiClient: { get: mockGet }
};

describe("MetadataDetails component", () => {
  it("Renders the metadata details.", async () => {
    const wrapper = mountWithAppContext(
      <MetadataDetails metadata={TEST_METADATA} />,
      { apiContext }
    );

    await new Promise(setImmediate);
    wrapper.update();

    expect(
      wrapper.find(".metadata-tags span").map(node => node.text())
    ).toEqual(["tag1", "tag2"]);
  });

  it("Renders 'None' in the tag section when there are no tags.", async () => {
    const wrapper = mountWithAppContext(
      <MetadataDetails metadata={{ ...TEST_METADATA, acTags: [] }} />,
      { apiContext }
    );

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(".metadata-tags").text()).toEqual("None");
  });
});
