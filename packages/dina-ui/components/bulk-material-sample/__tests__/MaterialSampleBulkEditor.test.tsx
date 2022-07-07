import Cleave from "cleave.js/react";
import {
  DoOperationsError,
  MaterialSampleSearchHelper,
  ResourceSelect
} from "common-ui";
import { InputResource, PersistedResource } from "kitsu";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { default as ReactSwitch, default as Switch } from "react-switch";
import { AttachmentsEditor } from "../..";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import {
  blankMaterialSample,
  MaterialSample,
  StorageUnit
} from "../../../types/collection-api";
import { MaterialSampleBulkEditor } from "../MaterialSampleBulkEditor";

const TEST_COLLECTING_EVENT = {
  id: "col-event-1",
  type: "collecting-event",
  dwcVerbatimLocality: "test initial locality"
};

const TEST_ACQUISITION_EVENT = {
  id: "acq-event-1",
  type: "acquisition-event",
  receptionRemarks: "test reception remarks"
};

const TEST_COLLECTION_1 = {
  id: "1",
  type: "collection",
  name: "test-collection",
  code: "TC"
};

const TEST_STORAGE_UNIT: PersistedResource<StorageUnit> = {
  id: "su-1",
  type: "storage-unit",
  name: "storage unit 1",
  group: "test-group",
  storageUnitType: {
    id: "storage-type-1",
    type: "storage-unit-type",
    name: "Box",
    group: "test-group"
  }
};

const TEST_STORAGE_UNITS = ["A", "B", "C"].map<PersistedResource<StorageUnit>>(
  id => ({
    id,
    type: "storage-unit",
    group: "test-group",
    name: `storage unit ${id}`,
    storageUnitType: {
      id: "storage-type-1",
      type: "storage-unit-type",
      name: "Box",
      group: "test-group"
    }
  })
);

/** CustomView with the managed attributes enabled for Material Sample, Collecting Event and Determination. */
const TEST_CUSTOM_VIEW_WITH_MANAGED_ATTRIBUTES = {
  id: "cd6d8297-43a0-45c6-b44e-983db917eb11",
  type: "custom-view",
  createdOn: "2022-03-03T16:36:30.422992Z",
  createdBy: "cnc-cm",
  name: "test view with managed attributes",
  group: "cnc",
  restrictToCreatedBy: false,
  viewConfiguration: {
    type: "material-sample-form-custom-view",
    navOrder: ["managedAttributes-section", "identifiers-section"],
    formTemplates: {
      MATERIAL_SAMPLE: {
        templateFields: {
          materialSampleName: { enabled: true, defaultValue: "default id" },
          "organism[0].determination[0].managedAttributes.attribute_1": {
            enabled: true
          },
          "managedAttributes.sample_attribute_1": {
            enabled: true,
            defaultValue: "sample attribute default value"
          }
        }
      },
      COLLECTING_EVENT: {
        templateFields: {
          "managedAttributes.collecting_event_attribute_1": {
            enabled: true
          }
        }
      }
    },
    managedAttributesOrder: ["sample_attribute_1"],
    collectingEventManagedAttributesOrder: ["collecting_event_attribute_1"],
    determinationManagedAttributesOrder: ["determination_attribute_1"]
  }
};

const mockGet = jest.fn<any, any>(async (path, params) => {
  switch (path) {
    case "collection-api/collection/1":
      return { data: TEST_COLLECTION_1 };
    case "collection-api/material-sample/500":
      return {
        data: {
          id: "500",
          type: "material-sample",
          materialSampleName: "material-sample-500"
        }
      };
    case "collection-api/collecting-event/col-event-1?include=collectors,attachment,collectionMethod":
      return { data: TEST_COLLECTING_EVENT };
    case "collection-api/storage-unit":
      if (params?.filter?.rsql === "parentStorageUnit.uuid==su-1") {
        return { data: [TEST_STORAGE_UNIT], meta: { totalResourceCount: 1 } };
      }
      return { data: TEST_STORAGE_UNITS, meta: { totalResourceCount: 3 } };
    case "collection-api/storage-unit/su-1":
      return { data: TEST_STORAGE_UNIT };
    case "collection-api/storage-unit/C":
      return { data: TEST_STORAGE_UNITS[2] };
    case "collection-api/storage-unit-type":
    case "collection-api/collection":
    case "collection-api/collection-method":
    case "collection-api/collecting-event":
    case "objectstore-api/metadata":
    case "agent-api/person":
    case "collection-api/vocabulary/typeStatus":
    case "collection-api/vocabulary/degreeOfEstablishment":
    case "collection-api/preparation-type":
    case "collection-api/material-sample":
    case "collection-api/managed-attribute":
    case "collection-api/vocabulary/materialSampleState":
    case "collection-api/material-sample-type":
    case "collection-api/project":
    case "user-api/group":
    case "collection-api/vocabulary/associationType":
    case "collection-api/vocabulary/srs":
    case "collection-api/vocabulary/coordinateSystem":
    case "collection-api/acquisition-event":
    case "collection-api/custom-view":
    case "collection-api/vocabulary/materialSampleType":
      return { data: [] };
  }
});

const mockBulkGet = jest.fn<any, any>(async (paths: string[]) => {
  return paths.map(path => {
    switch (path) {
      case "metadata/initial-attachment-1":
        return {
          type: "metadata",
          id: "initial-attachment-1",
          originalFileName: "initial-attachment-1"
        };
      case "metadata/initial-attachment-2":
        return {
          type: "metadata",
          id: "initial-attachment-2",
          originalFileName: "initial-attachment-2"
        };
      case "managed-attribute/MATERIAL_SAMPLE.m1":
        return {
          type: "managed-attribute",
          id: "1",
          key: "m1",
          managedAttributeType: "STRING",
          managedAttributeComponent: "MATERIAL_SAMPLE",
          name: "Managed Attribute 1"
        };
      case "managed-attribute/MATERIAL_SAMPLE.m2":
        return {
          type: "managed-attribute",
          id: "2",
          key: "m2",
          managedAttributeType: "STRING",
          managedAttributeComponent: "MATERIAL_SAMPLE",
          name: "Managed Attribute 2"
        };
      case "managed-attribute/MATERIAL_SAMPLE.m3":
        return {
          type: "managed-attribute",
          id: "3",
          key: "m3",
          managedAttributeType: "STRING",
          managedAttributeComponent: "MATERIAL_SAMPLE",
          name: "Managed Attribute 3"
        };
      case "collection/1":
        return TEST_COLLECTION_1;
      case "managed-attribute/MATERIAL_SAMPLE.sample_attribute_1":
        return { id: "1", key: "sample_attribute_1", name: "Attribute 1" };
      case "managed-attribute/DETERMINATION.determination_attribute_1":
        return {
          id: "1",
          key: "determination_attribute_1",
          name: "Attribute 1"
        };
      case "managed-attribute/COLLECTING_EVENT.collecting_event_attribute_1":
        return {
          id: "1",
          key: "collecting_event_attribute_1",
          name: "Attribute 1"
        };
    }
  });
});

