import { InputResource } from "kitsu";
import Switch from "react-switch";
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
    case "collection-api/collection":
    case "collection-api/vocabulary/materialSampleState":
    case "collection-api/material-sample-type":
    case "collection-api/project":
    case "collection-api/material-sample":
    case "collection-api/managed-attribute":
    case "objectstore-api/metadata":
    case "user-api/group":
      return { data: [] };
  }
});

const mockSave = jest.fn(ops =>
  ops.map(op => ({
    ...op.resource,
    id: op.resource.id ?? "11111"
  }))
);

const testCtx = {
  apiContext: { apiClient: { get: mockGet }, save: mockSave }
};

const mockOnSaved = jest.fn();

const SAMPLES_WITH_DIFFERENT_DETERMINATIONS: InputResource<MaterialSample>[] = [
  {
    ...blankMaterialSample(),
    id: "1",
    type: "material-sample",
    materialSampleName: "MS1",
    collection: { id: "1", type: "collection" },
    determination: [
      {
        isPrimary: true,
        isFileAs: true,
        verbatimScientificName: "test-name-existing"
      }
    ]
  },
  {
    ...blankMaterialSample(),
    id: "2",
    type: "material-sample",
    materialSampleName: "MS2",
    collection: { id: "1", type: "collection" },
    determination: [
      {
        verbatimDeterminer: "this-should-be-overridden"
      }
    ]
  },
  {
    ...blankMaterialSample(),
    id: "3",
    type: "material-sample",
    materialSampleName: "MS3",
    collection: { id: "1", type: "collection" }
  }
];

const SAMPLES_WITHOUT_DETERMINATIONS: InputResource<MaterialSample>[] = [
  {
    ...blankMaterialSample(),
    id: "1",
    type: "material-sample",
    materialSampleName: "MS1",
    collection: { id: "1", type: "collection" },
    determination: []
  },
  {
    ...blankMaterialSample(),
    id: "2",
    type: "material-sample",
    materialSampleName: "MS2",
    collection: { id: "1", type: "collection" },
    determination: null
  },
  {
    ...blankMaterialSample(),
    id: "3",
    type: "material-sample",
    materialSampleName: "MS3",
    collection: { id: "1", type: "collection" }
  }
];

const SAMPLES_WITH_SAME_DETERMINATIONS: InputResource<MaterialSample>[] = [
  {
    ...blankMaterialSample(),
    id: "1",
    type: "material-sample",
    materialSampleName: "MS1",
    collection: { id: "1", type: "collection" },
    determination: [
      { isPrimary: true, isFileAs: true, verbatimScientificName: "first name" },
      { verbatimScientificName: "second name" }
    ]
  },
  {
    ...blankMaterialSample(),
    id: "2",
    type: "material-sample",
    materialSampleName: "MS2",
    collection: { id: "1", type: "collection" },
    determination: [
      { isPrimary: true, isFileAs: true, verbatimScientificName: "first name" },
      { verbatimScientificName: "second name" }
    ]
  },
  {
    ...blankMaterialSample(),
    id: "3",
    type: "material-sample",
    materialSampleName: "MS3",
    collection: { id: "1", type: "collection" },
    determination: [
      { isPrimary: true, isFileAs: true, verbatimScientificName: "first name" },
      { verbatimScientificName: "second name" }
    ]
  }
];

