import { CataloguedObjectForm } from "../../../../pages/collection/catalogued-object/edit";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import {
  CollectingEvent,
  PhysicalEntity
} from "../../../../types/collection-api";
import { CoordinateSystem } from "../../../../types/collection-api/resources/CoordinateSystem";
import { SRS } from "../../../../types/collection-api/resources/SRS";

// Mock out the dynamic component, which should only be rendered in the browser
jest.mock("next/dynamic", () => () => {
  return function MockDynamicComponent() {
    return <div>Mock dynamic component</div>;
  };
});

function testCollectionEvent(): Partial<CollectingEvent> {
  return {
    startEventDateTime: "2021-04-13",
    id: "1",
    type: "collecting-event",
    group: "test group"
  };
}

function testCataloguedObject(): PhysicalEntity {
  return {
    id: "1",
    type: "physical-entity",
    group: "test group",
    dwcCatalogNumber: "my-number",
    collectingEvent: { id: "1", type: "collecting-event" } as CollectingEvent
  };
}

const TEST_SRS: SRS = {
  srs: ["NAD27 (EPSG:4276)", "WGS84 (EPSG:4326)"],
  type: "srs"
};

const TEST_COORDINATES: CoordinateSystem = {
  coordinateSystem: ["decimal degrees", " degrees decimal"],
  type: "coordinate-system"
};

const mockGet = jest.fn(async path => {
  if (path === "user-api/group") {
    return { data: [] };
  }
  if (path === "collection-api/collecting-event") {
    // Populate the collecting-event linker table:
    return { data: [testCollectionEvent()] };
  }
  if (
    path ===
    "collection-api/collecting-event/1?include=collectors,geoReferenceAssertions,attachment"
  ) {
    // Populate the linker table:
    return { data: testCollectionEvent() };
  }
  if (path === "agent-api/person") {
    return { data: [] };
  }
  if (path === "collection-api/srs") {
    return { data: [TEST_SRS] };
  }
  if (path === "collection-api/coordinate-system") {
    return { data: [TEST_COORDINATES] };
  }
});

const mockSave = jest.fn(async saves => {
  return saves.map(save => {
    if (save.type === "physical-entity") {
      return testCataloguedObject();
    }
    if (save.type === "collecting-event") {
      return testCollectionEvent();
    }
  });
});

const testCtx = {
  apiContext: {
    save: mockSave,
    apiClient: {
      get: mockGet
    } as any
  }
};

const mockOnSaved = jest.fn();

describe("Catalogued Object View Page", () => {
  beforeEach(jest.clearAllMocks);

  it("Submits a new physical-entity with a new CollectingEvent.", async () => {
    const wrapper = mountWithAppContext(
      <CataloguedObjectForm onSaved={mockOnSaved} />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    wrapper
      .find(".dwcCatalogNumber-field input")
      .simulate("change", { target: { value: "my-new-catalogued-object" } });
    wrapper
      .find(".startEventDateTime-field input")
      .simulate("change", { target: { value: "2019-12-21T16:00" } });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // Saves the Collecting Event and the Physical Entity:
    expect(mockSave.mock.calls).toEqual([
      [
        // New physical-entity:
        [
          {
            resource: {
              dwcOtherRecordNumbers: null,
              dwcVerbatimCoordinateSystem: "decimal degrees",
              dwcVerbatimSRS: "WGS84 (EPSG:4326)",
              relationships: {},
              startEventDateTime: "2019-12-21T16:00",
              type: "collecting-event"
            },
            type: "collecting-event"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ],
      [
        // New collecting-event:
        [
          {
            resource: {
              collectingEvent: {
                id: "1",
                type: "collecting-event"
              },
              dwcCatalogNumber: "my-new-catalogued-object"
            },
            type: "physical-entity"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Submits a new physical-entity linked to an existing CollectingEvent.", async () => {
    const wrapper = mountWithAppContext(
      <CataloguedObjectForm onSaved={mockOnSaved} />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    wrapper
      .find(".dwcCatalogNumber-field input")
      .simulate("change", { target: { value: "my-new-catalogued-object" } });

    wrapper.find("button.collecting-event-link-button").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // Saves the Collecting Event and the Physical Entity:
    expect(mockSave.mock.calls).toEqual([
      [
        // Saves the existing Collecting Event:
        [
          {
            resource: {
              dwcOtherRecordNumbers: null,
              group: "test group",
              id: "1",
              relationships: {},
              startEventDateTime: "2021-04-13",
              type: "collecting-event"
            },
            type: "collecting-event"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ],
      [
        // New physical-entity:
        [
          {
            resource: {
              collectingEvent: {
                id: "1",
                type: "collecting-event"
              },
              dwcCatalogNumber: "my-new-catalogued-object"
            },
            type: "physical-entity"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Edits an existing physical-entity", async () => {
    const wrapper = mountWithAppContext(
      <CataloguedObjectForm
        cataloguedObject={testCataloguedObject()}
        onSaved={mockOnSaved}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Existing CollectingEvent should show up:
    expect(
      wrapper.find(".startEventDateTime-field input").prop("value")
    ).toEqual("2021-04-13");

    wrapper
      .find(".dwcCatalogNumber-field input")
      .simulate("change", { target: { value: "edited-catalog-number" } });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockSave.mock.calls).toEqual([
      [
        // Edits existing collecting-event:
        [
          {
            resource: {
              startEventDateTime: "2021-04-13",
              id: "1",
              type: "collecting-event",
              group: "test group",
              dwcOtherRecordNumbers: null,
              relationships: {}
            },
            type: "collecting-event"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ],
      [
        // Edits existing physical-entity:
        [
          {
            resource: {
              id: "1",
              type: "physical-entity",
              group: "test group",
              dwcCatalogNumber: "edited-catalog-number",
              collectingEvent: { id: "1", type: "collecting-event" }
            },
            type: "physical-entity"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Lets you remove the attached Collecting Event.", async () => {
    const wrapper = mountWithAppContext(
      <CataloguedObjectForm
        cataloguedObject={testCataloguedObject()}
        onSaved={mockOnSaved}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Existing CollectingEvent should show up:
    expect(
      wrapper.find(".startEventDateTime-field input").prop("value")
    ).toEqual("2021-04-13");

    wrapper.find("button.detach-collecting-event-button").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // Existing CollectingEvent should be gone:
    expect(
      wrapper.find(".startEventDateTime-field input").prop("value")
    ).toEqual("");

    // Set the new Collecting Event's startEventDateTime:
    wrapper
      .find(".startEventDateTime-field input")
      .simulate("change", { target: { value: "2019-12-21T16:00" } });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockSave.mock.calls).toEqual([
      [
        // New collecting-event created:
        [
          {
            resource: {
              dwcOtherRecordNumbers: null,
              dwcVerbatimCoordinateSystem: "decimal degrees",
              dwcVerbatimSRS: "WGS84 (EPSG:4326)",
              relationships: {},
              startEventDateTime: "2019-12-21T16:00",
              type: "collecting-event"
            },
            type: "collecting-event"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ],
      [
        // Existing physical-entity updated:
        [
          {
            resource: {
              collectingEvent: {
                id: "1",
                type: "collecting-event"
              },
              dwcCatalogNumber: "my-number",
              group: "test group",
              id: "1",
              type: "physical-entity"
            },
            type: "physical-entity"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });
});
