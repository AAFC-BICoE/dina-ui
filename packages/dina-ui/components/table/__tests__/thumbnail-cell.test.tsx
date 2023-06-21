import { mountWithAppContext } from "../../../test-util/mock-app-context";
import { ThumbnailCell } from "../thumbnail-cell";

const METADATA_RESPONSE = {
  id: "45e290e9-2be4-45a6-b95c-8d375ad77b78",
  type: "metadata",
  data: {
    attributes: {
      bucket: "aafc"
    }
  },
  included: {
    derivative: {
      attributes: {
        derivativeType: "THUMBNAIL_IMAGE",
        fileIdentifier: "bd5d7e17-9fd6-4863-a0bf-8050659ab201"
      }
    }
  }
};
const MOCK_AXIOS_REPONSE =
  "/objectstore-api/file/aafc/derivative/bd5d7e17-9fd6-4863-a0bf-8050659ab201";
const mockGet = jest.fn((path) => {
  return path;
});
const apiContext: any = {
  apiClient: { get: mockGet, axios: { get: mockGet } }
};

describe("Thumbnail cell component", () => {
  window.URL.createObjectURL = jest.fn(() => MOCK_AXIOS_REPONSE);

  it("Using data from the API, display the thumbnail", async () => {
    const wrapper = mountWithAppContext(
      ThumbnailCell({
        bucketField: "data.attributes.bucket"
      }).Cell({ original: METADATA_RESPONSE }),
      { apiContext }
    );

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find("img").prop("src")).toEqual(MOCK_AXIOS_REPONSE);
  });
});
