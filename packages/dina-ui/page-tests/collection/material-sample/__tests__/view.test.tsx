import { PersistedResource } from "kitsu";
import { MaterialSampleViewPage } from "../../../../pages/collection/material-sample/view";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import {
  CollectingEvent,
  MaterialSample
} from "../../../../types/collection-api";

const TEST_COLLECTION_EVENT: CollectingEvent = {
  startEventDateTime: "2019_01_01_10_10_10",
  endEventDateTime: "2019_01_06_10_10_10",
  verbatimEventDateTime: "From 2019, 1,1,10,10,10 to 2019, 1.6, 10,10,10",
  id: "1",
  type: "collecting-event",
  group: "test group",
  otherRecordNumbers: ["12", "13", "14"]
};

const TEST_MATERIAL_SAMPLE: MaterialSample = {
  id: "1",
  type: "material-sample",
  materialSampleName: "my-sample-name",
  collectingEvent: { id: "1", type: "collecting-event" } as CollectingEvent
};

const TEST_SAMPLE_WITH_ORGANISMS: PersistedResource<MaterialSample> = {
  id: "ms-with-organisms",
  type: "material-sample",
  organism: [
    {
      id: "org-1",
      type: "organism",
      lifeStage: "test lifestage 1",
      determination: [
        { isPrimary: true, verbatimScientificName: "test scientific name 1" }
      ]
    },
    { id: "org-2", type: "organism", lifeStage: "test lifestage 2" }
  ]
};

const mockGet = jest.fn<any, any>(async (path) => {
  switch (path) {
    case "collection-api/material-sample/1":
      return { data: TEST_MATERIAL_SAMPLE };
    case "collection-api/material-sample/ms-with-organisms":
      return { data: TEST_SAMPLE_WITH_ORGANISMS };
    case "collection-api/collecting-event/1?include=collectors,attachment,collectionMethod,protocol":
      return { data: TEST_COLLECTION_EVENT };
    case "collection-api/collecting-event/1/attachment":
    case "user-api/group":
    case "objectstore-api/metadata":
    case "collection-api/material-sample/1/attachment":
    case "collection-api/collection":
      return { data: [] };
  }
});

const mockPost = jest.fn<any, any>(async (path) => {
  switch (path) {
    // Elastic search response with object store mock metadata data.
    case "search-api/search-ws/search":
      return {};
  }
});

const mockBulkGet = jest.fn<any, any>(async (paths) => {
  if (!paths.length) {
    return [];
  }
});

const testCtx = {
  apiContext: {
    apiClient: {
      get: mockGet,
      axios: {
        post: mockPost
      }
    },
    bulkGet: mockBulkGet
  }
} as any;

describe("Material Sample View Page", () => {
  it("Renders the Material Sample with the linked Collecting Event", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleViewPage router={{ query: { id: "1" } } as any} />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    expect(
      wrapper.find(".materialSampleName-field .field-view").text()
    ).toEqual("my-sample-name");
    expect(
      wrapper.find(".startEventDateTime-field .field-view").text()
    ).toEqual("2019_01_01_10_10_10");
  });

  it("Renders the organisms expanded by default.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleViewPage
        router={{ query: { id: "ms-with-organisms" } } as any}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Both organism sections should be expanded:
    expect(wrapper.find("button.expand-organism").length).toEqual(2);
    expect(wrapper.find("button.expand-organism.is-expanded").length).toEqual(
      2
    );

    // Only 1 organism has a determination:
    expect(wrapper.find("fieldset.determination-section").length).toEqual(1);
    expect(
      wrapper.find(".verbatimScientificName-field .field-view").text()
    ).toEqual("test scientific name 1");

    // Check the second lifeStage field:
    expect(wrapper.find(".lifeStage-field .field-view").at(1).text()).toEqual(
      "test lifestage 2"
    );

    // Renders the primary determination name when present:
    expect(wrapper.find(".organism-determination-cell").first().text()).toEqual(
      "test scientific name 1"
    );
  });
});
