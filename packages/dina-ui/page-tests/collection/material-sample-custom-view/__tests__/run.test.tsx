import CreatableSelect from "react-select/creatable";
import ReactSwitch from "react-switch";
import {
  BLANK_PREPARATION,
  MaterialSampleFormCustomViewConfig
} from "../../../../components";
import { CreateMaterialSampleFromWorkflowForm } from "../../../../pages/collection/material-sample-custom-view/run";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import {
  AcquisitionEvent,
  CollectingEvent
} from "../../../../types/collection-api";
import { CoordinateSystem } from "../../../../types/collection-api/resources/CoordinateSystem";
import { SRS } from "../../../../types/collection-api/resources/SRS";

function testCollectionEvent(): Partial<CollectingEvent> {
  return {
    startEventDateTime: "2021-04-13",
    id: "555",
    type: "collecting-event",
    group: "test group"
  };
}

function testAcquisitionEvent(): Partial<AcquisitionEvent> {
  return {
    id: "987",
    type: "acquisition-event",
    group: "test group",
    createdBy: "poffm",
    createdOn: "2021-11-15",
    receptionRemarks: "test reception remarks"
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
      // Populate the linker table:
      return { data: [testCollectionEvent()] };
    case "collection-api/collecting-event/2?include=collectors,attachment,collectionMethod":
      return {
        data: {
          startEventDateTime: "2021-04-13",
          id: "2",
          type: "collecting-event",
          group: "test group"
        }
      };
    case "collection-api/collecting-event/555?include=collectors,attachment,collectionMethod":
      return { data: testCollectionEvent() };
    case "collection-api/acquisition-event":
      // Populate the linker table:
      return { data: [testAcquisitionEvent()] };
    case "collection-api/acquisition-event/987":
      return { data: testAcquisitionEvent() };
    case "collection-api/srs":
      return { data: [TEST_SRS] };
    case "collection-api/coordinate-system":
      return { data: [TEST_COORDINATES] };
    case "collection-api/preparation-type":
    case "collection-api/managed-attribute":
    case "collection-api/material-sample":
    case "user-api/group":
    case "agent-api/person":
    case "objectstore-api/metadata":
    case "collection-api/collection":
    case "collection-api/custom-view":
      return { data: [] };
  }
});

const mockBulkGet = jest.fn<any, any>(async paths =>
  paths.map(path => {
    switch (path) {
      case "managed-attribute/MATERIAL_SAMPLE.attribute_1":
        return {
          id: "1",
          key: "attribute_1",
          name: "Attribute 1"
        };
      case "managed-attribute/MATERIAL_SAMPLE.attribute_2":
        return {
          id: "2",
          key: "attribute_2",
          name: "Attribute 2"
        };
    }
  })
);

const mockSave = jest.fn<any, any>(ops =>
  ops.map(op => ({
    ...op.resource,
    id: op.resource.id ?? "11111111-1111-1111-1111-111111111111"
  }))
);

const apiContext = {
  bulkGet: mockBulkGet,
  save: mockSave,
  apiClient: {
    get: mockGet
  }
};

const mockOnSaved = jest.fn();

async function getWrapper(
  actionDefinition?: MaterialSampleFormCustomViewConfig
) {
  const wrapper = mountWithAppContext(
    <CreateMaterialSampleFromWorkflowForm
      actionDefinition={
        actionDefinition ?? {
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
          navOrder: null,
          type: "material-sample-form-custom-view"
        }
      }
      moveToSampleViewPage={mockOnSaved}
      moveToNewRunPage={mockOnSaved}
    />,
    { apiContext }
  );

  await new Promise(setImmediate);
  wrapper.update();

  return wrapper;
}

