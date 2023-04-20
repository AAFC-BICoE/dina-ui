import { InputResource, KitsuResourceLink } from "kitsu";
import Select from "react-select";
import { default as ReactSwitch, default as Switch } from "react-switch";
import { MaterialSampleForm, nextSampleInitialValues } from "../../..";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import {
  ASSOCIATIONS_COMPONENT_NAME,
  blankMaterialSample,
  CollectingEvent,
  COLLECTING_EVENT_COMPONENT_NAME,
  MaterialSample,
  ORGANISMS_COMPONENT_NAME,
  STORAGE_COMPONENT_NAME
} from "../../../../types/collection-api";

// Mock out the dynamic component, which should only be rendered in the browser
jest.mock("next/dynamic", () => () => {
  return function MockDynamicComponent() {
    return <div>Mock dynamic component</div>;
  };
});

function testCollectionEvent(): Partial<CollectingEvent> {
  return {
    startEventDateTime: "2021-04-13",
    verbatimEventDateTime: "2021-04-13",
    id: "1",
    type: "collecting-event",
    group: "test group"
  };
}

function testMaterialSample(): InputResource<MaterialSample> {
  return {
    id: "1",
    type: "material-sample",
    group: "test group",
    materialSampleName: "my-sample-name",
    collectingEvent: {
      id: "1",
      type: "collecting-event"
    },
    attachment: [{ id: "attach-1", type: "metadata" }],
    ...blankMaterialSample()
  };
}

const mockGet = jest.fn<any, any>(async (path) => {
  switch (path) {
    case "collection-api/collecting-event":
      return { data: [testCollectionEvent()] };
    case "collection-api/collecting-event/1?include=collectors,attachment,collectionMethod,protocol":
      // Populate the linker table:
      return { data: testCollectionEvent() };
    case "collection-api/material-sample/1":
      return { data: testMaterialSample() };
    case "collection-api/material-sample":
      return {
        data: [
          { id: "1", materialSampleName: "test name", type: "material-sample" }
        ]
      };
    case "collection-api/preparation-type":
    case "collection-api/managed-attribute":
    case "collection-api/material-sample-type":
    case "user-api/group":
    case "agent-api/person":
    case "collection-api/vocabulary/srs":
    case "collection-api/vocabulary/coordinateSystem":
    case "collection-api/vocabulary/degreeOfEstablishment":
    case "collection-api/vocabulary/materialSampleState":
    case "collection-api/vocabulary/typeStatus":
    case "collection-api/storage-unit-type":
    case "collection-api/storage-unit":
    case "objectstore-api/metadata":
    case "collection-api/collection":
    case "collection-api/collection-method":
    case "collection-api/storage-unit/76575":
    case "collection-api/project":
    case "collection-api/vocabulary/associationType":
    case "collection-api/form-template":
    case "collection-api/vocabulary/materialSampleType":
    case "collection-api/organism":
      return { data: [], meta: { totalResourceCount: 0 } };
  }
});

const mockSave = jest.fn<any, any>(async (saves) => {
  return saves.map((save) => {
    // Test duplicate name error:
    if (
      save.type === "material-sample" &&
      save.resource.materialSampleName === "test-duplicate-name" &&
      !save.resource.allowDuplicateName
    ) {
      throw new Error(
        "Data integrity violation: could not execute statement; SQL [n/a]; constraint [material_sample_name_unique]; nested exception is org.hibernate.exception.ConstraintViolationException: could not execute statement"
      );
    }
    return {
      ...save.resource,
      id: save.resource.id ?? "11111111-1111-1111-1111-111111111111"
    };
  });
});

