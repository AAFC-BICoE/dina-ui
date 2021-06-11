import { PersistedResource } from "kitsu";
import { CreateMaterialSampleFromWorkflowForm } from "../../../../pages/collection/workflow-template/run";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import {
  CollectingEvent,
  MaterialSample
} from "../../../../types/collection-api";
import { CoordinateSystem } from "../../../../types/collection-api/resources/CoordinateSystem";
import { SRS } from "../../../../types/collection-api/resources/SRS";

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
    case "user-api/group":
    case "agent-api/person":
    case "objectstore-api/metadata":
      return { data: [] };
  }
});

const mockBulkGet = jest.fn<any, any>(async paths => {
  if (!paths.length) {
    return [];
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

const apiContext = {
  bulkGet: mockBulkGet,
  save: mockSave,
  apiClient: {
    get: mockGet
  }
};

const mockOnSaved = jest.fn();

async function getWrapper() {
  const wrapper = mountWithAppContext(
    <CreateMaterialSampleFromWorkflowForm
      actionDefinition={{
        id: "1",
        actionType: "ADD",
        formTemplates: {
          COLLECTING_EVENT: {
            allowExisting: true,
            allowNew: true,
            templateFields: {
              startEventDateTime: {
                enabled: true,
                defaultValue: "2019-12-21T16:00"
              },
              ...({
                // On assertions only allow the lat/long fields:
                "geoReferenceAssertions[0].dwcDecimalLatitude": {
                  enabled: true,
                  defaultValue: 1
                },
                "geoReferenceAssertions[0].dwcDecimalLongitude": {
                  enabled: true,
                  defaultValue: 2
                }
              } as any)
            }
          },
          MATERIAL_SAMPLE: {
            allowExisting: true,
            allowNew: true,
            // Only show the Identifiers:
            templateFields: {}
          }
        },
        group: "test-group",
        name: "test-definition",
        type: "material-sample-action-definition"
      }}
      onSaved={mockOnSaved}
    />,
    { apiContext }
  );

  await new Promise(setImmediate);
  wrapper.update();

  return wrapper;
}

describe("CreateMaterialSampleFromWorkflowPage", () => {
  it("Renders the Material Sample Form with the disabled/enabled fields and initial values", async () => {
    const wrapper = await getWrapper();

    // Identifiers fields are enabled:
    expect(wrapper.find(".materialSampleName-field input").exists()).toEqual(
      true
    );

    // Lat/Lng fields are enabled:
    expect(wrapper.find(".dwcDecimalLatitude input").prop("value")).toEqual(
      "1"
    );
    expect(wrapper.find(".dwcDecimalLongitude input").prop("value")).toEqual(
      "2"
    );

    // Uncertainty field is disabled:
    expect(
      wrapper.find(".dwcCoordinateUncertaintyInMeters input").exists()
    ).toEqual(false);

    // Preparation type is disabled:
    expect(wrapper.find(".preparationType-field Select").exists()).toEqual(
      false
    );

    // Edit the lat/lng:
    wrapper.find(".dwcDecimalLatitude NumberFormat").prop<any>("onValueChange")(
      { floatValue: 45.394728 }
    );
    wrapper
      .find(".dwcDecimalLongitude NumberFormat")
      .prop<any>("onValueChange")({ floatValue: -75.701452 });

    // Submit
    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              dwcOtherRecordNumbers: null,
              geoReferenceAssertions: [
                {
                  isPrimary: true,
                  // The added values:
                  dwcDecimalLatitude: 45.394728,
                  dwcDecimalLongitude: -75.701452
                }
              ],
              relationships: {},
              // The template's default value:
              startEventDateTime: "2019-12-21T16:00",
              type: "collecting-event"
            },
            type: "collecting-event"
          }
        ],
        {
          apiBaseUrl: "/collection-api"
        }
      ],
      [
        [
          {
            resource: {
              collectingEvent: {
                id: "1",
                type: "collecting-event"
              },
              preparationType: {
                id: null,
                type: "preparation-type"
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

    expect(mockOnSaved).lastCalledWith("1");
  });
});