describe("CreateMaterialSampleFromWorkflowPage", () => {
  beforeEach(jest.clearAllMocks);

  it("Renders the Material Sample Form with the disabled/enabled fields and initial values", async () => {
    const wrapper = await getWrapper();

    // Identifiers fields are disabled:
    expect(wrapper.find(".materialSampleName-field input").exists()).toEqual(
      false
    );

    // Lat/Lng fields are enabled:
    expect(wrapper.find(".dwcDecimalLatitude input").prop("value")).toEqual(1);
    expect(wrapper.find(".dwcDecimalLongitude input").prop("value")).toEqual(2);

    // Uncertainty field is disabled:
    expect(
      wrapper.find(".dwcCoordinateUncertaintyInMeters input").exists()
    ).toEqual(false);

    // Preparation type is disabled:
    expect(wrapper.find(".preparationType-field Select").exists()).toEqual(
      false
    );

    // Edit the lat/lng:
    wrapper
      .find(".dwcDecimalLatitude input")
      .simulate("change", { target: { value: "45.394728" } });
    wrapper
      .find(".dwcDecimalLongitude input")
      .simulate("change", { target: { value: "-75.701452" } });

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
              dwcVerbatimCoordinateSystem: null,
              geoReferenceAssertions: [
                {
                  georeferencedBy: undefined,
                  isPrimary: true,
                  // The added values:
                  dwcDecimalLatitude: "45.394728",
                  dwcDecimalLongitude: "-75.701452"
                }
              ],
              relationships: {
                attachment: {
                  data: []
                }
              },
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
              acquisitionEvent: {
                id: null,
                type: "acquisition-event"
              },
              associations: [],
              hostOrganism: null,
              collectingEvent: {
                id: "11111111-1111-1111-1111-111111111111",
                type: "collecting-event"
              },
              storageUnit: { id: null, type: "storage-unit" },
              // Preparations are not enabled, so the preparation fields are set to null:
              ...BLANK_PREPARATION,
              preparationAttachment: undefined,
              managedAttributes: {},
              relationships: {
                organism: { data: [] },
                preparationAttachment: { data: [] }
              },
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

    expect(mockOnSaved).lastCalledWith("11111111-1111-1111-1111-111111111111");
  });

  it("Renders the Material Sample Form with a pre-attached Collecting Event.", async () => {
    const wrapper = await getWrapper({
      formTemplates: {
        COLLECTING_EVENT: {
          allowExisting: true,
          allowNew: true,
          templateFields: {
            id: {
              defaultValue: "555",
              enabled: true
            }
          }
        },
        MATERIAL_SAMPLE: {
          allowExisting: true,
          allowNew: true,
          // Explicitly enable no fields:
          templateFields: {}
        }
      },
      navOrder: null,
      type: "material-sample-form-custom-view"
    });

    // Identifiers fields are disabled:
    expect(wrapper.find(".materialSampleName-field input").exists()).toEqual(
      false
    );

    // Group field is enabled:
    expect(wrapper.find(".group-field input").exists()).toEqual(true);

    // Collecting Event field is set but the input is disabled:
    expect(
      wrapper.find(".startEventDateTime-field .field-view").text()
    ).toEqual("2021-04-13");
    expect(wrapper.find(".startEventDateTime-field input").exists()).toEqual(
      false
    );

    await wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // Only the material sample is saved, and it's linked to the existing Collecting Event ID from the template:
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              acquisitionEvent: {
                id: null,
                type: "acquisition-event"
              },
              associations: [],
              hostOrganism: null,
              collectingEvent: {
                id: "555",
                type: "collecting-event"
              },
              storageUnit: { id: null, type: "storage-unit" },

              // Preparations are not enabled, so the preparation fields are set to null:
              ...BLANK_PREPARATION,
              preparationAttachment: undefined,
              managedAttributes: {},
              relationships: {
                organism: { data: [] },
                preparationAttachment: { data: [] }
              },
              type: "material-sample"
            },
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
    expect(mockOnSaved).lastCalledWith("11111111-1111-1111-1111-111111111111");
  });

  it("Renders the Material Sample Form with a pre-attached Acquisition Event.", async () => {
    const wrapper = await getWrapper({
      formTemplates: {
        ACQUISITION_EVENT: {
          allowExisting: true,
          allowNew: true,
          templateFields: {
            id: {
              defaultValue: "987",
              enabled: true
            }
          }
        },
        MATERIAL_SAMPLE: {
          allowExisting: true,
          allowNew: true,
          // Explicitly enable no fields:
          templateFields: {}
        }
      },
      navOrder: null,
      type: "material-sample-form-custom-view"
    });

    // receptionRemarks value is there:
    expect(wrapper.find(".receptionRemarks-field .field-view").text()).toEqual(
      "test reception remarks"
    );

    await wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // Only the material sample is saved, and it's linked to the existing Collecting Event ID from the template:
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: expect.objectContaining({
              acquisitionEvent: {
                id: "987",
                type: "acquisition-event"
              },
              type: "material-sample"
            }),
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
    expect(mockOnSaved).lastCalledWith("11111111-1111-1111-1111-111111111111");
  });

  it("Renders the Material Sample form with no template fields enabled.", async () => {
    const wrapper = await getWrapper({
      formTemplates: {},
      type: "material-sample-form-custom-view",
      navOrder: null
    });

    // Get the switches:
    const switches = wrapper.find(".material-sample-nav").find(ReactSwitch);
    expect(switches.length).not.toEqual(0);

    // All switches should be unchecked:
    expect(switches.map(node => node.prop("checked"))).toEqual(
      switches.map(() => false)
    );

    // Submit with only the name set:
    await wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // Only the material sample is saved:
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              acquisitionEvent: {
                id: null,
                type: "acquisition-event"
              },
              hostOrganism: null,
              associations: [],
              collectingEvent: {
                id: null,
                type: "collecting-event"
              },
              storageUnit: { id: null, type: "storage-unit" },

              // Preparations are not enabled, so the preparation fields are set to null:
              ...BLANK_PREPARATION,
              preparationAttachment: undefined,
              managedAttributes: {},
              relationships: {
                organism: { data: [] },
                preparationAttachment: { data: [] }
              },
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

  it("Renders the Material Sample form with only the Preparation section enabled.", async () => {
    const wrapper = await getWrapper({
      formTemplates: {
        MATERIAL_SAMPLE: {
          allowExisting: true,
          allowNew: true,
          templateFields: {
            preparedBy: {
              defaultValue: null,
              enabled: true
            }
          }
        }
      },
      navOrder: null,
      type: "material-sample-form-custom-view"
    });

    // Only the Preparation section should be enabled:
    expect(
      wrapper.find(".enable-collecting-event").find(ReactSwitch).prop("checked")
    ).toEqual(false);
    expect(
      wrapper.find(".enable-catalogue-info").find(ReactSwitch).prop("checked")
    ).toEqual(true);
  });

  it("Renders the Material Sample form with only the Organisms section enabled.", async () => {
    const wrapper = await getWrapper({
      formTemplates: {
        MATERIAL_SAMPLE: {
          allowExisting: true,
          allowNew: true,
          templateFields: {
            ...({
              "organism[0].determination[0].verbatimScientificName": {
                enabled: true,
                defaultValue: "test verbatim scientific name"
              }
            } as any)
          }
        }
      },
      navOrder: null,
      type: "material-sample-form-custom-view"
    });

    // Only the Organisms section should be enabled:
    expect(
      wrapper.find(".enable-organisms").find(ReactSwitch).prop("checked")
    ).toEqual(true);

    // Renders the determination section:
    expect(
      wrapper
        .find(".determination-section .verbatimScientificName-field input")
        .prop("value")
    ).toEqual("test verbatim scientific name");
  });

  it("Renders the Material Sample form with only the Associations section enabled.", async () => {
    const wrapper = await getWrapper({
      formTemplates: {
        MATERIAL_SAMPLE: {
          allowExisting: true,
          allowNew: true,
          templateFields: {
            "associations[0].associatedSample": {
              enabled: true
            },
            "associations[0].associationType": {
              defaultValue: "test default association type",
              enabled: true
            }
          } as any
        }
      },
      navOrder: null,
      type: "material-sample-form-custom-view"
    });

    // Only the associations section should be enabled:
    expect(
      wrapper.find(".enable-associations").find(ReactSwitch).prop("checked")
    ).toEqual(true);

    // Renders the associations section:
    expect(
      wrapper.find(".association-type").find(CreatableSelect).exists()
    ).toEqual(true);
  });

  it("Renders the Material Sample form with only the Collecting Event section enabled.", async () => {
    const wrapper = await getWrapper({
      formTemplates: {
        COLLECTING_EVENT: {
          allowExisting: true,
          allowNew: true,
          templateFields: {
            startEventDateTime: {
              defaultValue: "2021-05-05",
              enabled: true
            }
          }
        }
      },
      navOrder: null,
      type: "material-sample-form-custom-view"
    });

    // Only the Collecting Event section should be enabled:
    expect(
      wrapper.find(".enable-collecting-event").find(ReactSwitch).prop("checked")
    ).toEqual(true);

    // Submit
    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // Submits the Col event with the default value and the material sample:
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: expect.objectContaining({
              startEventDateTime: "2021-05-05",
              type: "collecting-event"
            }),
            type: "collecting-event"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ],
      [
        [
          {
            resource: expect.objectContaining({
              collectingEvent: {
                id: "11111111-1111-1111-1111-111111111111",
                type: "collecting-event"
              }
            }),
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Renders the Material Sample form with only the Acquisition Event section enabled.", async () => {
    const wrapper = await getWrapper({
      formTemplates: {
        ACQUISITION_EVENT: {
          allowExisting: true,
          allowNew: true,
          templateFields: {
            receptionRemarks: {
              enabled: true,
              defaultValue: "test default remarks"
            }
          }
        }
      },
      navOrder: null,
      type: "material-sample-form-custom-view"
    });

    // Only the Acquisition Event section should be enabled:
    expect(
      wrapper
        .find(".enable-acquisition-event")
        .find(ReactSwitch)
        .prop("checked")
    ).toEqual(true);

    expect(
      wrapper.find(".receptionRemarks-field textarea").prop("value")
    ).toEqual("test default remarks");
    expect(wrapper.find(".receivedDate-field").exists()).toEqual(false);

    // Submit
    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // Submits the Acq event with the default value and the material sample:
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              receptionRemarks: "test default remarks",
              type: "acquisition-event"
            },
            type: "acquisition-event"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ],
      [
        [
          {
            resource: expect.objectContaining({
              acquisitionEvent: {
                id: "11111111-1111-1111-1111-111111111111",
                type: "acquisition-event"
              }
            }),
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Renders the Material Sample form with only the Storage section enabled.", async () => {
    const wrapper = await getWrapper({
      formTemplates: {
        MATERIAL_SAMPLE: {
          allowExisting: false,
          allowNew: false,
          templateFields: {
            storageUnit: {
              enabled: true,
              defaultValue: null
            }
          }
        }
      },
      navOrder: null,
      type: "material-sample-form-custom-view"
    });

    // Only the Collecting Event section should be enabled:
    expect(
      wrapper.find(".enable-storage").find(ReactSwitch).prop("checked")
    ).toEqual(true);
    expect(
      wrapper.find(".enable-collecting-event").find(ReactSwitch).prop("checked")
    ).toEqual(false);
    expect(
      wrapper.find(".enable-catalogue-info").find(ReactSwitch).prop("checked")
    ).toEqual(false);
  });

  it("Renders the Material Sample form with only the Scheduled Action section enabled.", async () => {
    const wrapper = await getWrapper({
      formTemplates: {
        MATERIAL_SAMPLE: {
          allowExisting: false,
          allowNew: false,
          templateFields: {
            ...({
              "scheduledAction.actionType": {
                defaultValue: "default-action-type",
                enabled: true
              },
              "scheduledAction.remarks": {
                defaultValue: "default-remarks",
                enabled: true
              }
            } as any)
          }
        }
      },
      navOrder: null,
      type: "material-sample-form-custom-view"
    });

    // Only the Scheduled Actions section should be enabled:
    expect(
      wrapper
        .find(".enable-scheduled-actions")
        .find(ReactSwitch)
        .prop("checked")
    ).toEqual(true);
    expect(
      wrapper.find(".enable-collecting-event").find(ReactSwitch).prop("checked")
    ).toEqual(false);
    expect(
      wrapper.find(".enable-catalogue-info").find(ReactSwitch).prop("checked")
    ).toEqual(false);

    expect(
      wrapper
        .find("#scheduled-actions-section .remarks-field textarea")
        .prop("value")
    ).toEqual("default-remarks");

    // Add the first scheduled action with the default value:
    wrapper
      .find("#scheduled-actions-section button.add-button")
      .simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // Add the second scheduled action with the default value:
    wrapper
      .find("#scheduled-actions-section button.add-new-button")
      .simulate("click");
    await new Promise(setImmediate);
    wrapper.update();
    wrapper
      .find("#scheduled-actions-section button.add-button")
      .simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // There should be 2 rows:
    expect(
      wrapper.find("#scheduled-actions-section .rt-tbody .rt-tr").length
    ).toEqual(2);

    // Submit the form:
    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // Submits the sample with the 2 scheduled actions:
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: expect.objectContaining({
              // Singular scheduledAction field from the template should not be included.
              // This should prove the bug fix for https://redmine.biodiversity.agr.gc.ca/issues/26308
              scheduledAction: undefined,
              // Both scheduledActions are made with the default values:
              scheduledActions: [
                {
                  actionType: "default-action-type",
                  remarks: "default-remarks"
                },
                {
                  actionType: "default-action-type",
                  remarks: "default-remarks"
                }
              ],
              type: "material-sample"
            }),
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Renders the Material Sample form with a custom nav order", async () => {
    const wrapper = await getWrapper({
      formTemplates: {
        MATERIAL_SAMPLE: {
          allowExisting: false,
          allowNew: false,
          templateFields: {}
        }
      },
      navOrder: ["material-sample-info-section", "identifiers-section"],
      type: "material-sample-form-custom-view"
    });

    // Shows the custom order: "Material Sample Info" then "Identifiers":
    const listItemsAfter = wrapper.find(
      ".material-sample-nav .list-group-item"
    );
    expect(
      [listItemsAfter.at(0), listItemsAfter.at(1)].map(item => item.text())
    ).toEqual(["Material Sample Info", "Identifiers"]);
  });

  it("Renders the Material Sample form with a custom default managed attributes order.", async () => {
    const wrapper = await getWrapper({
      formTemplates: {
        MATERIAL_SAMPLE: {
          allowExisting: false,
          allowNew: false,
          templateFields: {
            "managedAttributes.attribute_1": {
              enabled: true,
              defaultValue: "attribute 1 default value"
            }
          }
        }
      },
      navOrder: [],
      managedAttributesOrder: ["attribute_1", "attribute_2"],
      type: "material-sample-form-custom-view"
    });

    // The default attribute values are rendered:
    expect(wrapper.find(".attribute_1-field input").prop("value")).toEqual(
      "attribute 1 default value"
    );
    expect(wrapper.find(".attribute_2-field input").prop("value")).toEqual("");
  });
});