describe("BulkEditTabWarning", () => {
  beforeEach(jest.clearAllMocks);

  it("Shows the warning when there are multiple determination values in the individual samples.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={SAMPLES_WITH_DIFFERENT_DETERMINATIONS}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Enable the determination:
    wrapper
      .find(".tabpanel-EDIT_ALL .enable-determination")
      .find(Switch)
      .prop<any>("onChange")(true);

    await new Promise(setImmediate);
    wrapper.update();

    // You must click the override button:
    expect(
      wrapper.find(".determination-section .multiple-values-warning").exists()
    ).toEqual(true);
    wrapper
      .find(".determination-section button.override-all-button")
      .simulate("click");
    wrapper.find(".are-you-sure-modal form").simulate("submit");
    await new Promise(setImmediate);
    wrapper.update();

    // Override the name in the new determination:
    wrapper
      .find(".tabpanel-EDIT_ALL .verbatimScientificName input")
      .simulate("change", { target: { value: "test-name-override" } });

    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find("button.bulk-save-button").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // Saves the new material samples with the new common determination:
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: expect.objectContaining({
              determination: [
                {
                  isPrimary: true,
                  isFileAs: true,
                  verbatimScientificName: "test-name-override"
                }
              ],
              type: "material-sample"
            }),
            type: "material-sample"
          },
          {
            resource: expect.objectContaining({
              determination: [
                {
                  isPrimary: true,
                  isFileAs: true,
                  verbatimScientificName: "test-name-override"
                }
              ],
              type: "material-sample"
            }),
            type: "material-sample"
          },
          {
            resource: expect.objectContaining({
              determination: [
                {
                  isPrimary: true,
                  isFileAs: true,
                  verbatimScientificName: "test-name-override"
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
  }, 20000);

  it("Keeps the original multiple values if you decide not to click the Override All button.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={SAMPLES_WITH_DIFFERENT_DETERMINATIONS}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Enable the determination:
    wrapper
      .find(".tabpanel-EDIT_ALL .enable-determination")
      .find(Switch)
      .prop<any>("onChange")(true);

    await new Promise(setImmediate);
    wrapper.update();

    // The Override button is there:
    expect(
      wrapper.find(".determination-section .multiple-values-warning").exists()
    ).toEqual(true);

    wrapper.find("button.bulk-save-button").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // Saves the material samples:
    expect(mockSave.mock.calls).toEqual([
      [
        // Keeps the original values:
        SAMPLES_WITH_DIFFERENT_DETERMINATIONS.map(sample => ({
          resource: {
            id: sample.id,
            type: sample.type,
            relationships: {}
          },
          type: "material-sample"
        })),
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  }, 20000);

  it("Lets you set the values without a warning when there are no determinations in the samples.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={SAMPLES_WITHOUT_DETERMINATIONS}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Enable the determination:
    wrapper
      .find(".tabpanel-EDIT_ALL .enable-determination")
      .find(Switch)
      .prop<any>("onChange")(true);

    await new Promise(setImmediate);
    wrapper.update();

    // There is no override button:
    expect(
      wrapper.find(".determination-section .multiple-values-warning").exists()
    ).toEqual(false);

    // Override the name in the new determination:
    wrapper
      .find(".tabpanel-EDIT_ALL .verbatimScientificName input")
      .simulate("change", { target: { value: "test-name-override" } });

    wrapper.find("button.bulk-save-button").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // Saves the material samples:
    expect(mockSave.mock.calls).toEqual([
      [
        SAMPLES_WITHOUT_DETERMINATIONS.map(sample => ({
          resource: {
            id: sample.id,
            type: sample.type,
            determination: [
              {
                isPrimary: true,
                isFileAs: true,
                verbatimScientificName: "test-name-override"
              }
            ],
            relationships: {}
          },
          type: "material-sample"
        })),
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  }, 20000);

  it("Shows the common value when all samples have the same determinations.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={SAMPLES_WITH_SAME_DETERMINATIONS}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Enable the determination:
    wrapper
      .find(".tabpanel-EDIT_ALL .enable-determination")
      .find(Switch)
      .prop<any>("onChange")(true);

    await new Promise(setImmediate);
    wrapper.update();

    // The 2 common determinations are shown in the Edit All tab:
    expect(
      wrapper.find(
        ".tabpanel-EDIT_ALL .determination-section li.react-tabs__tab"
      ).length
    ).toEqual(2);

    // Override the name in the first determination:
    wrapper
      .find(".tabpanel-EDIT_ALL .verbatimScientificName input")
      .simulate("change", { target: { value: "first name override" } });

    wrapper.find("button.bulk-save-button").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // Saves the material samples:
    expect(mockSave.mock.calls).toEqual([
      [
        SAMPLES_WITH_SAME_DETERMINATIONS.map(sample => ({
          resource: {
            id: sample.id,
            type: sample.type,
            determination: [
              {
                isPrimary: true,
                isFileAs: true,
                verbatimScientificName: "first name override"
              },
              { verbatimScientificName: "second name" }
            ],
            relationships: {}
          },
          type: "material-sample"
        })),
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  }, 20000);
});
