import { KitsuResourceLink, PersistedResource } from "kitsu";
import ReactSwitch from "react-switch";
import Switch from "react-switch";
import { MaterialSampleForm } from "../../../../pages/collection/material-sample/edit";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import {
  CollectingEvent,
  MaterialSample
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

function testMaterialSample(): PersistedResource<MaterialSample> {
  return {
    id: "1",
    type: "material-sample",
    group: "test group",
    dwcCatalogNumber: "my-number",
    collectingEvent: {
      id: "1",
      type: "collecting-event"
    } as PersistedResource<CollectingEvent>
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

const TEST_MANAGED_ATTRIBUTE = {
  id: "1",
  type: "managed-attribute",
  name: "testAttr"
};

const mockGet = jest.fn<any, any>(async path => {
  switch (path) {
    case "collection-api/collecting-event":
      return { data: [testCollectionEvent()] };
    case "collection-api/collecting-event/1?include=collectors,attachment":
      // Populate the linker table:
      return { data: testCollectionEvent() };
    case "collection-api/srs":
      return { data: [TEST_SRS] };
    case "collection-api/coordinate-system":
      return { data: [TEST_COORDINATES] };
    case "collection-api/preparation-type":
    case "collection-api/managed-attribute":
    case "collection-api/material-sample-type":
    case "user-api/group":
    case "agent-api/person":
    case "objectstore-api/metadata":
      return { data: [] };
  }
});

const mockSave = jest.fn<any, any>(async saves => {
  return saves.map(save => {
    if (save.type === "material-sample") {
      return testMaterialSample();
    }
    if (save.type === "collecting-event") {
      return testCollectionEvent();
    }
  });
});

const mockBulkGet = jest.fn<any, any>(async paths => {
  if (!paths.length) {
    return [];
  }
  if ((paths[0] as string).startsWith("/managed-attribute")) {
    return [TEST_MANAGED_ATTRIBUTE];
  }
});

const testCtx = {
  apiContext: {
    bulkGet: mockBulkGet,
    save: mockSave,
    apiClient: {
      get: mockGet
    }
  }
};

const mockOnSaved = jest.fn();

describe("Material Sample Edit Page", () => {
  beforeEach(jest.clearAllMocks);

  it("Submits a new material-sample with a new CollectingEvent.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm onSaved={mockOnSaved} />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Enable Collecting Event and catalogue info form sections:
    wrapper.find(".enable-collecting-event").find(Switch).prop<any>("onChange")(
      true
    );
    wrapper.find(".enable-catalogue-info").find(Switch).prop<any>("onChange")(
      true
    );

    wrapper
      .find(".materialSampleName-field input")
      .simulate("change", { target: { value: "test-material-sample-id" } });
    wrapper
      .find(".dwcCatalogNumber-field input")
      .simulate("change", { target: { value: "my-new-material-sample" } });
    wrapper
      .find(".startEventDateTime-field input")
      .simulate("change", { target: { value: "2019-12-21T16:00" } });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // Saves the Collecting Event and the Material Sample:
    expect(mockSave.mock.calls).toEqual([
      [
        // New collecting-event:
        [
          {
            resource: {
              dwcOtherRecordNumbers: null,
              dwcVerbatimCoordinateSystem: "decimal degrees",
              dwcVerbatimSRS: "WGS84 (EPSG:4326)",
              geoReferenceAssertions: [
                {
                  georeferencedBy: undefined,
                  isPrimary: true
                }
              ],
              managedAttributes: {},
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
        // New material-sample:
        [
          {
            resource: {
              collectingEvent: {
                id: "1",
                type: "collecting-event"
              },
              materialSampleName: "test-material-sample-id",
              dwcCatalogNumber: "my-new-material-sample",
              managedAttributes: {},
              relationships: {},
              type: "material-sample"
            },
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Submits a new material-sample linked to an existing CollectingEvent.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm onSaved={mockOnSaved} />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Enable Collecting Event and catalogue info form sections:
    wrapper.find(".enable-collecting-event").find(Switch).prop<any>("onChange")(
      true
    );
    wrapper.find(".enable-catalogue-info").find(Switch).prop<any>("onChange")(
      true
    );

    wrapper
      .find(".materialSampleName-field input")
      .simulate("change", { target: { value: "test-material-sample-id" } });
    wrapper
      .find(".dwcCatalogNumber-field input")
      .simulate("change", { target: { value: "my-new-material-sample" } });

    wrapper.find("button.collecting-event-link-button").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // Saves the Collecting Event and the Material Sample:
    expect(mockSave.mock.calls).toEqual([
      [
        // Doesn't save the existing Collecting Event because it wasn't edited:
        [
          // New material-sample:
          {
            resource: {
              collectingEvent: {
                id: "1",
                type: "collecting-event"
              },
              materialSampleName: "test-material-sample-id",
              dwcCatalogNumber: "my-new-material-sample",
              managedAttributes: {},
              type: "material-sample",
              relationships: {}
            },
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Edits an existing material-sample", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm
        materialSample={testMaterialSample()}
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
      .find(".materialSampleName-field input")
      .simulate("change", { target: { value: "test-material-sample-id" } });
    wrapper
      .find(".dwcCatalogNumber-field input")
      .simulate("change", { target: { value: "edited-catalog-number" } });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockSave.mock.calls).toEqual([
      [
        // Edits existing material-sample:
        [
          {
            resource: {
              id: "1",
              type: "material-sample",
              group: "test group",
              materialSampleName: "test-material-sample-id",
              dwcCatalogNumber: "edited-catalog-number",
              collectingEvent: { id: "1", type: "collecting-event" },

              // Preparations are not enabled, so the preparation fields are set to null:
              preparationDate: null,
              preparationType: {
                id: null,
                type: "preparation-type"
              },
              preparedBy: {
                id: null
              },
              managedAttributes: {},
              relationships: {}
            },
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Lets you remove the attached Collecting Event.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm
        materialSample={testMaterialSample()}
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
              geoReferenceAssertions: [
                {
                  isPrimary: true
                }
              ],
              managedAttributes: {},
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
        // Existing material-sample updated:
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
              type: "material-sample",

              // Preparations are not enabled, so the preparation fields are set to null:
              preparationDate: null,
              preparationType: {
                id: null,
                type: "preparation-type"
              },
              preparedBy: {
                id: null
              },
              managedAttributes: {},
              relationships: {}
            },
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Renders an existing Material Sample with the Preparations section enabled.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm
        materialSample={{
          type: "material-sample",
          id: "333",
          materialSampleName: "test-ms",
          preparationType: {
            id: "65765",
            type: "preparation-type",
            name: "test-prep-type"
          } as KitsuResourceLink
        }}
        onSaved={mockOnSaved}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Preparations are enabled:
    expect(
      wrapper.find(".enable-catalogue-info").find(ReactSwitch).prop("checked")
    ).toEqual(true);
  });

  it("Renders an existing Material Sample with the Preparations section disabled (no Preparations fields set).", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm
        materialSample={{
          type: "material-sample",
          id: "333",
          materialSampleName: "test-ms"
        }}
        onSaved={mockOnSaved}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Preparations are disabled:
    expect(
      wrapper.find(".enable-catalogue-info").find(ReactSwitch).prop("checked")
    ).toEqual(false);
  });

  it("Renders an existing Material Sample with the managed attribute when there is selected attribute with assinged value", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm
        materialSample={{
          type: "material-sample",
          id: "333",
          materialSampleName: "test-ms",
          managedAttributeValues: {
            testAttr: { assignedValue: "do the test" }
          }
        }}
        onSaved={mockOnSaved}
      />,
      testCtx
    );

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              collectingEvent: {
                id: null,
                type: "collecting-event"
              },
              id: "333",
              managedAttributes: {
                testAttr: "do the test"
              },
              materialSampleName: "test-ms",
              preparationDate: null,
              preparationType: {
                id: null,
                type: "preparation-type"
              },
              preparedBy: {
                id: null
              },
              relationships: {},
              type: "material-sample"
            },
            type: "material-sample"
          }
        ],
        {
          apiBaseUrl: "/collection-api"
        }
      ]
    ]);
  });
});
