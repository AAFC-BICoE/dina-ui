import { InputResource } from "kitsu";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import { MaterialSample } from "../../../types/collection-api";
import { MaterialSampleBulkEditor } from "../MaterialSampleBulkEditor";
import ReactSwitch from "react-switch";
import Cleave from "cleave.js/react";
import { DoOperationsError } from "common-ui";

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
  });

  it("Shows an error indicator when there is a Collecting Event SERVER-SIDE validation error.", async () => {
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

    // Shows the error message at the top of the form:
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
});
