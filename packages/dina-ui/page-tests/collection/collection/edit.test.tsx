import { PersistedResource } from "kitsu";
import { CollectionForm } from "../../../pages/collection/collection/edit";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import { Collection } from "../../../types/collection-api";

const TEST_COLLECTION: PersistedResource<Collection> = {
  id: "123",
  type: "collection",
  name: "test collection",
  code: "test-code",
  group: "cnc",
  institution: { id: "1", type: "institution", name: "test institution" }
};

const mockGet = jest.fn<any, any>(async (path) => {
  switch (path) {
    case "collection-api/collection/123":
      return { data: TEST_COLLECTION };
    case "user-api/group":
      return { data: [] };
    case "collection-api/institution":
      return { data: [TEST_COLLECTION] };
    case "collection-api/collection":
      return { data: [] };
  }
});

const mockSave = jest.fn(async (resources) => {
  return resources.map(() => TEST_COLLECTION);
});

const apiContext = {
  save: mockSave,
  apiClient: {
    get: mockGet
  }
};

const mockPush = jest.fn();

const mockRouter = {
  push: mockPush,
  query: { id: "123" }
};

describe("Collection edit page", () => {
  beforeEach(jest.clearAllMocks);

  it("Lets you add a new Collection", async () => {
    const wrapper = mountWithAppContext(
      <CollectionForm router={mockRouter as any} />,
      { apiContext }
    );
    await new Promise(setImmediate);
    wrapper.update();

    wrapper
      .find(".name-field input")
      .simulate("change", { target: { value: "test-name" } });
    wrapper
      .find(".code-field input")
      .simulate("change", { target: { value: "test-code" } });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockSave).lastCalledWith(
      [
        {
          resource: expect.objectContaining({
            code: "test-code",
            name: "test-name",
            type: "collection"
          }),
          type: "collection"
        }
      ],
      { apiBaseUrl: "/collection-api" }
    );
    expect(mockPush).lastCalledWith("/collection/collection/view?id=123");
  });

  it("Lets you edit an existing Collection", async () => {
    const wrapper = mountWithAppContext(
      <CollectionForm
        collection={TEST_COLLECTION}
        router={mockRouter as any}
      />,
      { apiContext }
    );
    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(".name-field input").prop("value")).toEqual(
      "test collection"
    );

    wrapper
      .find(".code-field input")
      .simulate("change", { target: { value: "edited code" } });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockSave).lastCalledWith(
      [
        {
          resource: expect.objectContaining({
            ...TEST_COLLECTION,
            institution: {
              id: "1",
              name: "test institution",
              type: "institution"
            },
            code: "edited code" // Only this was edited.
          }),
          type: "collection"
        }
      ],
      { apiBaseUrl: "/collection-api" }
    );
    expect(mockPush).lastCalledWith("/collection/collection/view?id=123");
  });
});
