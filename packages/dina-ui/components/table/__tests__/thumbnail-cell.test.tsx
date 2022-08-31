import { mountWithAppContext } from "../../../test-util/mock-app-context";
import { thumbnailCell } from "../thumbnail-cell";

const METADATA_RESPONSE = {
  id: "45e290e9-2be4-45a6-b95c-8d375ad77b78",
  type: "metadata",
  data: {
    attributes: {
      bucket: "aafc",
      fileIdentifier: "bd5d7e17-9fd6-4863-a0bf-8050659ab201"
    }
  }
};

describe("Thumbnail cell component", () => {
  it("Using data from the API, display the thumbnail", async () => {
    const wrapper = mountWithAppContext(
      thumbnailCell({
        bucketField: "data.attributes.bucket",
        fileIdentifierField: "data.attributes.fileIdentifier"
      }).Cell({ original: METADATA_RESPONSE })
    );

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find("img").prop("src")).toEqual(
      "/api/objectstore-api/file/aafc/bd5d7e17-9fd6-4863-a0bf-8050659ab201/thumbnail?access_token=test-token"
    );
  });
});
