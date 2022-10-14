import { InputResource } from "kitsu";
import Switch from "react-switch";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import {
  blankMaterialSample,
  MaterialSample,
  ORGANISMS_COMPONENT_NAME
} from "../../../types/collection-api";
import { MaterialSampleBulkEditor } from "../../bulk-material-sample/MaterialSampleBulkEditor";
import { isEqual } from "lodash";

const mockGet = jest.fn<any, any>(async (path) => {
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

const mockSave = jest.fn((ops) =>
  ops.map((op) => ({
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
    organism: [
      {
        id: "organism-1",
        type: "organism",
        determination: [
          {
            isPrimary: true,
            isFiledAs: true,
            verbatimScientificName: "test-name-existing"
          }
        ]
      }
    ]
  },
  {
    ...blankMaterialSample(),
    id: "2",
    type: "material-sample",
    materialSampleName: "MS2",
    collection: { id: "1", type: "collection" },
    organism: [
      {
        id: "organism-1",
        type: "organism",
        determination: [
          {
            verbatimDeterminer: "this-should-be-overridden"
          }
        ]
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

const SAMPLES_WITHOUT_ORGANISMS: InputResource<MaterialSample>[] = [
  {
    ...blankMaterialSample(),
    id: "1",
    type: "material-sample",
    materialSampleName: "MS1",
    collection: { id: "1", type: "collection" },
    organism: []
  },
  {
    ...blankMaterialSample(),
    id: "2",
    type: "material-sample",
    materialSampleName: "MS2",
    collection: { id: "1", type: "collection" },
    organism: null
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
    organism: [
      {
        type: "organism",
        determination: [
          {
            isPrimary: true,
            isFiledAs: true,
            verbatimScientificName: "first name"
          },
          { verbatimScientificName: "second name" }
        ]
      }
    ]
  },
  {
    ...blankMaterialSample(),
    id: "2",
    type: "material-sample",
    materialSampleName: "MS2",
    collection: { id: "1", type: "collection" },
    organism: [
      {
        type: "organism",
        determination: [
          {
            isPrimary: true,
            isFiledAs: true,
            verbatimScientificName: "first name"
          },
          { verbatimScientificName: "second name" }
        ]
      }
    ]
  },
  {
    ...blankMaterialSample(),
    id: "3",
    type: "material-sample",
    materialSampleName: "MS3",
    collection: { id: "1", type: "collection" },
    organism: [
      {
        type: "organism",
        determination: [
          {
            isPrimary: true,
            isFiledAs: true,
            verbatimScientificName: "first name"
          },
          { verbatimScientificName: "second name" }
        ]
      }
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
      .find(".tabpanel-EDIT_ALL .enable-organisms")
      .find(Switch)
      .prop<any>("onChange")(true);

    await new Promise(setImmediate);
    wrapper.update();

    // You must click the override button:
    expect(
      wrapper
        .find("." + ORGANISMS_COMPONENT_NAME + " .multiple-values-warning")
        .exists()
    ).toEqual(true);
    wrapper
      .find("." + ORGANISMS_COMPONENT_NAME + " button.override-all-button")
      .simulate("click");
    wrapper.find(".are-you-sure-modal form").simulate("submit");
    await new Promise(setImmediate);
    wrapper.update();

    // Add a determination and override its name:
    wrapper
      .find(".tabpanel-EDIT_ALL .determination-section button.add-button")
      .simulate("click");
    await new Promise(setImmediate);
    wrapper.update();
    wrapper
      .find(".tabpanel-EDIT_ALL .verbatimScientificName input")
      .simulate("change", { target: { value: "test-name-override" } });

    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find("button.bulk-save-button").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    const EXPECTED_ORGANISM_SAVE = {
      resource: {
        determination: [{ verbatimScientificName: "test-name-override" }],
        type: "organism"
      },
      type: "organism"
    };

    // Saves the new material samples with the new common determination:
    expect(mockSave.mock.calls).toEqual([
      // Creates the same organism 3 times, 1 for each of the 3 samples:
      [[EXPECTED_ORGANISM_SAVE], { apiBaseUrl: "/collection-api" }],
      [[EXPECTED_ORGANISM_SAVE], { apiBaseUrl: "/collection-api" }],
      [[EXPECTED_ORGANISM_SAVE], { apiBaseUrl: "/collection-api" }],
      // Saves the 3 samples (with linked organisms) in one transaction:
      [
        [
          {
            resource: expect.objectContaining({
              relationships: {
                organism: {
                  data: [{ id: "11111", type: "organism" }]
                }
              },
              type: "material-sample"
            }),
            type: "material-sample"
          },
          {
            resource: expect.objectContaining({
              relationships: {
                organism: {
                  data: [{ id: "11111", type: "organism" }]
                }
              },
              type: "material-sample"
            }),
            type: "material-sample"
          },
          {
            resource: expect.objectContaining({
              relationships: {
                organism: {
                  data: [{ id: "11111", type: "organism" }]
                }
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
      .find(".tabpanel-EDIT_ALL .enable-organisms")
      .find(Switch)
      .prop<any>("onChange")(true);

    await new Promise(setImmediate);
    wrapper.update();

    // The Override button is there:
    expect(
      wrapper
        .find("." + ORGANISMS_COMPONENT_NAME + " .multiple-values-warning")
        .exists()
    ).toEqual(true);

    wrapper.find("button.bulk-save-button").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    // Saves the material samples:
    expect(mockSave.mock.calls).toEqual([
      [
        // Keeps the original values:
        SAMPLES_WITH_DIFFERENT_DETERMINATIONS.map((sample) => ({
          resource: {
            attachment: undefined,
            organism: undefined,
            organismsIndividualEntry: undefined,
            organismsQuantity: undefined,
            projects: undefined,
            id: sample.id,
            type: sample.type,
            relationships: {}
          },
          type: "material-sample"
        })),
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Lets you set the values without a warning when there are no organisms in the samples.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={SAMPLES_WITHOUT_ORGANISMS}
      />,
      testCtx
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Enable the organisms:
    wrapper
      .find(".tabpanel-EDIT_ALL .enable-organisms")
      .find(Switch)
      .prop<any>("onChange")(true);

    await new Promise(setImmediate);
    wrapper.update();

    // There is no override button:
    expect(
      wrapper
        .find("." + ORGANISMS_COMPONENT_NAME + " .multiple-values-warning")
        .exists()
    ).toEqual(false);

    // Override the name in the new determination:
    wrapper.find(".determination-section button.add-button").simulate("click");
    await new Promise(setImmediate);
    wrapper.update();
    wrapper
      .find(".tabpanel-EDIT_ALL .verbatimScientificName input")
      .simulate("change", { target: { value: "test-name-override" } });

    wrapper.find("button.bulk-save-button").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    const EXPECTED_ORGANISM_SAVE = {
      resource: {
        determination: [
          {
            verbatimScientificName: "test-name-override",
            determiner: undefined
          }
        ],
        group: undefined,
        type: "organism"
      },
      type: "organism"
    };

    // Saves the material samples:
    expect(mockSave.mock.calls).toEqual([
      // 3 copies of the organism are saved, 1 for each sample:
      [[EXPECTED_ORGANISM_SAVE], { apiBaseUrl: "/collection-api" }],
      [[EXPECTED_ORGANISM_SAVE], { apiBaseUrl: "/collection-api" }],
      [[EXPECTED_ORGANISM_SAVE], { apiBaseUrl: "/collection-api" }],
      [
        SAMPLES_WITHOUT_ORGANISMS.map((sample) => ({
          resource: {
            id: sample.id,
            type: sample.type,
            attachment: undefined,
            organism: undefined,
            organismsIndividualEntry: undefined,
            organismsQuantity: undefined,
            projects: undefined,
            relationships: {
              organism: {
                data: [{ id: "11111", type: "organism" }]
              }
            }
          },
          type: "material-sample"
        })),
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Shows the Override button on the Organisms section, even when the Organisms are the same.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={SAMPLES_WITH_SAME_DETERMINATIONS}
      />,
      testCtx
    );

    // Make sure all samples have the sample organism for this test,
    // even though the back-end shouldn't actually alloow this:
    expect(
      SAMPLES_WITH_SAME_DETERMINATIONS.every((sample) =>
        isEqual(sample.organism, SAMPLES_WITH_SAME_DETERMINATIONS[0].organism)
      )
    );

    await new Promise(setImmediate);
    wrapper.update();

    // Enable the organisms:
    wrapper
      .find(".tabpanel-EDIT_ALL .enable-organisms")
      .find(Switch)
      .prop<any>("onChange")(true);

    await new Promise(setImmediate);
    wrapper.update();

    // You must click the override button:
    expect(
      wrapper
        .find("." + ORGANISMS_COMPONENT_NAME + " .multiple-values-warning")
        .exists()
    ).toEqual(true);
    wrapper
      .find("." + ORGANISMS_COMPONENT_NAME + " button.override-all-button")
      .simulate("click");
    wrapper.find(".are-you-sure-modal form").simulate("submit");
    await new Promise(setImmediate);
    wrapper.update();

    // Add a determination and override its name:
    wrapper
      .find(".tabpanel-EDIT_ALL .determination-section button.add-button")
      .simulate("click");
    await new Promise(setImmediate);
    wrapper.update();
    wrapper
      .find(".tabpanel-EDIT_ALL .verbatimScientificName input")
      .simulate("change", { target: { value: "test-name-override" } });

    await new Promise(setImmediate);
    wrapper.update();

    wrapper.find("button.bulk-save-button").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    const EXPECTED_ORGANISM_SAVE = {
      resource: {
        group: undefined,
        determination: [
          {
            verbatimScientificName: "test-name-override",
            determiner: undefined
          }
        ],
        type: "organism"
      },
      type: "organism"
    };

    expect(mockSave.mock.calls).toEqual([
      [[EXPECTED_ORGANISM_SAVE], { apiBaseUrl: "/collection-api" }],
      [[EXPECTED_ORGANISM_SAVE], { apiBaseUrl: "/collection-api" }],
      [[EXPECTED_ORGANISM_SAVE], { apiBaseUrl: "/collection-api" }],
      [
        SAMPLES_WITH_SAME_DETERMINATIONS.map((sample) => ({
          resource: {
            attachment: undefined,
            organism: undefined,
            organismsIndividualEntry: undefined,
            organismsQuantity: undefined,
            projects: undefined,
            id: sample.id,
            relationships: {
              organism: { data: [{ id: "11111", type: "organism" }] }
            },
            type: "material-sample"
          },
          type: "material-sample"
        })),
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });
});
