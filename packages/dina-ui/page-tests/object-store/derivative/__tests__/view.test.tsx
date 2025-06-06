import DerivativeViewPage from "../../../../pages/object-store/derivative/view";
import { mountWithAppContext } from "common-ui";
import "@testing-library/jest-dom";

const TEST_METADATA = {
  id: "dummy-metadata-id",
  type: "metadata",
  meta: {
    permissionsProvider: "DummyPermissionsProvider",
    permissions: ["permission1", "permission2", "permission3"]
  },
  derivatives: [
    {
      id: "dummy-derivative-id-1",
      type: "derivative",
      bucket: "dummy-bucket",
      fileIdentifier: "derivative-file-identifier",
      fileExtension: ".dummy1",
      dcType: "DUMMY_TYPE_1",
      dcFormat: "dummy/format1",
      acHashFunction: "DUMMY_HASH_FUNCTION_1",
      acHashValue: "dummyhashvalue12345678901",
      createdBy: "dummy-user-1",
      createdOn: "2023-01-01T00:00:00.000Z",
      derivativeType: "DUMMY_DERIVATIVE_TYPE_1",
      publiclyReleasable: null,
      acTags: ["derivative_tag_1", "derivative_tag_2"],
      objectUpload: {
        id: "derivative-file-identifier",
        type: "object-upload",
        dcType: "DUMMY_TYPE_1",
        createdBy: "dummy-user-1",
        createdOn: "2023-01-01T00:00:00.000Z",
        originalFilename: "dummyfile1.dummy",
        sha1Hex: "dummyhashvalue12345678901",
        receivedMediaType: "dummy/media-type1",
        detectedMediaType: "dummy/media-type1",
        detectedFileExtension: ".dummy1",
        evaluatedMediaType: "dummy/media-type1",
        evaluatedFileExtension: ".dummy1",
        sizeInBytes: 12345,
        bucket: "dummy-bucket",
        dateTimeDigitized: null,
        exif: {},
        isDerivative: true,
        uuid: "dummy-uuid-1"
      }
    }
  ],
  acMetadataCreator: "dummy-metadata-creator",
  createdBy: "dummy-user",
  createdOn: "2023-01-01T00:00:00.000Z",
  bucket: "dummy-bucket",
  fileIdentifier: "dummy-file-identifier",
  fileExtension: ".dummy",
  dcType: "DUMMY_TYPE",
  dcFormat: "dummy/format",
  dcRights: "Dummy Rights",
  group: "dummy-group",
  managedAttributes: {},
  orientation: null,
  originalFilename: "dummyfile.dummy",
  publiclyReleasable: true,
  resourceExternalURL: null,
  xmpMetadataDate: "2023-01-01T00:00:00.000Z",
  xmpRightsOwner: "Dummy Owner",
  xmpRightsUsageTerms: "Dummy Usage Terms",
  xmpRightsWebStatement: "https://dummy.url",
  acTags: ["metadata_tag"]
};

// Pretend the metadata id was passed in the URL:
jest.mock("next/router", () => ({
  useRouter: () => ({
    query: { id: "dummy-derivative-id-1", parentId: "dummy-metadata-id" }
  })
}));

const mockGet = jest.fn(async (path) => {
  switch (path) {
    case "objectstore-api/metadata/dummy-metadata-id":
      return { data: TEST_METADATA };
  }
});

const mockBulkGet = jest.fn(async (paths) =>
  paths.map((path) => {
    switch (path) {
      case "object-upload/dummy-file-identifier":
        return {
          id: "dummy-file-identifier",
          type: "object-upload"
        };
      case "object-upload/derivative-file-identifier":
        return {
          id: "derivative-file-identifier",
          type: "object-upload"
        };
    }
  })
);

const apiContext: any = {
  apiClient: {
    get: mockGet,
    axios: {
      get: mockGet
    }
  },
  bulkGet: mockBulkGet
};

describe("Derivative details page", () => {
  // beforeEach(() => {
  //   jest.resetAllMocks()
  // });

  it("Renders the page and the derivative's tags.", async () => {
    const wrapper = mountWithAppContext(<DerivativeViewPage />, { apiContext });

    await new Promise(setImmediate);
    await new Promise(setImmediate);

    expect(wrapper.getByText(/derivative_tag_1/i)).toBeInTheDocument();
    expect(wrapper.getByText(/derivative_tag_2/i)).toBeInTheDocument();
    expect(wrapper.getByText(/preview not available/i)).toBeInTheDocument();
  });
});
