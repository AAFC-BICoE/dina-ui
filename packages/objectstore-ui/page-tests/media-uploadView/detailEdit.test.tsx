import { wait } from "@testing-library/react";
import { DetailEditPage } from "../../pages/media-uploadView/detailEdit";
import { mountWithAppContext } from "../../test-util/mock-app-context";

/** Mock next.js' router "push" function for navigating pages. */
const mockPush = jest.fn();

/** Test metadata response. */
const TEST_METADATA_RESPONSE = [
  {
    acDigitizationDate: "2019-11-25T07:30:00.175-05:00",
    acHashFunction: "SHA-1",
    acHashValue: "fa7b84eafd08fbc1f9d27a48b68d89b52a83f178",
    acMetadataCreator: {
      displayName: "Chris",
      email: "chris.gendre@canada.ca",
      id: "c1cd8a18-72d5-48a6-8e62-7e6aab6519ad",
      type: "agent"
    },
    acTags: ["765", "76757"],
    bucket: "mybucket",
    dcFormat: "image/png",
    dcType: "Image",
    fileExtension: ".png",
    fileIdentifier: "82f95aa2-a55d-4269-89bf-918963ccca1a",
    id: "203f557a-bb5b-4aec-838b-c459b246de4a",
    managedAttribute: [
      {
        assignedValue: "spiral",
        id: "20"
      }
    ],
    originalFilename: "logo_347x50_PPa11y.png",
    type: "metadata",
    xmpMetadataDate: "2019-11-25T09:00:00.064-05:00"
  }
];

/** Test managed attribute response. */
const TEST_MANAGEDDATA_RESPONSE = {
  assignedValue: "trrr",
  id: "088658de-3a09-46ff-9fb0-196ea60a36e5",
  type: "metadata-managed-attribute"
};

const TEST_AGENT_RESPONSE = [
  {
    attributes: {
      displayName: "Shemy",
      email: "shemy.gan@canada.ca"
    },
    id: "9414a706-acca-46fd-a2bc-82befb033397",
    type: "agent"
  }
];

const TEST_MANAGEDATTR_RESPONSE = [
  {
    attributes: {
      acceptedValues: null,
      managedAttributeType: "STRING",
      name: "Specimen View"
    },
    id: "3343b041-5476-4b79-be4a-6539a389f7fd",
    type: "managed-attribute"
  }
];

/** Mock axios for patch request. */
const mockPatch = jest.fn();

/** Mock axios for patch request. */
const mockPost = jest.fn();

/** Mock Kitsu "get" method. */

const mockMetaGet = jest.fn(async model => {
  if (model === "metadata/") {
    return { data: TEST_METADATA_RESPONSE };
  } else if (model === "metadata-managed-attribute/20") {
    return { data: TEST_MANAGEDDATA_RESPONSE };
  } else if (model === "agent") {
    return { data: TEST_AGENT_RESPONSE };
  } else if (model === "managed-attribute") {
    return { data: TEST_MANAGEDATTR_RESPONSE };
  }
});

const apiContext: any = {
  apiClient: { get: mockMetaGet, axios: { patch: mockPatch, post: mockPost } }
};

describe("Detail edit page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMetaGet.mockImplementation(async model => {
      if (model === "metadata") {
        return { data: TEST_METADATA_RESPONSE };
      } else if (model === "metadata-managed-attribute/20") {
        return { data: TEST_MANAGEDDATA_RESPONSE };
      } else if (model === "agent") {
        return { data: TEST_AGENT_RESPONSE };
      } else if (model === "managed-attribute") {
        return { data: TEST_MANAGEDATTR_RESPONSE };
      }
    });
  });

  it("Provides a form to edit metadata.", async done => {
    mockPatch.mockReturnValueOnce({
      data: {
        id: "1",
        type: "metadata"
      },
      status: 201
    });

    const wrapper = mountWithAppContext(
      <DetailEditPage router={{ query: { id: 100 }, push: mockPush } as any} />,
      { apiContext }
    );

    await Promise.resolve();
    wrapper.update();

    await wait(
      () => {
        expect(wrapper.find("acDigitizationDate")).toBeTruthy();
      },
      { timeout: 5000 }
    );

    wrapper.update();
    wrapper.find("form").simulate("submit");
    setImmediate(() => {
      expect(mockPatch).lastCalledWith(
        "/metadata/203f557a-bb5b-4aec-838b-c459b246de4a",
        {
          data: expect.objectContaining({
            attributes: expect.objectContaining({
              acDigitizationDate: "2019-11-25T07:30:00.175-05:00"
            }),
            type: "metadata"
          })
        },
        expect.anything()
      );
      done();
    });
  });
});
