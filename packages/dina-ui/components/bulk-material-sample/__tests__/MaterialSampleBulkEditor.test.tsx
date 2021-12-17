import Cleave from "cleave.js/react";
import { DoOperationsError, MaterialSampleSearchHelper } from "common-ui";
import { InputResource } from "kitsu";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { default as ReactSwitch, default as Switch } from "react-switch";
import { AttachmentsEditor } from "../..";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import {
  blankMaterialSample,
  MaterialSample
} from "../../../types/collection-api";
import { MaterialSampleBulkEditor } from "../MaterialSampleBulkEditor";

const mockGet = jest.fn<any, any>(async path => {
  switch (path) {
    case "collection-api/collection/1":
      return {
        data: {
          id: "1",
          type: "collection",
          name: "test-collection",
          code: "TC"
        }
      };
    case "collection-api/material-sample/500":
      return {
        data: {
          id: "500",
          type: "material-sample",
          materialSampleName: "material-sample-500"
        }
      };
    case "collection-api/collection":
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
      case "/managed-attribute/MATERIAL_SAMPLE.m1":
        return {
          type: "managed-attribute",
          id: "1",
          key: "m1",
          managedAttributeType: "STRING",
          managedAttributeComponent: "MATERIAL_SAMPLE",
          name: "Managed Attribute 1"
        };
      case "/managed-attribute/MATERIAL_SAMPLE.m2":
        return {
          type: "managed-attribute",
          id: "2",
          key: "m2",
          managedAttributeType: "STRING",
          managedAttributeComponent: "MATERIAL_SAMPLE",
          name: "Managed Attribute 2"
        };
      case "/managed-attribute/MATERIAL_SAMPLE.m3":
        return {
          type: "managed-attribute",
          id: "3",
          key: "m3",
          managedAttributeType: "STRING",
          managedAttributeComponent: "MATERIAL_SAMPLE",
          name: "Managed Attribute 3"
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
    determination: [
      {
        isPrimary: true,
        isFileAs: true,
        verbatimScientificName: "initial determination 1"
      },
      { verbatimScientificName: "initial determination 2" }
    ],
    associations: [{ associatedSample: "500", remarks: "initial remarks" }],
    attachment: [{ id: "initial-attachment-1", type: "metadata" }],
    preparationAttachment: [{ id: "initial-attachment-2", type: "metadata" }],
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
  }, 20000);

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

    // Edit the second sample:
    wrapper.find("li.sample-tab-1").simulate("click");
    // Enable the collecting event section:
    wrapper
      .find(".sample-tabpanel-1 .enable-collecting-event")
      .find(ReactSwitch)
      .prop<any>("onChange")(true);

    await new Promise(setImmediate);
    wrapper.update();

    // Put an invalid value in startEventDateTime. This is validated locally by yup:
    wrapper
      .find(".sample-tabpanel-1 .startEventDateTime-field")
      .find(Cleave)
      .prop<any>("onChange")({ target: { value: "11111" } });

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

    // Shows the error message:
    expect(
      wrapper.find(".sample-tabpanel-1 .error-viewer").first().text()
    ).toContain("Start Event Date Time");
    expect(
      wrapper
        .find(".sample-tabpanel-1 .startEventDateTime-field .invalid-feedback")
        .exists()
    ).toEqual(true);
  }, 20000);

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
  }, 20000);

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
  }, 20000);

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
  }, 20000);

  it("Doesn't override the values when the Override All button is not clicked.", async () => {
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
      ".enable-determination",
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
        .find(
          ".tabpanel-EDIT_ALL .determination-section .multiple-values-warning"
        )
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
          ".tabpanel-EDIT_ALL #preparation-protocols-section .multiple-values-warning"
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
              type: "material-sample"
            },
            type: "material-sample"
          },
          {
            // The warnable fields were not overridden:
            resource: {
              id: "2",
              relationships: {},
              type: "material-sample"
            },
            type: "material-sample"
          },
          {
            // The warnable fields were not overridden:
            resource: {
              id: "3",
              relationships: {},
              type: "material-sample"
            },
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  }, 20000);

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
      ".enable-determination",
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
      ".determination-section",
      "#material-sample-attachments-section",
      "#preparation-protocols-section",
      "#associations-section",
      "#scheduled-actions-section"
    ]) {
      wrapper.find(`${section} button.override-all-button`).simulate("click");
      wrapper.find(".are-you-sure-modal form").simulate("submit");
      await new Promise(setImmediate);
      wrapper.update();
    }

    // Set the override values.
    // Leaving the fields empty after clicking Override All
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
      .find(".tabpanel-EDIT_ALL #preparation-protocols-section")
      .find(AttachmentsEditor)
      .prop("onChange")([
      { id: "new-preparation-attachment-id", type: "metadata" }
    ]);
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
      .find(".tabpanel-EDIT_ALL #scheduled-actions-section button.save-button")
      .simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // All Override All buttons should be gone now:
    expect(wrapper.find("button.override-all-button").exists()).toEqual(false);

    // Click the "Save All" button without overriding anything:
    wrapper.find("button.bulk-save-button").simulate("click");
    await new Promise(setImmediate);
    wrapper.update();

    // Saves the material samples:
    // The warnable fields are overridden with the default/empty values:
    expect(mockSave.mock.calls).toEqual([
      [
        [
          ...TEST_SAMPLES_DIFFERENT_ARRAY_VALUES.map(sample => ({
            type: "material-sample",
            resource: {
              id: sample.id,
              type: sample.type,
              associations: [
                {
                  associatedSample: "new-sample-assoc",
                  associationType: "has_host"
                }
              ],
              determination: [
                {
                  isFileAs: true,
                  isPrimary: true,
                  verbatimScientificName: "new-scientific-name"
                }
              ],
              scheduledActions: [
                { actionType: "new-action-type", date: expect.anything() }
              ],
              relationships: {
                attachment: {
                  data: [{ id: "new-attachment-id", type: "metadata" }]
                },
                preparationAttachment: {
                  data: [
                    { id: "new-preparation-attachment-id", type: "metadata" }
                  ]
                }
              }
            }
          }))
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  }, 20000);

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
  }, 20000);

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

    // Saves the material samples:
    // The common values displayed in the UI are not re-updated:
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              id: "1",
              relationships: {},
              type: "material-sample"
            },
            type: "material-sample"
          },
          {
            resource: {
              id: "2",
              relationships: {},
              type: "material-sample"
            },
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  }, 20000);

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
  }, 20000);

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
          ".tabpanel-EDIT_ALL .editable-attribute-menu .react-select__multi-value__label"
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
  }, 20000);

  it("Doesn't show the has-bulk-edit-value classname in nested forms.", async () => {
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

    // Edit a collecting event field:
    wrapper
      .find(".tabpanel-EDIT_ALL .dwcVerbatimLocality-field input")
      .simulate("change", { target: { value: "test locality bulk edit" } });
    expect(
      wrapper
        .find(".tabpanel-EDIT_ALL .dwcVerbatimLocality-field input")
        .prop("value")
    ).toEqual("test locality bulk edit");
    // The has-bulk-edit-value indicator doesn't appear:
    expect(
      wrapper.find(".has-bulk-edit-value .dwcVerbatimLocality-field").exists()
    ).toEqual(false);
  });
});
