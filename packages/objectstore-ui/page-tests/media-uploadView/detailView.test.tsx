import { ObjectStoreDetailsPage } from "../../pages/media-uploadView/detailView";
import { mountWithAppContext } from "../../test-util/mock-app-context";

/** Test file response. */
const TEST_FILE_RESPONSE = {
  body: "image blob body",
  headers: {
    connection: "keep-alive",
    "content-disposition":
      'form-data; name="attachment"; filename="9d18a6a1-c9de-4780-a7ee-8201816fbc35.PNG"',
    "content-length": "44042",
    "content-type": "image/png",
    date: "Tue, 12 Nov 2019 19:32:24 GMT"
  },
  status: 200
};

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

const mockGet = jest.fn(async () => {
  return TEST_FILE_RESPONSE;
});

/** Mock Kitsu "get" method. */

const mockMetaGet = jest.fn(async model => {
  if (model === "metadata/") {
    return { data: TEST_METADATA_RESPONSE };
  } else if (model === "metadata-managed-attribute/20") {
    return { data: TEST_MANAGEDDATA_RESPONSE };
  }
});

// Mock API requests:
const apiContext: any = {
  apiClient: { get: mockMetaGet, axios: { get: mockGet } }
};

describe("Metadata detail view page", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockGet.mockImplementation(async () => {
      return TEST_FILE_RESPONSE;
    });

    mockMetaGet.mockImplementation(async model => {
      if (model === "metadata/") {
        return { data: TEST_METADATA_RESPONSE };
      } else if (model === "metadata-managed-attribute/20") {
        return { data: TEST_MANAGEDDATA_RESPONSE };
      }
    });
  });

  it("Provides a form to show the tags section.", async () => {
    const wrapper = mountWithAppContext(
      <ObjectStoreDetailsPage router={{ query: { id: "100" } } as any} />,
      { apiContext }
    );

    // Wait for the page to load.
    await Promise.resolve();
    wrapper.update();

    expect(wrapper.find(".spinner-border").exists()).toEqual(false);

    // The managed attribute section assgined value field should be rendered.
    expect(
      wrapper.containsMatchingElement(
        <strong style={{ background: "#AEB404", borderRadius: "25px" }}>
          <span>&nbsp;&nbsp;</span>
          765
          <span>&nbsp;&nbsp;</span>
        </strong>
      )
    ).toEqual(true);
  });

  it("Provides a form to show the managed attribute section.", async () => {
    const wrapper = mountWithAppContext(
      <ObjectStoreDetailsPage router={{ query: { id: "100" } } as any} />,
      { apiContext }
    );
    // Wait for the page to load.
    wrapper.update();
    await Promise.resolve().then(() => {
      expect(mockMetaGet).toHaveBeenCalledTimes(2);
      expect(mockMetaGet).toHaveBeenLastCalledWith(
        "metadata-managed-attribute/20",
        {
          include: "managedAttribute"
        }
      );
    });
  });

  it("Provides a form to show the metadata section.", async done => {
    const wrapper = mountWithAppContext(
      <ObjectStoreDetailsPage router={{ query: { id: "100" } } as any} />,
      { apiContext }
    );

    // Wait for the page to load.
    await Promise.resolve();
    wrapper.update();

    expect(wrapper.find(".spinner-border").exists()).toEqual(false);

    // The metadata section bucket name field should be rendered.
    expect(wrapper.contains("Bucket Name")).toEqual(true);

    done();
  });
  it("Provides a form to show the image.", async done => {
    const wrapper = mountWithAppContext(
      <ObjectStoreDetailsPage router={{ query: { id: "100" } } as any} />,
      { apiContext }
    );

    // Wait for the page to load.
    await Promise.resolve();
    wrapper.update();

    expect(wrapper.find(".spinner-border").exists()).toEqual(false);

    // The file's img tag should be rendered in a div due to the content type is image/png.
    expect(
      wrapper.containsMatchingElement(<img src="/api/v1/file/mybucket/100" />)
    ).toEqual(true);
    expect(wrapper.containsMatchingElement(<p>No File to display</p>)).toEqual(
      false
    );
    done();
  });
});
