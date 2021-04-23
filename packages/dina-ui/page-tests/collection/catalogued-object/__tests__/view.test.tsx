import { CataloguedObjectViewPage } from "../../../../pages/collection/catalogued-object/view";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import {
  CollectingEvent,
  PhysicalEntity
} from "../../../../types/collection-api";

const TEST_COLLECTION_EVENT: CollectingEvent = {
  startEventDateTime: "2019_01_01_10_10_10",
  endEventDateTime: "2019_01_06_10_10_10",
  verbatimEventDateTime: "From 2019, 1,1,10,10,10 to 2019, 1.6, 10,10,10",
  id: "1",
  type: "collecting-event",
  uuid: "323423-23423-234",
  group: "test group",
  dwcOtherRecordNumbers: ["12", "13", "14"]
};

const TEST_CATALOGUED_OBJECT: PhysicalEntity = {
  id: "1",
  type: "physical-entity",
  dwcCatalogNumber: "my-number",
  collectingEvent: { id: "1", type: "collecting-event" } as CollectingEvent
};

const mockGet = jest.fn(async path => {
  if (path === "collection-api/physical-entity/1?include=collectingEvent") {
    return { data: TEST_CATALOGUED_OBJECT };
  } else if (
    path === "collection-api/collecting-event/1?include=collectors,attachment"
  ) {
    return { data: TEST_COLLECTION_EVENT };
  } else if (path === "collection-api/collecting-event/1/attachment") {
    return { data: [] };
  } else if (path === "user-api/group") {
    return { data: [] };
  }
});

const testCtx = {
  apiContext: {
    apiClient: {
      get: mockGet
    } as any
  }
};

describe("Catalogued Object View Page", () => {
  it("Renders the Catalogued Object with the linked Collecting Event", async () => {
    const wrapper = mountWithAppContext(
      <CataloguedObjectViewPage router={{ query: { id: "1" } } as any} />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();
    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(".dwcCatalogNumber-field .field-view").text()).toEqual(
      "my-number"
    );
    expect(
      wrapper.find(".startEventDateTime-field .field-view").text()
    ).toEqual("2019_01_01_10_10_10");
  });
});
