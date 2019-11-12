import { ApiClientContext, createContextValue } from "common-ui";
import { mount } from "enzyme";
import { ObjectStoreDetailsPage } from "../../pages/media-uploadView/detailView";

/** Mock Kitsu "get" method. */
const mockGet = jest.fn(async () => {
  return {
    data: {
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
    }
  };
});

// Mock Kitsu, the client class that talks to the backend.
jest.mock(
  "kitsu",
  () =>
    class {
      public get = mockGet;
      public axios = {
        get: mockGet
      };
    }
);

function mountWithContext(element: JSX.Element) {
  return mount(
    <ApiClientContext.Provider value={createContextValue()}>
      {element}
    </ApiClientContext.Provider>
  );
}

describe("Metadata detail view page", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockGet.mockImplementation(async () => {
      return {
        data: {
          body: "Image content blob",
          headers: {
            connection: "keep-alive",
            "content-disposition":
              'form-data; name="attachment"; filename="9d18a6a1-c9de-4780-a7ee-8201816fbc35.PNG"',
            "content-length": "44042",
            "content-type": "image/png",
            date: "Tue, 12 Nov 2019 19:32:24 GMT"
          },
          status: 200
        },
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
    });
  });

  it("Provides a form to show the image.", async done => {
    const wrapper = mountWithContext(
      <ObjectStoreDetailsPage router={{ query: { id: "100" } } as any} />
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