const mockBulkGet = jest.fn<any, any>(async (paths: string[]) =>
  paths.map((path) => {
    switch (path) {
      case "managed-attribute/MATERIAL_SAMPLE.attribute_1":
        return { id: "1", key: "attribute_1", name: "Attribute 1" };
      case "managed-attribute/MATERIAL_SAMPLE.attribute_2":
        return { id: "2", key: "attribute_2", name: "Attribute 2" };
      case "managed-attribute/MATERIAL_SAMPLE.attribute_3":
        return { id: "3", key: "attribute_3", name: "Attribute 3" };
      case "managed-attribute/COLLECTING_EVENT.attribute_2":
        return { id: "2", key: "attribute_2", name: "Attribute 2" };
      case "managed-attribute/COLLECTING_EVENT.attribute_3":
        return { id: "3", key: "attribute_3", name: "Attribute 3" };
      case "managed-attribute/DETERMINATION.attribute_2":
        return { id: "2", key: "attribute_2", name: "Attribute 2" };
      case "managed-attribute/DETERMINATION.attribute_3":
        return { id: "3", key: "attribute_3", name: "Attribute 3" };
    }
  })
);

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
    // Wait for the page to load.
    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(".spinner-border").exists()).toEqual(false);

    wrapper
      .find(".materialSampleName-field input")
      .simulate("change", { target: { value: "test-material-sample-id" } });
    wrapper
      .find(".verbatimEventDateTime-field input")
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
              otherRecordNumbers: null,
              dwcVerbatimCoordinateSystem: null,
              dwcVerbatimSRS: "WGS84 (EPSG:4326)",
              geoReferenceAssertions: [
                {
                  isPrimary: true
                }
              ],
              relationships: {
                attachment: {
                  data: []
                }
              },
              verbatimEventDateTime: "2019-12-21T16:00",
              publiclyReleasable: true, // Default value
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
              associations: [],
              collectingEvent: {
                id: "11111111-1111-1111-1111-111111111111",
                type: "collecting-event"
              },
              storageUnit: { id: null, type: "storage-unit" },
              materialSampleName: "test-material-sample-id",
              hostOrganism: null,
              managedAttributes: {},
              publiclyReleasable: true, // Default value
              relationships: { organism: { data: [] } },
              type: "material-sample",
              attachment: undefined,
              organism: undefined,
              organismsIndividualEntry: undefined,
              organismsQuantity: undefined,
              projects: undefined,
              isRestricted: false,
              restrictionFieldsExtension: null,
              restrictionRemarks: null,
              scheduledAction: undefined,
              preparationMethod: undefined,
              collection: undefined
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

    await new Promise(setImmediate);
    wrapper.update();

    wrapper
      .find(".materialSampleName-field input")
      .simulate("change", { target: { value: "test-material-sample-id" } });

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
              associations: [],
              collectingEvent: {
                id: "1",
                type: "collecting-event"
              },
              storageUnit: { id: null, type: "storage-unit" },
              materialSampleName: "test-material-sample-id",
              hostOrganism: null,
              managedAttributes: {},
              collection: undefined,
              publiclyReleasable: true, // Default value
              type: "material-sample",
              attachment: undefined,
              organism: undefined,
              organismsIndividualEntry: undefined,
              organismsQuantity: undefined,
              preparationMethod: undefined,
              projects: undefined,
              isRestricted: false,
              restrictionFieldsExtension: null,
              restrictionRemarks: null,
              scheduledAction: undefined,
              relationships: {
                organism: { data: [] }
              }
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

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockSave.mock.calls).toEqual([
      [
        // Edits existing material-sample
        // And only includes the updated field:
        [
          {
            resource: {
              id: "1",
              type: "material-sample",
              materialSampleName: "test-material-sample-id",
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
      wrapper.find(".verbatimEventDateTime-field input").prop("value")
    ).toEqual("2021-04-13");

    wrapper
      .find(
        "#" + COLLECTING_EVENT_COMPONENT_NAME + " button.detach-resource-button"
      )
      .simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // Existing CollectingEvent should be gone:
    expect(
      wrapper.find(".verbatimEventDateTime-field input").prop("value")
    ).toEqual("");

    // Set the new Collecting Event's verbatimEventDateTime:
    wrapper
      .find(".verbatimEventDateTime-field input")
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
              otherRecordNumbers: null,
              dwcVerbatimCoordinateSystem: null,
              dwcVerbatimSRS: "WGS84 (EPSG:4326)",
              geoReferenceAssertions: [
                {
                  isPrimary: true
                }
              ],
              relationships: {
                attachment: {
                  data: []
                }
              },
              verbatimEventDateTime: "2019-12-21T16:00",
              publiclyReleasable: true, // Default Value
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
                id: "11111111-1111-1111-1111-111111111111",
                type: "collecting-event"
              },
              id: "1",
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

  it("Renders an existing Material Sample with the Storage section enabled.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm
        materialSample={{
          type: "material-sample",
          id: "333",
          materialSampleName: "test-ms",
          storageUnit: {
            id: "76575",
            type: "storage-unit",
            name: "test-storage-unit"
          } as KitsuResourceLink
        }}
        onSaved={mockOnSaved}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Storage is enabled:
    expect(
      wrapper.find(".enable-storage").find(ReactSwitch).prop("checked")
    ).toEqual(true);
    expect(wrapper.find("#" + STORAGE_COMPONENT_NAME).exists()).toEqual(true);
  });

  it("Renders an existing Material Sample with the Organisms section enabled.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm
        materialSample={{
          type: "material-sample",
          id: "333",
          materialSampleName: "test-ms",
          organism: [
            {
              type: "organism",
              determination: [
                { verbatimScientificName: "test verbatim scientific name" }
              ]
            }
          ]
        }}
        onSaved={mockOnSaved}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Determinations are enabled:
    expect(
      wrapper.find(".enable-organisms").find(ReactSwitch).prop("checked")
    ).toEqual(true);
    expect(wrapper.find("." + ORGANISMS_COMPONENT_NAME).exists()).toEqual(true);
  });

  it("Renders an existing Material Sample with the Association section enabled.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm
        materialSample={{
          type: "material-sample",
          id: "333",
          materialSampleName: "test-ms",
          associations: [
            { associatedSample: "test name", associationType: "host" }
          ]
        }}
        onSaved={mockOnSaved}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Assoications are enabled:
    expect(
      wrapper.find(".enable-associations").find(ReactSwitch).prop("checked")
    ).toEqual(true);
    expect(wrapper.find("#" + ASSOCIATIONS_COMPONENT_NAME).exists()).toEqual(
      true
    );
  });

  it("Save association with uuid mapped correctly for saving.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm
        materialSample={{
          ...testMaterialSample(),
          id: "333",
          materialSampleName: "test-ms",
          associations: [{ associatedSample: "1", associationType: "host" }]
        }}
        onSaved={mockOnSaved}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Associations are enabled:
    expect(
      wrapper.find(".enable-associations").find(ReactSwitch).prop("checked")
    ).toEqual(true);
    expect(wrapper.find("#" + ASSOCIATIONS_COMPONENT_NAME).exists()).toEqual(
      true
    );

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // Saves the Material Sample:
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              id: "333",
              relationships: {},
              attachment: undefined,
              projects: undefined,
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

  it("Renders an existing Material Sample with all toggleable data components disabled.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm
        materialSample={{
          type: "material-sample",
          id: "333",
          materialSampleName: "test-ms",
          attachment: [],
          organism: []
        }}
        onSaved={mockOnSaved}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Data components are disabled:
    expect(
      wrapper.find(".enable-collecting-event").find(ReactSwitch).prop("checked")
    ).toEqual(false);
    expect(
      wrapper.find(".enable-catalogue-info").find(ReactSwitch).prop("checked")
    ).toEqual(false);
    expect(
      wrapper.find(".enable-organisms").find(ReactSwitch).prop("checked")
    ).toEqual(false);
    expect(
      wrapper.find(".enable-storage").find(ReactSwitch).prop("checked")
    ).toEqual(false);
    expect(
      wrapper
        .find(".enable-scheduled-actions")
        .find(ReactSwitch)
        .prop("checked")
    ).toEqual(false);
  });

  it("Renders an existing Material Sample with the managed attribute when there is selected attribute with assinged value", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm
        materialSample={{
          ...testMaterialSample(),
          id: "333",
          materialSampleName: "test-ms",
          managedAttributes: {
            test_attr: "do the test"
          }
        }}
        onSaved={mockOnSaved}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              id: "333",
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

  it("Submits a new Material Sample with 3 Determinations.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm onSaved={mockOnSaved} />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Set the group:
    wrapper.find(".group-field Select").prop<any>("onChange")({
      label: "group",
      value: "test group"
    });

    wrapper
      .find(".materialSampleName-field input")
      .simulate("change", { target: { value: "test-material-sample-id" } });

    // Enable the Organisms form section:
    wrapper.find(".enable-organisms").find(Switch).prop<any>("onChange")(true);
    await new Promise(setImmediate);
    wrapper.update();

    // Add a determination:
    wrapper.find(".determination-section button.add-button").simulate("click");
    await new Promise(setImmediate);
    wrapper.update();

    function fillOutDetermination(num: number) {
      wrapper
        .find(".verbatimScientificName-field input")
        .last()
        .simulate("change", { target: { value: `test-name-${num}` } });
      wrapper
        .find(".verbatimDeterminer-field input")
        .last()
        .simulate("change", { target: { value: `test-agent-${num}` } });
    }

    // Enter the first determination:
    fillOutDetermination(1);

    // Enter the second determination:
    wrapper.find(".determination-section button.add-button").simulate("click");
    await new Promise(setImmediate);
    fillOutDetermination(2);

    // Enter the third determination:
    wrapper.find(".determination-section button.add-button").simulate("click");
    await new Promise(setImmediate);
    fillOutDetermination(3);

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // Saves the Material Sample:
    expect(mockSave.mock.calls).toEqual([
      // First submits the organism in one transaction:
      [
        [
          {
            resource: {
              determination: [
                {
                  verbatimDeterminer: "test-agent-1",
                  verbatimScientificName: "test-name-1"
                },
                {
                  verbatimDeterminer: "test-agent-2",
                  verbatimScientificName: "test-name-2"
                },
                {
                  verbatimDeterminer: "test-agent-3",
                  verbatimScientificName: "test-name-3"
                }
              ],
              // The organism should get the same group as the Material Sample:
              group: "test group",
              type: "organism"
            },
            type: "organism"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ],
      // Submits the sample with the linked organism:
      [
        [
          {
            resource: expect.objectContaining({
              group: "test group",
              relationships: expect.objectContaining({
                organism: {
                  data: [
                    {
                      id: "11111111-1111-1111-1111-111111111111",
                      type: "organism"
                    }
                  ]
                }
              }),
              type: "material-sample"
            }),
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Creates the next material sample based on the original sample's values.", () => {
    expect(
      nextSampleInitialValues({
        id: "123",
        type: "material-sample",
        createdBy: "Mat",
        createdOn: "2020-05-04",
        materialSampleName: "MY-SAMPLE-001"
      })
    ).toEqual({
      // Omits id/createdBy/createdOn, increments the name:
      type: "material-sample",
      materialSampleName: "MY-SAMPLE-002"
    });

    expect(
      nextSampleInitialValues({
        id: "123",
        type: "material-sample",
        materialSampleName: "MY-SAMPLE-9"
      })
    ).toEqual({
      // Increments the name:
      type: "material-sample",
      materialSampleName: "MY-SAMPLE-10"
    });

    expect(
      nextSampleInitialValues({
        id: "123",
        type: "material-sample",
        materialSampleName: "1-MY-SAMPLE"
      })
    ).toEqual({
      // No way to increment the name, so it becomes blank:
      type: "material-sample",
      materialSampleName: ""
    });

    // Organisms should not be linked to multiple Samples.
    // Instead create new organisms with the same values by omitting the IDs:
    expect(
      nextSampleInitialValues({
        id: "123",
        type: "material-sample",
        materialSampleName: "MY-SAMPLE-100",
        organism: [
          { id: "organism-1", type: "organism", lifeStage: "test lifestage 1" },
          { id: "organism-2", type: "organism", lifeStage: "test lifestage 2" }
        ]
      })
    ).toEqual({
      type: "material-sample",
      materialSampleName: "MY-SAMPLE-101",
      // The original organism IDs should be omitted:
      organism: [
        { type: "organism", lifeStage: "test lifestage 1" },
        { type: "organism", lifeStage: "test lifestage 2" }
      ]
    });
  });

  it("Submits a new Material Sample with a duplicate sample name: Shows an error", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm onSaved={mockOnSaved} />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    wrapper
      .find(".materialSampleName-field input")
      .simulate("change", { target: { value: "test-duplicate-name" } });

    wrapper.find("form").simulate("submit");
    await new Promise(setImmediate);
    wrapper.update();

    expect(
      wrapper.find(".materialSampleName-field input").hasClass("is-invalid")
    ).toEqual(true);

    // You should not be able to submit the form until this error is resolved:
    wrapper.find("form").simulate("submit");
    await new Promise(setImmediate);
    wrapper.update();

    expect(mockOnSaved).toHaveBeenCalledTimes(0);

    // Click the "allow" button:
    wrapper.find("button.allow-duplicate-button").first().simulate("click");
    await new Promise(setImmediate);
    wrapper.update();

    expect(
      wrapper.find(".materialSampleName-field input").hasClass("is-invalid")
    ).toEqual(false);

    // Submit the form with no errors:
    wrapper.find("form").simulate("submit");
    await new Promise(setImmediate);
    wrapper.update();

    // Form submitted successfully:
    expect(mockOnSaved).lastCalledWith("11111111-1111-1111-1111-111111111111");
  });

  it("Add the associated sample selected from search result list to a new association.", async () => {
    // Mount a new material sample with no values
    const wrapper = mountWithAppContext(
      <MaterialSampleForm onSaved={mockOnSaved} />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Enable association:
    wrapper
      .find(".enable-associations")
      .find(ReactSwitch)
      .prop<any>("onChange")(true);

    await new Promise(setImmediate);
    wrapper.update();

    // Add a new association
    wrapper.find("button.add-button").simulate("click");
    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find("button.searchSample")).toBeTruthy();

    // Click the search button to find from a material sample list
    wrapper.find("button.searchSample").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // Search table is shown:
    expect(wrapper.find(".associated-sample-search").exists()).toEqual(true);

    // Select one sample from search result list
    wrapper.find("button.associated-sample-search").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // Expect the selected sample being populated to the sample input
    expect(wrapper.find(".associated-sample-link").text()).toEqual(
      "my-sample-name"
    );
  });

  it("Lets you add an organism to an existing Material Sample", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm
        materialSample={{
          type: "material-sample",
          id: "333",
          group: "test-group",
          materialSampleName: "test-ms"
        }}
        onSaved={mockOnSaved}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Enable the Organisms form section:
    wrapper.find(".enable-organisms").find(Switch).prop<any>("onChange")(true);
    await new Promise(setImmediate);
    wrapper.update();

    // Add 1 new organism:
    wrapper
      .find(".organismsQuantity-field input")
      .simulate("change", { target: { value: 1 } });

    wrapper
      .find(".lifeStage-field input")
      .at(0)
      .simulate("change", { target: { value: "test lifestage" } });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockSave.mock.calls).toEqual([
      // Separate transaction to add the organism:
      [
        [
          {
            resource: {
              // The group is copied from the sample:
              group: "test-group",
              lifeStage: "test lifestage",
              type: "organism"
            },
            type: "organism"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ],
      // Submits the sample:
      [
        [
          {
            resource: expect.objectContaining({
              id: "333",
              relationships: expect.objectContaining({
                organism: {
                  data: [
                    {
                      id: "11111111-1111-1111-1111-111111111111",
                      type: "organism"
                    }
                  ]
                }
              }),
              type: "material-sample"
            }),
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Removes linked organisms when you decrease the Organism Quantity and then submit.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm
        materialSample={{
          type: "material-sample",
          id: "333",
          group: "test-group",
          materialSampleName: "test-ms",
          // This sample already has 3 organisms:
          organism: [
            {
              type: "organism",
              id: "organism-1",
              lifeStage: "lifestage 1",
              group: "test-group"
            },
            {
              type: "organism",
              id: "organism-2",
              lifeStage: "lifestage 2",
              group: "test-group"
            },
            {
              type: "organism",
              id: "organism-3",
              lifeStage: "lifestage 3",
              group: "test-group"
            }
          ]
        }}
        onSaved={mockOnSaved}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find("." + ORGANISMS_COMPONENT_NAME).exists()).toEqual(true);

    // Expand all organism sections:
    wrapper.find("button.expand-organism.not-expanded").at(0).simulate("click");
    wrapper.find("button.expand-organism.not-expanded").at(0).simulate("click");
    wrapper.find("button.expand-organism.not-expanded").at(0).simulate("click");

    // Edit the 3rd organism and leave the 2nd one alone to make sure new and old data is being removed:
    wrapper
      .find(".lifeStage-field input")
      .at(2)
      .simulate("change", { target: { value: "this should be removed" } });

    // Reduce the organisms to 1:
    wrapper
      .find(".organismsQuantity-field input")
      .simulate("change", { target: { value: "1" } });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockSave.mock.calls).toEqual([
      [
        [
          // Only the first organism is kept:
          {
            resource: {
              id: "organism-1",
              group: "test-group",
              lifeStage: "lifestage 1",
              type: "organism"
            },
            type: "organism"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ],
      [
        [
          {
            resource: expect.objectContaining({
              id: "333",
              relationships: expect.objectContaining({
                organism: {
                  data: [
                    {
                      id: "organism-1",
                      type: "organism"
                    }
                  ]
                }
              }),
              type: "material-sample"
            }),
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Lets you remove an organism with the Remove button.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm
        materialSample={{
          type: "material-sample",
          id: "333",
          group: "test-group",
          materialSampleName: "test-ms",
          // This sample already has 2 organisms:
          organism: [
            {
              type: "organism",
              id: "organism-1",
              lifeStage: "lifestage 1",
              group: "test-group"
            },
            {
              type: "organism",
              id: "organism-2",
              lifeStage: "lifestage 2",
              group: "test-group"
            }
          ]
        }}
        onSaved={mockOnSaved}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find("." + ORGANISMS_COMPONENT_NAME).exists()).toEqual(true);

    // Initially has 2 organisms:
    expect(
      wrapper.find(".organismsQuantity-field input").prop("value")
    ).toEqual(2);

    // Remove the first organism:
    wrapper.find("button.remove-organism-button").first().simulate("click");

    // The quantity input is updated:
    expect(
      wrapper.find(".organismsQuantity-field input").prop("value")
    ).toEqual(1);

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockSave.mock.calls).toEqual([
      [
        // Saves only 1 organism (the second one):
        [
          {
            resource: {
              group: "test-group",
              id: "organism-2",
              lifeStage: "lifestage 2",
              type: "organism"
            },
            type: "organism"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ],
      [
        [
          {
            resource: expect.objectContaining({
              id: "333",
              relationships: expect.objectContaining({
                organism: {
                  // Only 1 organism linked now:
                  data: [
                    {
                      id: "organism-2",
                      type: "organism"
                    }
                  ]
                }
              }),
              type: "material-sample"
            }),
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Lets you remove all organisms by setting the quantity to 0.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm
        materialSample={{
          type: "material-sample",
          id: "333",
          group: "test-group",
          materialSampleName: "test-ms",
          // This sample already has 1 organism:
          organism: [
            {
              type: "organism",
              id: "organism-1",
              lifeStage: "lifestage 1",
              group: "test-group"
            }
          ]
        }}
        onSaved={mockOnSaved}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Initially has 1 organism:
    expect(
      wrapper.find(".organismsQuantity-field input").prop("value")
    ).toEqual(1);

    wrapper
      .find(".organismsQuantity-field input")
      .simulate("change", { target: { value: "0" } });

    // The organism fields should be gone to indicate the organisms are gone:
    expect(wrapper.find(".lifeStage-field").exists()).toEqual(false);

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // Saves the Material Sample with no organisms:
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: expect.objectContaining({
              relationships: expect.objectContaining({
                organism: { data: [] }
              }),
              type: "material-sample"
            }),
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Lets you remove all organisms by clearing the Quantity field.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm
        materialSample={{
          type: "material-sample",
          id: "333",
          group: "test-group",
          materialSampleName: "test-ms",
          // This sample already has 1 organism:
          organism: [
            {
              type: "organism",
              id: "organism-1",
              lifeStage: "lifestage 1",
              group: "test-group"
            }
          ]
        }}
        onSaved={mockOnSaved}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Initially has 1 organism:
    expect(
      wrapper.find(".organismsQuantity-field input").prop("value")
    ).toEqual(1);

    // Clear the Quantity field:
    wrapper
      .find(".organismsQuantity-field input")
      .simulate("change", { target: { value: "" } });

    // The organism fields should be gone to indicate the organisms are gone:
    expect(wrapper.find(".lifeStage-field").exists()).toEqual(false);

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // Saves the Material Sample with no organisms:
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: expect.objectContaining({
              relationships: expect.objectContaining({
                organism: { data: [] }
              }),
              type: "material-sample"
            }),
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Lets you add multiple of the SAME Organism by leaving the 'Organisms Individual Entry' toggle off and increasing the Quantity.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm
        materialSample={{
          type: "material-sample",
          id: "333",
          group: "test-group",
          materialSampleName: "test-ms",
          // This sample already has 1 organism:
          organism: [
            {
              type: "organism",
              id: "organism-1",
              lifeStage: "lifestage 1",
              group: "test-group"
            }
          ]
        }}
        onSaved={mockOnSaved}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Initially has 1 organism:
    wrapper
      .find(".organismsQuantity-field input")
      .simulate("change", { target: { value: "3" } });

    wrapper
      .find(".lifeStage-field input")
      .simulate("change", { target: { value: "common-life-stage" } });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // Saves the Material Sample with the organisms:
    expect(mockSave.mock.calls).toEqual([
      [
        // In the first API call, the 3 organisms are saved:
        [
          // This is the initial existing organism with an ID from the form's initial values:
          {
            resource: {
              group: "test-group",
              id: "organism-1",
              lifeStage: "common-life-stage",
              type: "organism"
            },
            type: "organism"
          },
          // New organism which is a copy of Organism #1:
          {
            resource: {
              group: "test-group",
              lifeStage: "common-life-stage",
              type: "organism"
            },
            type: "organism"
          },
          // New organism which is a copy of Organism #1:
          {
            resource: {
              group: "test-group",
              lifeStage: "common-life-stage",
              type: "organism"
            },
            type: "organism"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ],
      [
        [
          {
            resource: expect.objectContaining({
              id: "333",
              relationships: expect.objectContaining({
                organism: {
                  // The first organism is kept, and 2 more copies are added:
                  data: [
                    {
                      id: "organism-1",
                      type: "organism"
                    },
                    {
                      id: "11111111-1111-1111-1111-111111111111",
                      type: "organism"
                    },
                    {
                      id: "11111111-1111-1111-1111-111111111111",
                      type: "organism"
                    }
                  ]
                }
              }),
              type: "material-sample"
            }),
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Lets you edit one of multiple DIFFERENT existing attached organisms.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm
        materialSample={{
          type: "material-sample",
          id: "333",
          group: "test-group",
          materialSampleName: "test-ms",
          // This sample already has 3 DIFFERENT organisms:
          organism: [
            {
              type: "organism",
              id: "organism-1",
              lifeStage: "lifestage 1",
              group: "test-group"
            },
            {
              type: "organism",
              id: "organism-2",
              lifeStage: "lifestage 2",
              group: "test-group"
            },
            {
              type: "organism",
              id: "organism-3",
              lifeStage: "lifestage 3",
              group: "test-group"
            }
          ]
        }}
        onSaved={mockOnSaved}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // 3 organisms in quantity:
    expect(
      wrapper.find(".organismsQuantity-field input").prop("value")
    ).toEqual(3);
    // Individual mode selected by default:
    expect(
      wrapper
        .find(".organismsIndividualEntry-field")
        .find(Switch)
        .prop("checked")
    ).toEqual(true);

    // Renders the initial lifestage values:
    expect(
      wrapper.find(".rt-td.lifeStage-cell").map((cell) => cell.text())
    ).toEqual(["lifestage 1", "lifestage 2", "lifestage 3"]);

    // Expand the 3rd organism:
    wrapper.find("button.expand-organism").at(2).simulate("click");
    // Edit the lifeStage field:
    wrapper
      .find(".lifeStage-field input")
      .simulate("change", { target: { value: "lifestage 3 edited" } });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // Saves the Material Sample with the organisms:
    expect(mockSave.mock.calls).toEqual([
      [
        [
          // Keeps the old values of the first 2 organisms:
          {
            resource: {
              group: "test-group",
              id: "organism-1",
              lifeStage: "lifestage 1",
              type: "organism"
            },
            type: "organism"
          },
          {
            resource: {
              group: "test-group",
              id: "organism-2",
              lifeStage: "lifestage 2",
              type: "organism"
            },
            type: "organism"
          },
          // Adds the new value to the 3rd organism:
          {
            resource: {
              group: "test-group",
              id: "organism-3",
              lifeStage: "lifestage 3 edited",
              type: "organism"
            },
            type: "organism"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ],
      [
        [
          {
            resource: expect.objectContaining({
              id: "333",
              relationships: expect.objectContaining({
                organism: {
                  data: [
                    { id: "organism-1", type: "organism" },
                    { id: "organism-2", type: "organism" },
                    { id: "organism-3", type: "organism" }
                  ]
                }
              }),
              type: "material-sample"
            }),
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Lets you switch from multiple DIFFERENT organisms to multiple SAME organisms.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm
        materialSample={{
          type: "material-sample",
          id: "333",
          group: "test-group",
          materialSampleName: "test-ms",
          // This sample already has 3 DIFFERENT organisms:
          organism: [
            {
              type: "organism",
              id: "organism-1",
              lifeStage: "lifestage 1",
              group: "test-group",
              isTarget: true
            },
            {
              type: "organism",
              id: "organism-2",
              lifeStage: "lifestage 2",
              group: "test-group",
              isTarget: false
            },
            {
              type: "organism",
              id: "organism-3",
              lifeStage: "lifestage 3",
              group: "test-group",
              isTarget: false
            }
          ]
        }}
        onSaved={mockOnSaved}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // 3 organisms in quantity:
    expect(
      wrapper.find(".organismsQuantity-field input").prop("value")
    ).toEqual(3);
    // Individual mode selected by default:
    expect(
      wrapper
        .find(".organismsIndividualEntry-field")
        .find(Switch)
        .prop("checked")
    ).toEqual(true);

    // Switch 'Individual Entry' off:
    wrapper
      .find(".organismsIndividualEntry-field")
      .find(Switch)
      .prop<any>("onChange")(false);
    wrapper.find(".useTargetOrganism-field").find(Switch).prop<any>("onChange")(
      false
    );
    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // Saves the Material Sample with the 3 SAME organisms:
    expect(mockSave.mock.calls).toEqual([
      // IsTarget should be reverted to null.
      // Organism 1's values with "lifestage 1" are copied to the other organisms:
      [
        [
          {
            resource: {
              group: "test-group",
              id: "organism-1",
              lifeStage: "lifestage 1",
              type: "organism",
              isTarget: null
            },
            type: "organism"
          },
          {
            resource: {
              group: "test-group",
              id: "organism-2",
              lifeStage: "lifestage 1",
              type: "organism",
              isTarget: null
            },
            type: "organism"
          },
          {
            resource: {
              group: "test-group",
              id: "organism-3",
              lifeStage: "lifestage 1",
              type: "organism",
              isTarget: null
            },
            type: "organism"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ],
      // The material sample is saved with the same 3 organisms linked:
      [
        [
          {
            resource: expect.objectContaining({
              id: "333",
              relationships: expect.objectContaining({
                organism: {
                  data: [
                    { id: "organism-1", type: "organism" },
                    { id: "organism-2", type: "organism" },
                    { id: "organism-3", type: "organism" }
                  ]
                }
              }),
              type: "material-sample"
            }),
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Changing the target organism should unset all the other organisms as the target", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm
        materialSample={{
          type: "material-sample",
          id: "333",
          group: "test-group",
          materialSampleName: "test-ms",
          // This sample already has 3 DIFFERENT organisms:
          organism: [
            {
              type: "organism",
              id: "organism-1",
              lifeStage: "lifestage 1",
              group: "test-group",
              isTarget: false
            },
            {
              type: "organism",
              id: "organism-2",
              lifeStage: "lifestage 2",
              group: "test-group",
              isTarget: true
            },
            {
              type: "organism",
              id: "organism-3",
              lifeStage: "lifestage 3",
              group: "test-group",
              isTarget: false
            }
          ]
        }}
        onSaved={mockOnSaved}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // 3 organisms in quantity:
    expect(
      wrapper.find(".organismsQuantity-field input").prop("value")
    ).toEqual(3);

    // Individual mode selected by default:
    expect(
      wrapper
        .find(".organismsIndividualEntry-field")
        .find(Switch)
        .prop("checked")
    ).toEqual(true);

    // Expand the first organism section
    wrapper.find("button.expand-organism.not-expanded").at(0).simulate("click");

    // Switch the first organism to be the target.
    wrapper
      .find(".organism_0__isTarget-field")
      .find(Switch)
      .prop<any>("onChange")(true);

    // Submit form
    wrapper.find("form").simulate("submit");
    await new Promise(setImmediate);
    wrapper.update();

    // Check to ensure that
    expect(mockSave.mock.calls).toEqual([
      // Since the first organism was toggled, the second organism should be false now.
      [
        [
          {
            resource: {
              group: "test-group",
              id: "organism-1",
              lifeStage: "lifestage 1",
              type: "organism",
              isTarget: true
            },
            type: "organism"
          },
          {
            resource: {
              group: "test-group",
              id: "organism-2",
              lifeStage: "lifestage 2",
              type: "organism",
              isTarget: false
            },
            type: "organism"
          },
          {
            resource: {
              group: "test-group",
              id: "organism-3",
              lifeStage: "lifestage 3",
              type: "organism",
              isTarget: false
            },
            type: "organism"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ],
      // The material sample is saved with the same 3 organisms linked:
      [
        [
          {
            resource: expect.objectContaining({
              id: "333",
              relationships: expect.objectContaining({
                organism: {
                  data: [
                    { id: "organism-1", type: "organism" },
                    { id: "organism-2", type: "organism" },
                    { id: "organism-3", type: "organism" }
                  ]
                }
              }),
              type: "material-sample"
            }),
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Converts the Sample's determiners from object (front-end format) to UUID (back-end format).", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm
        materialSample={{
          type: "material-sample",
          id: "333",
          group: "test-group",
          materialSampleName: "test-ms",
          // This sample already has 3 DIFFERENT organisms:
          organism: [
            {
              type: "organism",
              id: "organism-1",
              lifeStage: "lifestage 1",
              group: "test-group",
              determination: [
                {
                  isPrimary: true,
                  determiner: [
                    {
                      id: "person-1-uuid",
                      type: "person",
                      displayName: "Person 1"
                    }
                  ]
                },
                {
                  isPrimary: true,
                  determiner: [
                    {
                      id: "person-2-uuid",
                      type: "person",
                      displayName: "Person 2"
                    }
                  ]
                }
              ]
            }
          ]
        }}
        onSaved={mockOnSaved}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Shows the initial determiner value:
    expect(
      wrapper
        .find(".organism_0__determination_0__determiner-field")
        .find(Select)
        .prop("value")
    ).toEqual([
      {
        label: "Person 1",
        resource: {
          displayName: "Person 1",
          id: "person-1-uuid",
          type: "person"
        },
        value: "person-1-uuid"
      }
    ]);

    // Add a second Person to the primary Determination's determiners:
    wrapper
      .find(".organism_0__determination_0__determiner-field")
      .find(Select)
      .prop<any>("onChange")([
      {
        resource: {
          displayName: "Person 1",
          id: "person-1-uuid",
          type: "person"
        }
      },
      {
        resource: {
          displayName: "Person 2",
          id: "person-2-uuid",
          type: "person"
        }
      }
    ]);

    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // Saves the Material Sample with the 3 SAME organisms:
    expect(mockSave.mock.calls).toEqual([
      // Updates the organism with the new determiners:
      [
        [
          {
            resource: {
              determination: [
                {
                  // The new value as IDs only:
                  determiner: ["person-1-uuid", "person-2-uuid"],
                  isPrimary: true
                },
                {
                  determiner: ["person-2-uuid"],
                  isPrimary: true
                }
              ],
              group: "test-group",
              id: "organism-1",
              lifeStage: "lifestage 1",
              type: "organism"
            },
            type: "organism"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ],
      [
        [
          {
            resource: expect.objectContaining({
              id: "333",
              relationships: expect.objectContaining({
                organism: {
                  data: [{ id: "organism-1", type: "organism" }]
                }
              }),
              type: "material-sample"
            }),
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Lets you set a Custom managed attributes view via prop.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm
        materialSample={{
          type: "material-sample",
          id: "333",
          group: "test-group",
          materialSampleName: "test-ms",
          managedAttributes: {
            // Has existing attribute_1 and attribute_2 values:
            attribute_1: "attribute 1 value",
            attribute_2: "attribute 2 value"
          }
        }}
        visibleManagedAttributeKeys={{
          materialSample: ["attribute_2", "attribute_3"]
        }}
        onSaved={mockOnSaved}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Attribute 1 should be hidden:
    expect(wrapper.find(".attribute_1-field input").exists()).toEqual(false);

    // Attribute 2 already has a value:
    expect(wrapper.find(".attribute_2-field input").prop("value")).toEqual(
      "attribute 2 value"
    );
    // Attribute 3 is visible and empty:
    expect(wrapper.find(".attribute_3-field input").prop("value")).toEqual("");

    // Set a new value for attribute 2:
    wrapper
      .find(".attribute_2-field input")
      .simulate("change", { target: { value: "new attribute 2 value" } });

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: expect.objectContaining({
              managedAttributes: {
                // The existing Attribute 1 value is kept event though it was hidden by the custom view:
                attribute_1: "attribute 1 value",
                // The new Attribute 2 value is saved:
                attribute_2: "new attribute 2 value"
              },
              type: "material-sample"
            }),
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Lets you set a Custom Collecting Event managed attributes view via prop.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm
        materialSample={{
          type: "material-sample",
          id: "333",
          group: "test-group",
          materialSampleName: "test-ms"
        }}
        visibleManagedAttributeKeys={{
          collectingEvent: ["attribute_2", "attribute_3"]
        }}
        onSaved={mockOnSaved}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find(".enable-collecting-event").find(Switch).prop<any>("onChange")(
      true
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Attributes 2 and 3 are visible and empty:
    expect(
      wrapper
        .find(
          "#" + COLLECTING_EVENT_COMPONENT_NAME + " .attribute_2-field input"
        )
        .prop("value")
    ).toEqual("");
    expect(
      wrapper
        .find(
          "#" + COLLECTING_EVENT_COMPONENT_NAME + " .attribute_3-field input"
        )
        .prop("value")
    ).toEqual("");
  });

  it("Lets you set a Custom Determination managed attributes view via prop.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleForm
        materialSample={{
          type: "material-sample",
          id: "333",
          group: "test-group",
          materialSampleName: "test-ms"
        }}
        visibleManagedAttributeKeys={{
          determination: ["attribute_2", "attribute_3"]
        }}
        onSaved={mockOnSaved}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find(".enable-organisms").find(Switch).prop<any>("onChange")(true);

    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find(".determination-section button.add-button").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // Attributes 2 and 3 are visible and empty:
    expect(
      wrapper
        .find(
          ".organism_0__determination_0__managedAttributes_attribute_2-field input"
        )
        .prop("value")
    ).toEqual("");
    expect(
      wrapper
        .find(
          ".organism_0__determination_0__managedAttributes_attribute_3-field input"
        )
        .prop("value")
    ).toEqual("");
  });
});