const mockSave = jest.fn(ops =>
  ops.map(op => ({
    ...op.resource,
    id: op.resource.id ?? "11111"
  }))
);

const testCtx = {
  apiContext: {
    apiClient: { get: mockGet },
    save: mockSave,
    bulkGet: mockBulkGet
  }
};

const mockOnSaved = jest.fn();

// Samples without IDs:
const TEST_NEW_SAMPLES: InputResource<MaterialSample>[] = [
  {
    type: "material-sample",
    materialSampleName: "MS1",
    collection: { id: "1", type: "collection" }
  },
  {
    type: "material-sample",
    materialSampleName: "MS2",
    collection: { id: "1", type: "collection" }
  },
  {
    type: "material-sample",
    materialSampleName: "MS3",
    collection: { id: "1", type: "collection" }
  }
];

/**
 * These samples have different values on the array fields so they will
 * cause the "Override All" warning box to appear.
 */
const TEST_SAMPLES_DIFFERENT_ARRAY_VALUES: InputResource<MaterialSample>[] = [
  {
    ...blankMaterialSample(),
    id: "1",
    type: "material-sample",
    materialSampleName: "MS1",
    organism: [
      {
        id: "organism-1",
        type: "organism",
        determination: [
          {
            isPrimary: true,
            isFiledAs: true,
            verbatimScientificName: "initial determination 1"
          }
        ]
      },
      {
        id: "organism-2",
        type: "organism",
        determination: [{ verbatimScientificName: "initial determination 2" }]
      }
    ],
    associations: [{ associatedSample: "500", remarks: "initial remarks" }],
    attachment: [{ id: "initial-attachment-1", type: "metadata" }],
    scheduledActions: [
      { actionType: "my-action-type", remarks: "initial action" }
    ]
  },
  {
    ...blankMaterialSample(),
    id: "2",
    type: "material-sample",
    materialSampleName: "MS2"
  },
  {
    ...blankMaterialSample(),
    id: "3",
    type: "material-sample",
    materialSampleName: "MS3"
  }
];

/** Simple flat fields are the same. */
const TEST_SAMPLES_DIFFERENT_FLAT_FIELDS_VALUES: InputResource<MaterialSample>[] =
  [
    {
      ...blankMaterialSample(),
      id: "1",
      type: "material-sample",
      publiclyReleasable: true
    },
    {
      ...blankMaterialSample(),
      id: "2",
      type: "material-sample",
      tags: ["tag1"],
      collection: { id: "c1", type: "collection" },
      projects: [{ id: "p1", type: "project", name: "project 1" }],
      publiclyReleasable: false,
      barcode: "test barcode",
      materialSampleState: "test-ms-state"
    }
  ];

const TEST_SAMPLES_SAME_FLAT_FIELDS_VALUES: InputResource<MaterialSample>[] = [
  "1",
  "2"
].map(id => ({
  ...blankMaterialSample(),
  id,
  type: "material-sample",
  tags: ["tag1"],
  collection: { id: "c1", type: "collection" },
  projects: [{ id: "p1", type: "project", name: "project 1" }],
  publiclyReleasable: false,
  barcode: "test barcode",
  materialSampleState: "test-ms-state"
}));

const TEST_SAMPLES_DIFFERENT_MANAGED_ATTRIBUTES: InputResource<MaterialSample>[] =
  [
    {
      ...blankMaterialSample(),
      id: "1",
      type: "material-sample",
      managedAttributes: {
        m1: "m1 initial value",
        m3: "common m3 value"
      }
    },
    {
      ...blankMaterialSample(),
      id: "2",
      type: "material-sample",
      managedAttributes: {
        m2: "m2 initial value",
        m3: "common m3 value"
      }
    }
  ];

const TEST_SAMPLES_SAME_COLLECTING_EVENT: InputResource<MaterialSample>[] = [
  {
    ...blankMaterialSample(),
    id: "1",
    type: "material-sample",
    collectingEvent: TEST_COLLECTING_EVENT
  },
  {
    ...blankMaterialSample(),
    id: "2",
    type: "material-sample",
    collectingEvent: TEST_COLLECTING_EVENT
  }
];

const TEST_SAMPLES_SAME_COL_AND_ACQ_EVENTS: InputResource<MaterialSample>[] = [
  {
    ...blankMaterialSample(),
    id: "1",
    type: "material-sample",
    collectingEvent: TEST_COLLECTING_EVENT,
    acquisitionEvent: TEST_ACQUISITION_EVENT
  },
  {
    ...blankMaterialSample(),
    id: "2",
    type: "material-sample",
    collectingEvent: TEST_COLLECTING_EVENT,
    acquisitionEvent: TEST_ACQUISITION_EVENT
  }
];

const TEST_SAMPLES_SAME_STORAGE_UNIT: InputResource<MaterialSample>[] = [
  {
    ...blankMaterialSample(),
    id: "1",
    type: "material-sample",
    storageUnit: TEST_STORAGE_UNIT
  },
  {
    ...blankMaterialSample(),
    id: "2",
    type: "material-sample",
    storageUnit: TEST_STORAGE_UNIT
  }
];

const TEST_SAMPLES_SAME_HOST_ORGANISM: InputResource<MaterialSample>[] = [
  {
    ...blankMaterialSample(),
    id: "1",
    type: "material-sample",
    materialSampleName: "sample 1",
    hostOrganism: {
      name: "test host organism"
    }
  },
  {
    ...blankMaterialSample(),
    id: "2",
    type: "material-sample",
    materialSampleName: "sample 2",
    hostOrganism: {
      name: "test host organism"
    }
  }
];

