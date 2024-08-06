import { writeStorage } from "@rehooks/local-storage";
import { ResourceSelect } from "common-ui";
import { DEFAULT_GROUP_STORAGE_KEY } from "../../../../components/group-select/useStoredDefaultGroup";
import { MaterialSampleBulkCreatePage } from "../../../../pages/collection/material-sample/bulk-create";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";

// Mock out the dynamic component, which should only be rendered in the browser
jest.mock("next/dynamic", () => () => {
  return function MockDynamicComponent() {
    return <div>Mock dynamic component</div>;
  };
});

const mockPush = jest.fn();

const mockRouter = { push: mockPush, query: {} };

const mockGet = jest.fn<any, any>(async (path) => {
  switch (path) {
    case "collection-api/collection":
    case "collection-api/material-sample":
    case "objectstore-api/metadata":
    case "collection-api/managed-attribute":
    case "collection-api/material-sample-type":
    case "collection-api/project":
    case "collection-api/vocabulary2/materialSampleState":
    case "user-api/group":
      return { data: [] };
  }
});

const testCtx = {
  apiContext: { apiClient: { get: mockGet } }
};

describe("MaterialSampleBulkCreatePage", () => {
  beforeEach(jest.clearAllMocks);

  beforeEach(() => {
    // Set the deault group selection:
    writeStorage(DEFAULT_GROUP_STORAGE_KEY, "aafc");
    jest.clearAllMocks();
  });

  it("Can click the 'previous' button to go back to the previous step", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkCreatePage router={mockRouter as any} />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Fill out the form:
    wrapper
      .find(".collection-field")
      .find(ResourceSelect)
      .prop<any>("onChange")({
      id: "100",
      name: "test-collection",
      type: "collection"
    });
    wrapper
      .find(".numberToCreate-field input")
      .simulate("change", { target: { value: 5 } });
    wrapper
      .find(".baseName-field input")
      .simulate("change", { target: { value: "my-sample" } });
    wrapper
      .find(".start-field input")
      .simulate("change", { target: { value: "00001" } });
    wrapper
      .find(".separator-field input")
      .simulate("change", { target: { value: "-" } });
    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find("button.previous-button").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // Goes back to the previous page with the generator form values:
    expect(wrapper.find(".baseName-field input").prop("value")).toEqual(
      "my-sample"
    );
  });
});
