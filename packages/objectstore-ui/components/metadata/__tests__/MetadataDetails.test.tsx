import { PersistedResource } from "kitsu";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import { Metadata } from "../../../types/objectstore-api";
import { MetadataDetails } from "../MetadataDetails";

const TEST_METADATA: PersistedResource<Metadata> = {
  acTags: ["tag1", "tag2"],
  bucket: "testbucket",
  dcType: "Image",
  fileExtension: ".png",
  fileIdentifier: "cf99c285-0353-4fed-a15d-ac963e0514f3",
  id: "232eda40-dc97-4255-91c4-f30485e2c707",
  type: "metadata"
};

describe("MetadataDetails component", () => {
  it("Renders the metadata details.", () => {
    const wrapper = mountWithAppContext(
      <MetadataDetails metadata={TEST_METADATA} />
    );

    expect(
      wrapper.find(".metadata-tags span").map(node => node.text())
    ).toEqual(["tag1", "tag2"]);
  });

  it("Renders 'None' in the tag section when there are no tags.", () => {
    const wrapper = mountWithAppContext(
      <MetadataDetails metadata={{ ...TEST_METADATA, acTags: [] }} />
    );

    expect(wrapper.find(".metadata-tags").text()).toEqual("None");
  });
});