describe("MaterialSampleBulkEditor", () => {
  beforeEach(jest.clearAllMocks);

  it("Bulk creates material samples.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_NEW_SAMPLES}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Edit the first sample:
    wrapper.find("li.sample-tab-0").simulate("click");
    wrapper
      .find(".sample-tabpanel-0 .barcode-field input")
      .simulate("change", { target: { value: "edited-barcode-1" } });

    // Edit the second sample:
    wrapper.find("li.sample-tab-1").simulate("click");
    wrapper
      .find(".sample-tabpanel-1 .barcode-field input")
      .simulate("change", { target: { value: "edited-barcode-2" } });

    // Edit the third sample:
    wrapper.find("li.sample-tab-2").simulate("click");
    wrapper
      .find(".sample-tabpanel-2 .barcode-field input")
      .simulate("change", { target: { value: "edited-barcode-3" } });

    wrapper.find("button.bulk-save-button").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // Saves the new material samples:
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: expect.objectContaining({
              barcode: "edited-barcode-1",
              collection: {
                id: "1",
                type: "collection"
              },
              materialSampleName: "MS1",
              type: "material-sample"
            }),
            type: "material-sample"
          },
          {
            resource: expect.objectContaining({
              barcode: "edited-barcode-2",
              collection: {
                id: "1",
                type: "collection"
              },
              materialSampleName: "MS2",
              type: "material-sample"
            }),
            type: "material-sample"
          },
          {
            resource: expect.objectContaining({
              barcode: "edited-barcode-3",
              collection: {
                id: "1",
                type: "collection"
              },
              materialSampleName: "MS3",
              type: "material-sample"
            }),
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);

    // The saved samples are mocked by mockSave and are passed into the onSaved callback.
    // Check the IDs to make sure they were saved:
    expect(mockOnSaved.mock.calls[0][0].map(sample => sample.id)).toEqual([
      "11111",
      "11111",
      "11111"
    ]);
  });

  it("Shows an error indicator when there is a Collecting Event CLIENT-SIDE validation error.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_NEW_SAMPLES}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Go the the bulk edit tab:
    wrapper.find("li.tab-EDIT_ALL").simulate("click");
    // Enable the collecting event section:
    wrapper
      .find(".tabpanel-EDIT_ALL .enable-collecting-event")
      .find(ReactSwitch)
      .prop<any>("onChange")(true);

    await new Promise(setImmediate);
    wrapper.update();

    // Put an invalid value in startEventDateTime. This is validated locally by yup:
    wrapper
      .find(".tabpanel-EDIT_ALL .startEventDateTime-field")
      .find(Cleave)
      .prop<any>("onChange")({ target: { value: "11111" } });

    // Click the "Save All" button:
    wrapper.find("button.bulk-save-button").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // The tab with the error is given the red text, and the other 3 tabs are unaffected:
    expect(
      wrapper.find("li.tab-EDIT_ALL .text-danger.is-invalid").exists()
    ).toEqual(true);
    expect(
      wrapper.find("li.sample-tab-0 .text-danger.is-invalid").exists()
    ).toEqual(false);
    expect(
      wrapper.find("li.sample-tab-1 .text-danger.is-invalid").exists()
    ).toEqual(false);
    expect(
      wrapper.find("li.sample-tab-2 .text-danger.is-invalid").exists()
    ).toEqual(false);

    // Shows the error message:
    expect(
      wrapper.find(".tabpanel-EDIT_ALL .error-viewer").first().text()
    ).toContain("Start Event Date Time");
    expect(
      wrapper
        .find(".tabpanel-EDIT_ALL .startEventDateTime-field .invalid-feedback")
        .exists()
    ).toEqual(true);
  });

  it("Shows an error indicator on the individual sample tab when there is a Collecting Event SERVER-SIDE validation error.", async () => {
    const mockSaveForBadColEvent = jest.fn(async () => {
      throw new DoOperationsError(
        "",
        { startEventDateTime: "Invalid Collecting Event" },
        [
          {
            errorMessage: "",
            fieldErrors: { startEventDateTime: "Invalid Collecting Event" },
            index: 0
          }
        ]
      );
    });

    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_NEW_SAMPLES}
      />,
      {
        ...testCtx,
        apiContext: {
          ...testCtx.apiContext,
          // Test save error: The second sample has an error on the barcode field:
          save: mockSaveForBadColEvent
        }
      }
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Edit the second sample:
    wrapper.find("li.sample-tab-1").simulate("click");
    // Enable the collecting event section:
    wrapper
      .find(".sample-tabpanel-1 .enable-collecting-event")
      .find(ReactSwitch)
      .prop<any>("onChange")(true);

    await new Promise(setImmediate);
    wrapper.update();

    // Click the "Save All" button:
    wrapper.find("button.bulk-save-button").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // The collecting event was saved separately.
    // TODO let the Collecting Event be saved along with the Material Sample in one transaction.
    expect(mockSaveForBadColEvent).lastCalledWith(
      [
        {
          resource: expect.objectContaining({
            type: "collecting-event"
          }),
          type: "collecting-event"
        }
      ],
      { apiBaseUrl: "/collection-api" }
    );

    // The tab with the error is given the red text, and the other tabs are unaffected:
    expect(
      wrapper.find("li.tab-EDIT_ALL .text-danger.is-invalid").exists()
    ).toEqual(false);
    expect(
      wrapper.find("li.sample-tab-0 .text-danger.is-invalid").exists()
    ).toEqual(false);
    expect(
      wrapper.find("li.sample-tab-1 .text-danger.is-invalid").exists()
    ).toEqual(true);
    expect(
      wrapper.find("li.sample-tab-2 .text-danger.is-invalid").exists()
    ).toEqual(false);

    // Shows the error message:
    expect(
      wrapper.find(".sample-tabpanel-1 .error-viewer").first().text()
    ).toContain("Start Event Date Time");
    expect(
      wrapper
        .find(".sample-tabpanel-1 .startEventDateTime-field .invalid-feedback")
        .exists()
    ).toEqual(true);
  });

  it("Shows an error indicator on the Edit All tab when there is a Collecting Event SERVER-SIDE validation error.", async () => {
    const mockSaveForBadColEvent = jest.fn(async () => {
      throw new DoOperationsError(
        "",
        { startEventDateTime: "Invalid Collecting Event" },
        [
          {
            errorMessage: "",
            fieldErrors: { startEventDateTime: "Invalid Collecting Event" },
            index: 0
          }
        ]
      );
    });

    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_NEW_SAMPLES}
      />,
      {
        ...testCtx,
        apiContext: {
          ...testCtx.apiContext,
          // Test save error: The second sample has an error on the barcode field:
          save: mockSaveForBadColEvent
        }
      }
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Use the Edit All tab:
    wrapper.find("li.tab-EDIT_ALL").simulate("click");

    // Enable the collecting event section:
    wrapper
      .find(".tabpanel-EDIT_ALL .enable-collecting-event")
      .find(ReactSwitch)
      .prop<any>("onChange")(true);

    await new Promise(setImmediate);
    wrapper.update();

    // Click the "Save All" button:
    wrapper.find("button.bulk-save-button").simulate("click");
    await new Promise(setImmediate);
    wrapper.update();

    // The collecting event was saved separately.
    // TODO let the Collecting Event be saved along with the Material Sample in one transaction.
    expect(mockSaveForBadColEvent).lastCalledWith(
      [
        {
          resource: expect.objectContaining({
            type: "collecting-event"
          }),
          type: "collecting-event"
        }
      ],
      { apiBaseUrl: "/collection-api" }
    );

    // The tab with the error is given the red text, and the other tabs are unaffected:
    expect(
      wrapper.find("li.tab-EDIT_ALL .text-danger.is-invalid").exists()
    ).toEqual(true);
    expect(
      wrapper.find("li.sample-tab-0 .text-danger.is-invalid").exists()
    ).toEqual(false);
    expect(
      wrapper.find("li.sample-tab-1 .text-danger.is-invalid").exists()
    ).toEqual(false);
    expect(
      wrapper.find("li.sample-tab-2 .text-danger.is-invalid").exists()
    ).toEqual(false);

    // Shows the error message:
    expect(
      wrapper.find(".tabpanel-EDIT_ALL .error-viewer").first().text()
    ).toContain("Start Event Date Time");
    expect(
      wrapper
        .find(".tabpanel-EDIT_ALL .startEventDateTime-field .invalid-feedback")
        .exists()
    ).toEqual(true);
  });

  it("Shows an error indicator on the Edit All tab when a bulk-edited causes a server-side field error.", async () => {
    const mockSaveForBadBarcode = jest.fn(async () => {
      throw new DoOperationsError("", { barcode: "Invalid Barcode" }, [
        {
          errorMessage: "",
          fieldErrors: { barcode: "Invalid Barcode" },
          index: 0
        }
      ]);
    });

    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_NEW_SAMPLES}
      />,
      {
        ...testCtx,
        apiContext: {
          ...testCtx.apiContext,
          // Test save error: The second sample has an error on the barcode field:
          save: mockSaveForBadBarcode
        }
      }
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Use the Edit All tab:
    wrapper.find("li.tab-EDIT_ALL").simulate("click");

    // Edit the barcode:
    wrapper
      .find(".tabpanel-EDIT_ALL .barcode-field input")
      .simulate("change", { target: { value: "bad barcode" } });

    // Click the "Save All" button:
    wrapper.find("button.bulk-save-button").simulate("click");
    await new Promise(setImmediate);
    wrapper.update();

    // The bulk edit tab is given the red text, and the other tabs are unaffected:
    expect(
      wrapper
        .find(".tabpanel-EDIT_ALL .barcode-field .invalid-feedback")
        .exists()
    ).toEqual(true);
    expect(
      wrapper
        .find(".sample-tabpanel-0 .barcode-field .invalid-feedback")
        .exists()
    ).toEqual(false);
    expect(
      wrapper
        .find(".sample-tabpanel-1 .barcode-field .invalid-feedback")
        .exists()
    ).toEqual(false);
    expect(
      wrapper
        .find(".sample-tabpanel-2 .barcode-field .invalid-feedback")
        .exists()
    ).toEqual(false);
  });

  it("Shows an error indicator on form submit error when the Material Sample save API call fails.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_NEW_SAMPLES}
      />,
      {
        ...testCtx,
        apiContext: {
          ...testCtx.apiContext,
          // Test save error: The second sample has an error on the barcode field:
          save: async () => {
            throw new DoOperationsError("test-error", {}, [
              {
                errorMessage: "",
                fieldErrors: { barcode: "Invalid barcode" },
                index: 1
              }
            ]);
          }
        }
      }
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Click the "Save All" button:
    wrapper.find("button.bulk-save-button").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // The tab with the error is given the red text, and the other 2 tabs are unaffected:
    expect(
      wrapper.find("li.sample-tab-0 .text-danger.is-invalid").exists()
    ).toEqual(false);
    expect(
      wrapper.find("li.sample-tab-1 .text-danger.is-invalid").exists()
    ).toEqual(true);
    expect(
      wrapper.find("li.sample-tab-2 .text-danger.is-invalid").exists()
    ).toEqual(false);

    // Shows the error message at the top of the form in that tab:
    wrapper.find("li.sample-tab-1").simulate("click");
    expect(
      wrapper.find(".sample-tabpanel-1 .error-viewer").first().text()
    ).toContain("Invalid barcode");
    // Shows the error message on the barcode field:
    expect(
      wrapper
        .find(".sample-tabpanel-1 .barcode-field .invalid-feedback")
        .first()
        .text()
    ).toContain("Invalid barcode");
  });

  it("Doesnt override the values when the Override All button is not clicked.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_SAMPLES_DIFFERENT_ARRAY_VALUES}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Enable all the sections with the "Override All" warning boxes:
    [
      ".enable-organisms",
      ".enable-catalogue-info",
      ".enable-associations",
      ".enable-scheduled-actions"
    ].forEach(selector =>
      wrapper
        .find(`.tabpanel-EDIT_ALL ${selector}`)
        .find(Switch)
        .prop<any>("onChange")(true)
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Shows the warnings:
    expect(
      wrapper
        .find(".tabpanel-EDIT_ALL .organisms-section .multiple-values-warning")
        .exists()
    ).toEqual(true);
    expect(
      wrapper
        .find(
          ".tabpanel-EDIT_ALL #material-sample-attachments-section .multiple-values-warning"
        )
        .exists()
    ).toEqual(true);
    expect(
      wrapper
        .find(
          ".tabpanel-EDIT_ALL #associations-section .multiple-values-warning"
        )
        .exists()
    ).toEqual(true);
    expect(
      wrapper
        .find(
          ".tabpanel-EDIT_ALL #scheduled-actions-section .multiple-values-warning"
        )
        .exists()
    ).toEqual(true);

    // Click the "Save All" button without overriding anything:
    wrapper.find("button.bulk-save-button").simulate("click");
    await new Promise(setImmediate);
    wrapper.update();

    // Saves the material samples:
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            // The first sample's warnable values are not touched:
            resource: {
              id: "1",
              relationships: {},
              type: "material-sample",
              associations: undefined,
              attachment: undefined,
              projects: undefined
            },
            type: "material-sample"
          },
          {
            // The warnable fields were not overridden:
            resource: {
              id: "2",
              relationships: {},
              type: "material-sample",
              attachment: undefined,
              projects: undefined
            },
            type: "material-sample"
          },
          {
            // The warnable fields were not overridden:
            resource: {
              id: "3",
              relationships: {},
              type: "material-sample",
              attachment: undefined,
              projects: undefined
            },
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Overrides the values when the Override All buttons are clicked.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_SAMPLES_DIFFERENT_ARRAY_VALUES}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Enable all the sections with the "Override All" warning boxes:
    [
      ".enable-organisms",
      ".enable-catalogue-info",
      ".enable-associations",
      ".enable-scheduled-actions"
    ].forEach(selector =>
      wrapper
        .find(`.tabpanel-EDIT_ALL ${selector}`)
        .find(Switch)
        .prop<any>("onChange")(true)
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Click the Override All buttons:
    for (const section of [
      ".organisms-section",
      "#material-sample-attachments-section",
      "#associations-section",
      "#scheduled-actions-section"
    ]) {
      wrapper.find(`${section} button.override-all-button`).simulate("click");
      wrapper.find(".are-you-sure-modal form").simulate("submit");
      await new Promise(setImmediate);
      wrapper.update();
    }

    // Organisms section opens with an initial value, so it has the green indicator on the fieldset:
    expect(
      wrapper
        .find(".tabpanel-EDIT_ALL fieldset#organisms-section .legend-wrapper")
        .first()
        .hasClass("changed-field")
    ).toEqual(true);
    // The other overidable sections don't have an initial value,
    // so they don't initially show the green indicator on the fieldset:
    expect(
      wrapper
        .find(
          ".tabpanel-EDIT_ALL fieldset#material-sample-attachments-section .legend-wrapper"
        )
        .first()
        .hasClass("changed-field")
    ).toEqual(false);
    expect(
      wrapper
        .find(
          ".tabpanel-EDIT_ALL fieldset#associations-section .legend-wrapper"
        )
        .first()
        .hasClass("changed-field")
    ).toEqual(false);
    // Associations list section opens with an initial value, so it has the green indicator on the fieldset:
    expect(
      wrapper
        .find(
          ".tabpanel-EDIT_ALL fieldset#associations-section fieldset.associations-tabs .legend-wrapper"
        )
        .first()
        .hasClass("changed-field")
    ).toEqual(true);
    expect(
      wrapper
        .find(
          ".tabpanel-EDIT_ALL fieldset#scheduled-actions-section .legend-wrapper"
        )
        .first()
        .hasClass("changed-field")
    ).toEqual(false);

    // Set the override values:
    wrapper.find(".determination-section button.add-button").simulate("click");
    wrapper
      .find(
        ".tabpanel-EDIT_ALL .determination-section .verbatimScientificName input"
      )
      .simulate("change", { target: { value: "new-scientific-name" } });
    wrapper
      .find(".tabpanel-EDIT_ALL #material-sample-attachments-section")
      .find(AttachmentsEditor)
      .prop("onChange")([{ id: "new-attachment-id", type: "metadata" }]);
    wrapper
      .find(".tabpanel-EDIT_ALL #associations-section")
      .find(MaterialSampleSearchHelper)
      .prop("onAssociatedSampleSelected")({
      id: "new-sample-assoc",
      type: "material-sample"
    });
    wrapper
      .find(".tabpanel-EDIT_ALL #associations-section .associationType-field")
      .find(CreatableSelect)
      .prop<any>("onChange")({ value: "has_host" });
    wrapper
      .find(
        ".tabpanel-EDIT_ALL #scheduled-actions-section .actionType-field input"
      )
      .simulate("change", { target: { value: "new-action-type" } });
    wrapper
      .find(".tabpanel-EDIT_ALL #scheduled-actions-section button.add-button")
      .simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // All overridable fieldsets should now have the green bulk edited indicator:
    expect(
      wrapper
        .find(".tabpanel-EDIT_ALL fieldset#organisms-section .legend-wrapper")
        .first()
        .hasClass("has-bulk-edit-value")
    ).toEqual(true);
    expect(
      wrapper
        .find(
          ".tabpanel-EDIT_ALL fieldset#material-sample-attachments-section .legend-wrapper"
        )
        .first()
        .hasClass("has-bulk-edit-value")
    ).toEqual(true);
    expect(
      wrapper
        .find(
          ".tabpanel-EDIT_ALL fieldset#associations-section fieldset.associations-tabs .legend-wrapper"
        )
        .first()
        .hasClass("has-bulk-edit-value")
    ).toEqual(true);
    expect(
      wrapper
        .find(
          ".tabpanel-EDIT_ALL fieldset#scheduled-actions-section .legend-wrapper"
        )
        .first()
        .hasClass("has-bulk-edit-value")
    ).toEqual(true);

    // All Override All buttons should be gone now:
    expect(wrapper.find("button.override-all-button").exists()).toEqual(false);

    // Click the "Save All" button without overriding anything:
    wrapper.find("button.bulk-save-button").simulate("click");
    await new Promise(setImmediate);
    wrapper.update();

    const EXPECTED_ORGANISM_SAVE = {
      resource: {
        determination: [
          {
            verbatimScientificName: "new-scientific-name",
            determiner: undefined
          }
        ],
        type: "organism",
        group: undefined
      },
      type: "organism"
    };

    // Saves the material samples:
    // The warnable fields are overridden with the default/empty values:
    expect(mockSave.mock.calls).toEqual([
      // Creates the same organism 3 times, 1 for each of the 3 samples:
      [[EXPECTED_ORGANISM_SAVE], { apiBaseUrl: "/collection-api" }],
      [[EXPECTED_ORGANISM_SAVE], { apiBaseUrl: "/collection-api" }],
      [[EXPECTED_ORGANISM_SAVE], { apiBaseUrl: "/collection-api" }],
      [
        [
          ...TEST_SAMPLES_DIFFERENT_ARRAY_VALUES.map(sample => ({
            type: "material-sample",
            resource: {
              id: sample.id,
              attachment: undefined,
              organism: undefined,
              organismsIndividualEntry: undefined,
              organismsQuantity: undefined,
              projects: undefined,
              type: sample.type,
              associations: [
                {
                  associatedSample: "new-sample-assoc",
                  associationType: "has_host"
                }
              ],
              scheduledActions: [
                { actionType: "new-action-type", date: expect.anything() }
              ],
              relationships: {
                attachment: {
                  data: [{ id: "new-attachment-id", type: "metadata" }]
                },
                organism: {
                  data: [{ id: "11111", type: "organism" }]
                }
              }
            }
          }))
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Shows the Multiple Values placeholder in bulk editable fields", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_SAMPLES_DIFFERENT_FLAT_FIELDS_VALUES}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    expect(
      wrapper
        .find(".has-multiple-values .tags-field div.react-select__placeholder")
        .text()
    ).toEqual("Multiple Values");
    expect(
      wrapper
        .find(
          ".has-multiple-values .collection-field div.react-select__placeholder"
        )
        .text()
    ).toEqual("Multiple Values");
    expect(
      wrapper
        .find(
          ".has-multiple-values .projects-field div.react-select__placeholder"
        )
        .text()
    ).toEqual("Multiple Values");
    expect(
      wrapper
        .find(
          ".has-multiple-values .publiclyReleasable-field .placeholder-text"
        )
        .text()
    ).toEqual("Multiple Values");
    expect(
      wrapper
        .find(".has-multiple-values .barcode-field input")
        .prop("placeholder")
    ).toEqual("Multiple Values");
    expect(
      wrapper
        .find(".has-multiple-values .materialSampleState-field input")
        .prop("placeholder")
    ).toEqual("Multiple Values");

    // Blank values should be rendered into these fields so the placeholder is visible:
    expect(
      wrapper
        .find(".has-multiple-values .tags-field")
        .find(CreatableSelect)
        .prop("value")
    ).toEqual([]);
    expect(
      wrapper
        .find(".has-multiple-values .collection-field")
        .find(Select)
        .prop("value")
    ).toEqual(null);
    expect(
      wrapper
        .find(".has-multiple-values .materialSampleState-field input")
        .prop("value")
    ).toEqual("");
  });

  it("Shows the common value when multiple fields have the same value.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_SAMPLES_SAME_FLAT_FIELDS_VALUES}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // The common values are displayed in the UI:

    expect(
      wrapper
        .find(".tabpanel-EDIT_ALL .tags-field")
        .find(CreatableSelect)
        .prop("value")
    ).toEqual([
      {
        label: "tag1",
        value: "tag1"
      }
    ]);

    expect(
      wrapper
        .find(".tabpanel-EDIT_ALL .collection-field")
        .find(Select)
        .prop("value")
    ).toEqual({
      label: "c1",
      resource: {
        id: "c1",
        type: "collection"
      },
      value: "c1"
    });

    expect(
      wrapper
        .find(".tabpanel-EDIT_ALL .projects-field")
        .find(Select)
        .prop("value")
    ).toEqual([
      {
        label: "project 1",
        resource: {
          id: "p1",
          name: "project 1",
          type: "project"
        },
        value: "p1"
      }
    ]);

    expect(
      wrapper
        .find(".publiclyReleasable-field label")
        // The field is inverted (Not Publicly Releasable) so false -> true:
        .findWhere(node => node.text().includes("True"))
        .find("input")
        .prop("checked")
    ).toEqual(true);

    expect(
      wrapper.find(".tabpanel-EDIT_ALL .barcode-field input").prop("value")
    ).toEqual("test barcode");

    expect(
      wrapper
        .find(".tabpanel-EDIT_ALL .materialSampleState-field input")
        .prop("value")
    ).toEqual("test-ms-state");

    // Set the barcode to the same value to update the form state
    wrapper
      .find(".tabpanel-EDIT_ALL .barcode-field input")
      .simulate("change", { target: { value: "test barcode" } });

    // Click the "Save All" button without overriding anything:
    wrapper.find("button.bulk-save-button").simulate("click");
    await new Promise(setImmediate);
    wrapper.update();

    // The first sample has the edited barcode, the second sample is unaffected:
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              id: "1",
              attachment: undefined,
              organism: undefined,
              organismsIndividualEntry: undefined,
              organismsQuantity: undefined,
              projects: undefined,
              relationships: {},
              type: "material-sample"
            },
            type: "material-sample"
          },
          {
            resource: {
              id: "2",
              attachment: undefined,
              organism: undefined,
              organismsIndividualEntry: undefined,
              organismsQuantity: undefined,
              projects: undefined,
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

  it("Ignores the submitted value if the field is re-edited to the common value.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_SAMPLES_SAME_FLAT_FIELDS_VALUES}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Has the default common value:
    expect(
      wrapper.find(".tabpanel-EDIT_ALL .barcode-field input").prop("value")
    ).toEqual("test barcode");

    // Manually enter the default value:
    wrapper
      .find(".tabpanel-EDIT_ALL .barcode-field input")
      .simulate("change", { target: { value: "temporary edit" } });
    wrapper
      .find(".tabpanel-EDIT_ALL .barcode-field input")
      .simulate("change", { target: { value: "test barcode" } });
    // Don't show the green indicator if the field is back to its initial value:
    expect(
      wrapper
        .find(".tabpanel-EDIT_ALL .has-bulk-edit-value .barcode-field")
        .exists()
    ).toEqual(false);
    // Has the default common value:
    expect(
      wrapper.find(".tabpanel-EDIT_ALL .barcode-field input").prop("value")
    ).toEqual("test barcode");

    // Edit the first sample's barcode:
    wrapper.find("li.sample-tab-0").simulate("click");
    wrapper
      .find(".sample-tabpanel-0 .barcode-field input")
      .simulate("change", { target: { value: "edited-barcode" } });

    // Save All:
    wrapper.find("button.bulk-save-button").simulate("click");
    await new Promise(setImmediate);
    wrapper.update();

    // Save the collecting event, then save the 2 material samples:
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              id: "1",
              attachment: undefined,
              organism: undefined,
              organismsIndividualEntry: undefined,
              organismsQuantity: undefined,
              projects: undefined,
              barcode: "edited-barcode",
              relationships: {},
              type: "material-sample"
            },
            type: "material-sample"
          },
          {
            resource: {
              id: "2",
              attachment: undefined,
              organism: undefined,
              organismsIndividualEntry: undefined,
              organismsQuantity: undefined,
              projects: undefined,
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

  it("Renders blank values without the has-bulk-edit-value indicator when there is a common field value.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_SAMPLES_SAME_FLAT_FIELDS_VALUES}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Has the default common value:
    expect(
      wrapper.find(".tabpanel-EDIT_ALL .barcode-field input").prop("value")
    ).toEqual("test barcode");

    // Manually erase the default value:
    wrapper
      .find(".tabpanel-EDIT_ALL .barcode-field input")
      .simulate("change", { target: { value: "" } });

    // Shows the blank input without the green indicator:
    expect(
      wrapper.find(".tabpanel-EDIT_ALL .barcode-field input").prop("value")
    ).toEqual("");
    expect(
      wrapper
        .find(".tabpanel-EDIT_ALL .has-bulk-edit-value .barcode-field")
        .exists()
    ).toEqual(false);
  });

  it("Adds the has-bulk-edit-value classname when the field is edited.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_NEW_SAMPLES}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    wrapper
      .find(".tabpanel-EDIT_ALL .barcode-field input")
      .simulate("change", { target: { value: "edited-barcode-1" } });
    expect(
      wrapper
        .find(".tabpanel-EDIT_ALL .has-bulk-edit-value .barcode-field")
        .exists()
    ).toEqual(true);

    wrapper
      .find(".tabpanel-EDIT_ALL .tags-field")
      .find(CreatableSelect)
      .prop<any>("onChange")([{ value: "tag1" }]);
    wrapper.update();
    expect(
      wrapper
        .find(".tabpanel-EDIT_ALL .has-bulk-edit-value .tags-field")
        .exists()
    ).toEqual(true);
  });

  it("Shows the managed attributes for all edited samples.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_SAMPLES_DIFFERENT_MANAGED_ATTRIBUTES}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // All Managed Attributes from all samples are shown in the bulk edit UI:
    expect(
      wrapper
        .find(
          ".tabpanel-EDIT_ALL .visible-attribute-menu .react-select__multi-value__label"
        )
        .map(node => node.text())
    ).toEqual([
      "Managed Attribute 1",
      "Managed Attribute 3",
      "Managed Attribute 2"
    ]);

    // m1 and m2 have multiple values, so show a blank input with a placeholder:
    expect(
      wrapper
        .find(".tabpanel-EDIT_ALL .managedAttributes_m1-field input")
        .prop("value")
    ).toEqual("");
    expect(
      wrapper
        .find(".tabpanel-EDIT_ALL .managedAttributes_m2-field input")
        .prop("value")
    ).toEqual("");
    expect(
      wrapper
        .find(".tabpanel-EDIT_ALL .managedAttributes_m1-field input")
        .prop("placeholder")
    ).toEqual("Multiple Values");
    expect(
      wrapper
        .find(".tabpanel-EDIT_ALL .managedAttributes_m2-field input")
        .prop("placeholder")
    ).toEqual("Multiple Values");
    // m3 has a common value so show the common value in the input:
    expect(
      wrapper
        .find(".tabpanel-EDIT_ALL .managedAttributes_m3-field input")
        .prop("value")
    ).toEqual("common m3 value");
  });

  it("Shows the has-bulk-edit-value classname for linked resources with nested forms.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_NEW_SAMPLES}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Enable the collecting event section:
    wrapper
      .find(".tabpanel-EDIT_ALL .enable-collecting-event")
      .find(ReactSwitch)
      .prop<any>("onChange")(true);

    await new Promise(setImmediate);
    wrapper.update();

    // The has-bulk-edit-value indicator appears:
    expect(
      wrapper
        .find(
          ".tabpanel-EDIT_ALL fieldset#collecting-event-section .legend-wrapper"
        )
        .first()
        .find(".has-bulk-edit-value .field-label")
        .exists()
    ).toEqual(true);
  });

  it("Creates and links a common Collecting Event to all samples", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_NEW_SAMPLES}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Enable the collecting event section:
    wrapper
      .find(".tabpanel-EDIT_ALL .enable-collecting-event")
      .find(ReactSwitch)
      .prop<any>("onChange")(true);

    await new Promise(setImmediate);
    wrapper.update();

    // The collecting event section has the green legend to indicate a bulk edit:
    expect(
      wrapper
        .find(
          ".tabpanel-EDIT_ALL fieldset#collecting-event-section .legend-wrapper"
        )
        .first()
        .find(".has-bulk-edit-value .field-label")
        .exists()
    ).toEqual(true);

    // Edit a collecting event field:
    wrapper
      .find(".tabpanel-EDIT_ALL .dwcVerbatimLocality-field input")
      .simulate("change", { target: { value: "test locality" } });

    // Save All:
    wrapper.find("button.bulk-save-button").simulate("click");
    await new Promise(setImmediate);
    wrapper.update();

    // Save the collecting event, then save the 2 material samples:
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: expect.objectContaining({
              dwcVerbatimLocality: "test locality",
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
                id: "11111",
                type: "collecting-event"
              },
              type: "material-sample"
            }),
            type: "material-sample"
          },
          {
            resource: expect.objectContaining({
              collectingEvent: {
                id: "11111",
                type: "collecting-event"
              },
              type: "material-sample"
            }),
            type: "material-sample"
          },
          {
            resource: expect.objectContaining({
              collectingEvent: {
                id: "11111",
                type: "collecting-event"
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

  it("Shows the common Collecting Event when all samples are linked to the same one.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_SAMPLES_SAME_COLLECTING_EVENT}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Enable the collecting event section:
    wrapper
      .find(".tabpanel-EDIT_ALL .enable-collecting-event")
      .find(ReactSwitch)
      .prop<any>("onChange")(true);

    await new Promise(setImmediate);
    wrapper.update();

    // The collecting event section has a green legend to indicate a bulk edit (event without setting a new Collecting Event):
    expect(
      wrapper
        .find(
          ".tabpanel-EDIT_ALL fieldset#collecting-event-section .legend-wrapper"
        )
        .first()
        .find(".has-bulk-edit-value .field-label")
        .exists()
    ).toEqual(true);

    expect(
      wrapper
        .find(".tabpanel-EDIT_ALL .dwcVerbatimLocality-field input")
        .prop("value")
    ).toEqual("test initial locality");

    // Edit the common collecting event:
    wrapper
      .find(".tabpanel-EDIT_ALL .dwcVerbatimLocality-field input")
      .simulate("change", { target: { value: "bulk edited locality" } });

    // Save All:
    wrapper.find("button.bulk-save-button").simulate("click");
    await new Promise(setImmediate);
    wrapper.update();

    // Save the collecting event, then save the 2 material samples:
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: expect.objectContaining({
              dwcVerbatimLocality: "bulk edited locality",
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
            resource: {
              collectingEvent: {
                id: "col-event-1",
                type: "collecting-event"
              },
              relationships: {},
              id: "1",
              attachment: undefined,
              organism: undefined,
              organismsIndividualEntry: undefined,
              organismsQuantity: undefined,
              projects: undefined,
              type: "material-sample"
            },
            type: "material-sample"
          },
          {
            resource: {
              collectingEvent: {
                id: "col-event-1",
                type: "collecting-event"
              },
              relationships: {},
              id: "2",
              attachment: undefined,
              organism: undefined,
              organismsIndividualEntry: undefined,
              organismsQuantity: undefined,
              projects: undefined,
              type: "material-sample"
            },
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Lets you bulk reassign the linked storage", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_SAMPLES_SAME_STORAGE_UNIT}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    wrapper
      .find(".tabpanel-EDIT_ALL .enable-storage")
      .find(Switch)
      .prop<any>("onChange")(true);
    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find(".tabpanel-EDIT_ALL button.remove-storage").simulate("click");
    await new Promise(setImmediate);
    wrapper.update();

    // Assign a different storage unit:
    wrapper
      .find(".tabpanel-EDIT_ALL button.select-storage")
      .last()
      .simulate("click");
    await new Promise(setImmediate);
    wrapper.update();

    // Green indicator shows up:
    expect(
      wrapper.find(".has-bulk-edit-value .storageUnit-field").exists()
    ).toEqual(true);
    // New linked storage unit is indicated:
    expect(
      wrapper.find(".tabpanel-EDIT_ALL .storageUnit-field .storage-path").text()
    ).toEqual("Box storage unit C");

    // Save the samples with the new storage unit:
    wrapper.find("button.bulk-save-button").simulate("click");
    await new Promise(setImmediate);
    wrapper.update();

    // Saves the new material samples with the new storage unit:
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              id: "1",
              attachment: undefined,
              organism: undefined,
              organismsIndividualEntry: undefined,
              organismsQuantity: undefined,
              projects: undefined,
              relationships: {},
              storageUnit: {
                id: "C",
                type: "storage-unit"
              },
              type: "material-sample"
            },
            type: "material-sample"
          },
          {
            resource: {
              id: "2",
              attachment: undefined,
              organism: undefined,
              organismsIndividualEntry: undefined,
              organismsQuantity: undefined,
              projects: undefined,
              relationships: {},
              storageUnit: {
                id: "C",
                type: "storage-unit"
              },
              type: "material-sample"
            },
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Edits the nested hostOrganism field.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_SAMPLES_SAME_HOST_ORGANISM}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Enable host organism fields:
    wrapper
      .find(".tabpanel-EDIT_ALL .enable-associations")
      .find(Switch)
      .prop<any>("onChange")(true);
    await new Promise(setImmediate);
    wrapper.update();

    wrapper
      .find(".tabpanel-EDIT_ALL .hostOrganism_remarks-field textarea")
      .simulate("change", { target: { value: "bulk-edit-remarks" } });

    // Save the samples:
    wrapper.find("button.bulk-save-button").simulate("click");
    await new Promise(setImmediate);
    wrapper.update();

    // Saves the new material samples with the new storage unit:
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              id: "1",
              associations: [],
              hostOrganism: {
                name: "test host organism",
                remarks: "bulk-edit-remarks"
              },
              relationships: {},
              type: "material-sample"
            },
            type: "material-sample"
          },
          {
            resource: {
              id: "2",
              hostOrganism: {
                name: "test host organism",
                remarks: "bulk-edit-remarks"
              },
              associations: [],
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

  it("Disables the nested Collecting event and Acquisition Events forms in the individual sample tabs.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_SAMPLES_SAME_COL_AND_ACQ_EVENTS}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // The individual sample tab has read-only Col and Acq Event forms (no input elements):
    wrapper.find("li.sample-tab-0").simulate("click");
    expect(
      wrapper
        .find(
          ".sample-tabpanel-0 #collecting-event-section .dwcVerbatimLocality-field input"
        )
        .exists()
    ).toEqual(false);
    expect(
      wrapper
        .find(
          ".sample-tabpanel-0 #acquisition-event-section .receptionRemarks-field input"
        )
        .exists()
    ).toEqual(false);
  });

  it("Allows adding NEW nested Collecting and Acquisition Events in the individual sample tabs.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_NEW_SAMPLES}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Edit the first sample only:
    wrapper.find("li.sample-tab-0").simulate("click");

    // Enable the collecting event section:
    wrapper
      .find(".sample-tabpanel-0 .enable-collecting-event")
      .find(ReactSwitch)
      .prop<any>("onChange")(true);
    // Enable the acquisition event section:
    wrapper
      .find(".sample-tabpanel-0 .enable-acquisition-event")
      .find(ReactSwitch)
      .prop<any>("onChange")(true);

    await new Promise(setImmediate);
    wrapper.update();

    wrapper
      .find(
        ".sample-tabpanel-0 #collecting-event-section .dwcVerbatimLocality-field input"
      )
      .simulate("change", { target: { value: "test locality" } });
    wrapper
      .find(
        ".sample-tabpanel-0 #acquisition-event-section .receptionRemarks-field textarea"
      )
      .simulate("change", { target: { value: "test remarks" } });

    // Save the samples:
    wrapper.find("button.bulk-save-button").simulate("click");
    await new Promise(setImmediate);
    wrapper.update();

    // Saves the new material samples with the new storage unit:
    expect(mockSave.mock.calls).toEqual([
      // Creates the new Col Event:
      [
        [
          {
            resource: expect.objectContaining({
              type: "collecting-event",
              dwcVerbatimLocality: "test locality"
            }),
            type: "collecting-event"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ],
      // Creates the new Acq Event:
      [
        [
          {
            resource: {
              receptionRemarks: "test remarks",
              type: "acquisition-event"
            },
            type: "acquisition-event"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ],
      [
        [
          // Creates the first sample with the attached events:
          {
            resource: expect.objectContaining({
              acquisitionEvent: {
                id: "11111",
                type: "acquisition-event"
              },
              collectingEvent: {
                id: "11111",
                type: "collecting-event"
              },
              type: "material-sample"
            }),
            type: "material-sample"
          },
          // Creates the next 2 samples without the attached events:
          {
            resource: expect.objectContaining({
              acquisitionEvent: {
                id: null,
                type: "acquisition-event"
              },
              collectingEvent: {
                id: null,
                type: "collecting-event"
              },
              type: "material-sample"
            }),
            type: "material-sample"
          },
          {
            resource: expect.objectContaining({
              acquisitionEvent: {
                id: null,
                type: "acquisition-event"
              },
              collectingEvent: {
                id: null,
                type: "collecting-event"
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

  it("Allows selecting a Custom View to show/hide fields in the bulk and single tass.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_NEW_SAMPLES}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Select a custom view:
    wrapper
      .find(".material-sample-custom-view-select")
      .find(ResourceSelect)
      .prop<any>("onChange")(TEST_CUSTOM_VIEW_WITH_MANAGED_ATTRIBUTES);

    await new Promise(setImmediate);
    wrapper.update();

    // Enable Collecting Event:
    wrapper
      .find(".tabpanel-EDIT_ALL .enable-collecting-event")
      .find(ReactSwitch)
      .prop<any>("onChange")(true);
    // Enable Organism and Determination:
    wrapper
      .find(".tabpanel-EDIT_ALL .enable-organisms")
      .find(ReactSwitch)
      .prop<any>("onChange")(true);
    await new Promise(setImmediate);
    wrapper.update();
    wrapper.find(".determination-section button.add-button").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // The bulk edit tab shows the managed attributes from the CustomView:
    // For Material Sample:
    expect(
      wrapper
        .find(
          ".tabpanel-EDIT_ALL #managedAttributes-section .managedAttributes_sample_attribute_1-field input"
        )
        .exists()
    ).toEqual(true);
    // For Collecting Event:
    expect(
      wrapper
        .find(
          ".tabpanel-EDIT_ALL #collecting-event-section .managedAttributes_collecting_event_attribute_1-field input"
        )
        .exists()
    ).toEqual(true);
    // For Determination:
    expect(
      wrapper
        .find(
          ".tabpanel-EDIT_ALL #managedAttributes-section .managedAttributes_sample_attribute_1-field input"
        )
        .exists()
    ).toEqual(true);

    // Switch to the first individual sample tab:
    wrapper.find("li.sample-tab-0").simulate("click");

    // Enable Collecting Event:
    wrapper
      .find(".sample-tabpanel-0 .enable-collecting-event")
      .find(ReactSwitch)
      .prop<any>("onChange")(true);
    // Enable Organism and Determination:
    wrapper
      .find(".sample-tabpanel-0 .enable-organisms")
      .find(ReactSwitch)
      .prop<any>("onChange")(true);
    await new Promise(setImmediate);
    wrapper.update();
    wrapper
      .find(".sample-tabpanel-0 .determination-section button.add-button")
      .simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // The individual sample tab tab shows the managed attributes from the CustomView:
    // For Material Sample:
    expect(
      wrapper
        .find(
          ".sample-tabpanel-0 #managedAttributes-section .managedAttributes_sample_attribute_1-field input"
        )
        .exists()
    ).toEqual(true);
    // For Collecting Event:
    expect(
      wrapper
        .find(
          ".sample-tabpanel-0 #collecting-event-section .managedAttributes_collecting_event_attribute_1-field input"
        )
        .exists()
    ).toEqual(true);
    // For Determination:
    expect(
      wrapper
        .find(
          ".sample-tabpanel-0 #managedAttributes-section .managedAttributes_sample_attribute_1-field input"
        )
        .exists()
    ).toEqual(true);
  });
});
