import { PersistedResource } from "kitsu";
import { CollectionForm } from "../../../pages/collection/collection/edit";
import { mountWithAppContext } from "common-ui";
import { Collection } from "../../../types/collection-api";
import { fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

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
    await wrapper.waitForRequests();

    // Fill in name information
    fireEvent.change(wrapper.getByRole("textbox", { name: /name/i }), {
      target: {
        value: "test-name"
      }
    });

    // Fill in code information
    fireEvent.change(wrapper.getByRole("textbox", { name: /code/i }), {
      target: {
        value: "test-code"
      }
    });

    // Submit form
    fireEvent.submit(wrapper.container.querySelector("form")!);

    await wrapper.waitForRequests();

    // Test expected API response
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
    await wrapper.waitForRequests();

    // Test default name value
    expect(wrapper.getByRole("textbox", { name: /name/i })).toHaveDisplayValue(
      "test collection"
    );

    // Change code field value
    fireEvent.change(wrapper.getByRole("textbox", { name: /code/i }), {
      target: {
        value: "edited code"
      }
    });

    // Submit form
    fireEvent.submit(wrapper.container.querySelector("form")!);

    await wrapper.waitForRequests();

    // Test expected API response
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
