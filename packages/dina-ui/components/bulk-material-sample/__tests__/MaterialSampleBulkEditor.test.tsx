import { deleteFromStorage } from "@rehooks/local-storage";
import { DoOperationsError } from "common-ui";
import { InputResource } from "kitsu";
import { SAMPLE_FORM_TEMPLATE_KEY } from "../..";
import { mountWithAppContext } from "common-ui";
import {
  ASSOCIATIONS_COMPONENT_NAME,
  COLLECTING_EVENT_COMPONENT_NAME,
  MATERIAL_SAMPLE_ATTACHMENTS_COMPONENT_NAME,
  MaterialSample,
  ORGANISMS_COMPONENT_NAME,
  SCHEDULED_ACTIONS_COMPONENT_NAME
} from "../../../types/collection-api";
import { MaterialSampleBulkEditor } from "../MaterialSampleBulkEditor";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import {
  TEST_FORM_TEMPLATE,
  TEST_COLLECTING_EVENT,
  TEST_COLLECTION_1,
  TEST_NEW_SAMPLES,
  TEST_SAMPLES_DIFFERENT_ARRAY_VALUES,
  TEST_SAMPLES_DIFFERENT_FLAT_FIELDS_VALUES,
  TEST_SAMPLES_DIFFERENT_MANAGED_ATTRIBUTES,
  TEST_SAMPLES_SAME_COLLECTING_EVENT,
  TEST_SAMPLES_SAME_FLAT_FIELDS_VALUES,
  TEST_SAMPLES_SAME_HOST_ORGANISM,
  TEST_SAMPLES_SAME_STORAGE_UNIT,
  TEST_STORAGE_UNIT,
  TEST_STORAGE_UNITS,
  TEST_COLLECTING_ORGANISM_SAMPLES,
  TEST_FORM_TEMPLATE_COMPONENTS_DISABLED
} from "../__mocks__/MaterialSampleBulkMocks";

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
    case "collection-api/collecting-event/col-event-1?include=collectors,attachment,collectionMethod,protocol":
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
    case "collection-api/form-template/cd6d8297-43a0-45c6-b44e-983db917eb11":
      return { data: TEST_FORM_TEMPLATE };
    case "collection-api/identifier-type":
      return {
        data: {
          id: "materialSampleIdentifierType",
          type: "vocabulary",
          attributes: {
            vocabularyElements: [
              {
                key: "seqdb_id",
                name: "SeqDB ID",
                term: null,
                multilingualTitle: {
                  titles: [
                    {
                      lang: "en",
                      title: "SeqDB ID"
                    },
                    {
                      lang: "fr",
                      title: "ID SeqDB"
                    }
                  ]
                },
                inverseOf: null
              }
            ]
          }
        }
      };
    case "collection-api/storage-unit-type":
    case "collection-api/collection":
    case "collection-api/collection-method":
    case "collection-api/collecting-event":
    case "objectstore-api/metadata":
    case "agent-api/person":
    case "collection-api/vocabulary2/typeStatus":
    case "collection-api/vocabulary2/degreeOfEstablishment":
    case "collection-api/preparation-type":
    case "collection-api/material-sample":
    case "collection-api/managed-attribute":
    case "collection-api/vocabulary2/materialSampleState":
    case "collection-api/material-sample-type":
    case "collection-api/project":
    case "user-api/group":
    case "collection-api/vocabulary2/associationType":
    case "collection-api/vocabulary2/srs":
    case "collection-api/vocabulary2/coordinateSystem":
    case "collection-api/vocabulary2/materialSampleType":
    case "collection-api/form-template":
    case "collection-api/assemblage":
    case "collection-api/extension":
      return { data: [] };
  }
});

const mockBulkGet = jest.fn<any, any>(async (paths: string[]) => {
  return paths.map((path) => {
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
          vocabularyElementType: "STRING",
          managedAttributeComponent: "MATERIAL_SAMPLE",
          name: "Managed Attribute 1"
        };
      case "managed-attribute/MATERIAL_SAMPLE.m2":
        return {
          type: "managed-attribute",
          id: "2",
          key: "m2",
          vocabularyElementType: "STRING",
          managedAttributeComponent: "MATERIAL_SAMPLE",
          name: "Managed Attribute 2"
        };
      case "managed-attribute/MATERIAL_SAMPLE.m3":
        return {
          type: "managed-attribute",
          id: "3",
          key: "m3",
          vocabularyElementType: "STRING",
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

const mockSave = jest.fn((ops) =>
  ops.map((op) => ({
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

describe("MaterialSampleBulkEditor", () => {
  beforeEach(() => deleteFromStorage("test-user." + SAMPLE_FORM_TEMPLATE_KEY));
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

    // Edit the first sample:
    fireEvent.click(wrapper.getByText(/ms1/i));
    fireEvent.change(wrapper.getAllByRole("textbox", { name: /barcode/i })[1], {
      target: { value: "edited-barcode-1" }
    });

    // Edit the second sample:
    fireEvent.click(wrapper.getByText(/ms2/i));
    fireEvent.change(wrapper.getAllByRole("textbox", { name: /barcode/i })[1], {
      target: { value: "edited-barcode-2" }
    });

    // Edit the third sample:
    fireEvent.click(wrapper.getByText(/ms3/i));
    fireEvent.change(wrapper.getAllByRole("textbox", { name: /barcode/i })[1], {
      target: { value: "edited-barcode-3" }
    });

    fireEvent.click(wrapper.getByRole("button", { name: /save all/i }));
    await new Promise(setImmediate);

    // Saves the new material samples:
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              barcode: "edited-barcode-1",
              collection: {
                id: "1",
                type: "collection"
              },
              materialSampleName: "MS1",
              relationships: {
                collection: {
                  data: {
                    id: "1",
                    type: "collection"
                  }
                }
              },
              type: "material-sample"
            },
            type: "material-sample"
          },
          {
            resource: {
              barcode: "edited-barcode-2",
              collection: {
                id: "1",
                type: "collection"
              },
              materialSampleName: "MS2",
              relationships: {
                collection: {
                  data: {
                    id: "1",
                    type: "collection"
                  }
                }
              },
              type: "material-sample"
            },
            type: "material-sample"
          },
          {
            resource: {
              barcode: "edited-barcode-3",
              collection: {
                id: "1",
                type: "collection"
              },
              materialSampleName: "MS3",
              relationships: {
                collection: {
                  data: {
                    id: "1",
                    type: "collection"
                  }
                }
              },
              type: "material-sample"
            },
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);

    // The saved samples are mocked by mockSave and are passed into the onSaved callback.
    // Check the IDs to make sure they were saved:
    expect(mockOnSaved.mock.calls[0][0].map((sample) => sample.id)).toEqual([
      "11111",
      "11111",
      "11111"
    ]);
  });

  it("Bulk creates material samples using other catalogue and other identifiers", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_NEW_SAMPLES}
      />,
      testCtx
    );
    await new Promise(setImmediate);

    // Edit the first sample:
    fireEvent.click(wrapper.getByRole("tab", { name: /ms1/i }));
    fireEvent.change(
      within(wrapper.getByTestId("dwcOtherCatalogNumbers[0]")).getByRole(
        "textbox"
      ),
      { target: { value: "otherCatalog1" } }
    );

    // Edit the second sample:
    fireEvent.click(wrapper.getByRole("tab", { name: /ms2/i }));
    fireEvent.change(
      within(wrapper.getByTestId("dwcOtherCatalogNumbers[0]")).getByRole(
        "textbox"
      ),
      { target: { value: "otherCatalog2" } }
    );

    // Edit the third sample:
    fireEvent.click(wrapper.getByRole("tab", { name: /ms3/i }));
    fireEvent.change(
      within(wrapper.getByTestId("dwcOtherCatalogNumbers[0]")).getByRole(
        "textbox"
      ),
      { target: { value: "otherCatalog3" } }
    );

    // Submit the form.
    fireEvent.click(wrapper.getByRole("button", { name: /save all/i }));
    await new Promise(setImmediate);

    // Saves the new material samples:
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              dwcOtherCatalogNumbers: ["otherCatalog1"],
              collection: {
                id: "1",
                type: "collection"
              },
              relationships: {
                collection: {
                  data: {
                    id: "1",
                    type: "collection"
                  }
                }
              },
              materialSampleName: "MS1",
              type: "material-sample"
            },
            type: "material-sample"
          },
          {
            resource: {
              dwcOtherCatalogNumbers: ["otherCatalog2"],
              collection: {
                id: "1",
                type: "collection"
              },
              relationships: {
                collection: {
                  data: {
                    id: "1",
                    type: "collection"
                  }
                }
              },
              materialSampleName: "MS2",
              type: "material-sample"
            },
            type: "material-sample"
          },
          {
            resource: {
              dwcOtherCatalogNumbers: ["otherCatalog3"],
              collection: {
                id: "1",
                type: "collection"
              },
              relationships: {
                collection: {
                  data: {
                    id: "1",
                    type: "collection"
                  }
                }
              },
              materialSampleName: "MS3",
              type: "material-sample"
            },
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);

    // The saved samples are mocked by mockSave and are passed into the onSaved callback.
    // Check the IDs to make sure they were saved:
    expect(mockOnSaved.mock.calls[0][0].map((sample) => sample.id)).toEqual([
      "11111",
      "11111",
      "11111"
    ]);
  });

  it("Bulk edit all material samples using other catalogue and other identifiers", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={
          [
            {
              id: "1",
              type: "material-sample",
              dwcOtherCatalogNumbers: ["otherCatalog1"]
            },
            {
              id: "2",
              type: "material-sample",
              dwcOtherCatalogNumbers: ["otherCatalog2"]
            },
            {
              id: "3",
              type: "material-sample",
              dwcOtherCatalogNumbers: ["otherCatalog3"]
            }
          ] as InputResource<MaterialSample>[]
        }
      />,
      testCtx
    );
    await new Promise(setImmediate);

    fireEvent.click(
      wrapper.getAllByRole("button", { name: /override all/i })[1]
    );
    fireEvent.click(wrapper.getByRole("button", { name: /yes/i }));
    await new Promise(setImmediate);

    // Update the other cataloge value:
    fireEvent.change(
      within(wrapper.getByTestId("dwcOtherCatalogNumbers[0]")).getByRole(
        "textbox"
      ),
      { target: { value: "otherCatalogAll" } }
    );

    // Submit the form.
    fireEvent.click(wrapper.getByRole("button", { name: /save all/i }));
    await new Promise(setImmediate);

    // Saves the new material samples:
    expect(mockSave.mock.calls).toMatchSnapshot();

    // The saved samples are mocked by mockSave and are passed into the onSaved callback.
    // Check the IDs to make sure they were saved:
    expect(mockOnSaved.mock.calls[0][0].map((sample) => sample.id)).toEqual([
      "1",
      "2",
      "3"
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

    // Go the the bulk edit tab:
    fireEvent.click(wrapper.getByText(/edit all/i));

    // Enable the collecting event section:
    const collectingEventToggle = wrapper.container.querySelectorAll(
      ".enable-collecting-event .react-switch-bg"
    );
    if (!collectingEventToggle) {
      fail("Collecting event toggle needs to exist at this point.");
    }
    fireEvent.click(collectingEventToggle[0]);
    await new Promise(setImmediate);

    // Put an invalid value in startEventDateTime. This is validated locally by yup:
    const startDateTextbox = wrapper.getByRole("textbox", {
      name: "Start Event Date Time Start Event Date Time format must be a subset of : YYYY-MM-DDTHH:MM:SS.MMM, if datetime is present, 'T' is mandatory"
    });
    userEvent.type(startDateTextbox, "11111");

    // Click the "Save All" button:
    fireEvent.click(wrapper.getByRole("button", { name: /save all/i }));
    await new Promise(setImmediate);

    // The tab with the error is given the red text, and the other tabs are unaffected:
    expect(
      wrapper.container.querySelector(".text-danger")?.textContent
    ).toEqual("MS1");

    // Shows the error message:
    expect(
      wrapper.getByText(
        /1 : start event date time \- start event datetime format must be a subset of: yyyy\-mm\-ddthh:mm:ss\.mmm, if datetime is present, 't' is mandatory/i
      )
    ).toBeInTheDocument();
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

    // Edit the second sample:
    fireEvent.click(wrapper.getByText(/ms2/i));
    await new Promise(setImmediate);

    // Enable the collecting event section:
    const collectingEventToggle = wrapper.container.querySelectorAll(
      ".enable-collecting-event .react-switch-bg"
    );
    if (!collectingEventToggle) {
      fail("Collecting event toggle needs to exist at this point.");
    }
    fireEvent.click(collectingEventToggle[1]);
    await new Promise(setImmediate);

    // Click the "Save All" button:
    fireEvent.click(wrapper.getByRole("button", { name: /save all/i }));
    await new Promise(setImmediate);

    // The collecting event was saved separately.
    expect(mockSaveForBadColEvent).lastCalledWith(
      [
        {
          resource: {
            type: "collecting-event",
            dwcVerbatimCoordinateSystem: null,
            dwcVerbatimSRS: "WGS84 (EPSG:4326)",
            geoReferenceAssertions: [
              {
                isPrimary: true
              }
            ],
            publiclyReleasable: true
          },
          type: "collecting-event"
        }
      ],
      { apiBaseUrl: "/collection-api" }
    );

    // The tab with the error is given the red text, and the other tabs are unaffected:
    expect(
      wrapper.getByText(
        /bulk submission error: check the tabs with a red label\./i
      )
    ).toBeInTheDocument();
    expect(
      wrapper.container.querySelector(".text-danger")?.textContent
    ).toEqual("MS2");

    // Shows the error message:
    expect(
      wrapper.getByText(
        /1 : start event date time \- invalid collecting event/i
      )
    ).toBeInTheDocument();
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

    // Go the the bulk edit tab:
    fireEvent.click(wrapper.getByText(/edit all/i));

    // Enable the collecting event section:
    const collectingEventToggle = wrapper.container.querySelectorAll(
      ".enable-collecting-event .react-switch-bg"
    );
    if (!collectingEventToggle) {
      fail("Collecting event toggle needs to exist at this point.");
    }
    fireEvent.click(collectingEventToggle[0]);
    await new Promise(setImmediate);

    // Click the "Save All" button:
    fireEvent.click(wrapper.getByRole("button", { name: /save all/i }));
    await new Promise(setImmediate);

    // The collecting event was saved separately.
    expect(mockSaveForBadColEvent).lastCalledWith(
      [
        {
          resource: {
            type: "collecting-event",
            dwcVerbatimCoordinateSystem: null,
            dwcVerbatimSRS: "WGS84 (EPSG:4326)",
            geoReferenceAssertions: [
              {
                isPrimary: true
              }
            ],
            publiclyReleasable: true
          },
          type: "collecting-event"
        }
      ],
      { apiBaseUrl: "/collection-api" }
    );

    // The tab with the error is given the red text, and the other tabs are unaffected:
    expect(
      wrapper.getByText(
        /bulk submission error: check the tabs with a red label\./i
      )
    ).toBeInTheDocument();
    expect(
      wrapper.container.querySelector(".text-danger")?.textContent
    ).toEqual("MS1");

    // Shows the error message:
    expect(
      wrapper.getByText(
        /1 : start event date time \- invalid collecting event/i
      )
    ).toBeInTheDocument();
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

    // Go the the bulk edit tab:
    fireEvent.click(wrapper.getByText(/edit all/i));

    // Edit the barcode:
    fireEvent.change(wrapper.getByRole("textbox", { name: /barcode/i }), {
      target: { value: "bad barcode" }
    });

    // Click the "Save All" button:
    fireEvent.click(wrapper.getByRole("button", { name: /save all/i }));
    await new Promise(setImmediate);

    // The tab with the error is given the red text, and the other tabs are unaffected:
    expect(
      wrapper.getByText(
        /bulk submission error: check the tabs with a red label\./i
      )
    ).toBeInTheDocument();
    expect(
      wrapper.container.querySelector(".text-danger")?.textContent
    ).toEqual("Edit All");
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

    // Click the "Save All" button:
    fireEvent.click(wrapper.getByRole("button", { name: /save all/i }));
    await new Promise(setImmediate);

    // The tab with the error is given the red text, and the other tabs are unaffected:
    expect(
      wrapper.getByText(
        /bulk submission error: check the tabs with a red label\./i
      )
    ).toBeInTheDocument();
    expect(
      wrapper.container.querySelector(".text-danger")?.textContent
    ).toEqual("MS2");

    expect(
      wrapper.getByText(/1 : barcode \- invalid barcode/i)
    ).toBeInTheDocument();
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

    // Enable all the sections with the "Override All" warning boxes:
    [
      ".enable-organisms",
      ".enable-catalogue-info",
      ".enable-associations",
      ".enable-scheduled-actions"
    ].forEach((selector) => {
      const toggle = wrapper.container.querySelectorAll(
        selector + " .react-switch-bg"
      );
      if (!toggle) {
        fail("Toggle for " + selector + " needs to exist at this point.");
      }
      fireEvent.click(toggle[0]);
    });
    await new Promise(setImmediate);

    // Shows the warning for each section enabled:
    const warnings = wrapper.container.querySelectorAll(
      ".multiple-values-warning"
    );
    expect(warnings.length).toEqual(4);

    // Click the "Save All" button without overriding anything:
    fireEvent.click(wrapper.getByRole("button", { name: /save all/i }));
    await new Promise(setImmediate);

    // No changes were made.
    expect(mockSave.mock.calls).toHaveLength(0);
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

    // Enable all the sections with the "Override All" warning boxes:
    [
      ".enable-organisms",
      ".enable-catalogue-info",
      ".enable-associations",
      ".enable-scheduled-actions"
    ].forEach((selector) => {
      const toggle = wrapper.container.querySelectorAll(
        selector + " .react-switch-bg"
      );
      if (!toggle) {
        fail("Toggle for " + selector + " needs to exist at this point.");
      }
      fireEvent.click(toggle[0]);
    });
    await new Promise(setImmediate);

    // Click the Override All buttons:
    for (const section of [
      "." + ORGANISMS_COMPONENT_NAME,
      "#" + MATERIAL_SAMPLE_ATTACHMENTS_COMPONENT_NAME,
      "#" + ASSOCIATIONS_COMPONENT_NAME,
      "#" + SCHEDULED_ACTIONS_COMPONENT_NAME
    ]) {
      const overrideButton = wrapper.container.querySelector(
        `${section} button.override-all-button`
      );
      if (!overrideButton) {
        fail(
          `Override button inside of ${section} needs to exist at this point.`
        );
      }
      fireEvent.click(overrideButton);
      await new Promise(setImmediate);

      // Click "Yes" on the popup dialog.
      fireEvent.click(wrapper.getByRole("button", { name: /yes/i }));
      await new Promise(setImmediate);
    }

    // Organisms section opens with an initial value, so it has the green indicator on the fieldset:
    expect(
      wrapper.getByText(
        /these organisms will be set on all material samples\./i
      )
    ).toBeInTheDocument();

    // The other over-ridable sections don't have an initial value,
    // so they don't initially show the green indicator on the fieldset:
    expect(
      wrapper.queryByText(
        /these attachments will be set on all material samples\./i
      )
    ).not.toBeInTheDocument();

    // Associations list section opens with an initial value, so it has the green indicator on the fieldset:
    expect(
      wrapper.getByText(
        /these associationss will be set on all material samples\./i
      )
    ).toBeInTheDocument();

    // Scheduled should not display it as well:
    expect(
      wrapper.queryByText(
        /these scheduled actions will be set on all material samples\./i
      )
    ).not.toBeInTheDocument();

    // Set the override values for organism:
    // Click the "Add New Determination" button.
    fireEvent.click(
      wrapper.getByRole("button", { name: /add new determination/i })
    );
    await new Promise(setImmediate);

    // Override the verbatim scientific name.
    fireEvent.change(
      wrapper.getByRole("textbox", {
        name: /verbatim scientific name × insert hybrid symbol/i
      }),
      { target: { value: "new-scientific-name" } }
    );
    await new Promise(setImmediate);

    // Override the scheduled acitons
    fireEvent.change(wrapper.getByRole("textbox", { name: /action type/i }), {
      target: { value: "new-action-type" }
    });

    // Click the "Add" schedule button.
    const scheduleActionButton = wrapper.container.querySelector(
      "#" + SCHEDULED_ACTIONS_COMPONENT_NAME + " button"
    );
    if (!scheduleActionButton) {
      fail("Schedule add button needs to exist at this point.");
    }
    fireEvent.click(scheduleActionButton);
    await new Promise(setImmediate);

    // All overridable fieldsets should now have the green bulk edited indicator:
    const overrideClasses = wrapper.container.querySelectorAll(
      ".has-bulk-edit-value"
    );
    expect(overrideClasses.length).toEqual(5);

    // All Override All buttons should be gone now:
    const overrideButtons = wrapper.container.querySelectorAll(
      "button.override-all-button"
    );
    expect(overrideButtons.length).toEqual(0);

    // Click the "Save All" button without overriding anything:
    fireEvent.click(wrapper.getByRole("button", { name: /save all/i }));
    await new Promise(setImmediate);

    const EXPECTED_ORGANISM_SAVE = {
      resource: {
        determination: [
          {
            verbatimScientificName: "new-scientific-name",
            determiner: undefined,
            scientificName: undefined,
            scientificNameDetails: undefined,
            scientificNameSource: undefined
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
          ...TEST_SAMPLES_DIFFERENT_ARRAY_VALUES.map((sample) => ({
            type: "material-sample",
            resource: {
              id: sample.id,
              associations: [],
              type: sample.type,
              relationships: {
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

    expect(
      wrapper.getByRole("combobox", { name: /tags multiple values/i })
    ).toBeInTheDocument();
    expect(
      wrapper.getByRole("combobox", { name: /collection multiple values/i })
    ).toBeInTheDocument();
    expect(
      wrapper.getByRole("combobox", { name: /projects multiple values/i })
    ).toBeInTheDocument();
    expect(wrapper.getByRole("textbox", { name: /barcode/i })).toHaveAttribute(
      "placeholder",
      "Multiple Values"
    );

    // Blank values should be rendered into these fields so the placeholder is visible:
    expect(
      wrapper.getByRole("combobox", { name: /tags multiple values/i })
    ).toHaveValue("");
    expect(
      wrapper.getByRole("combobox", { name: /collection multiple values/i })
    ).toHaveValue("");
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

    // The common values are displayed in the UI:
    // Tags:
    expect(wrapper.getByText(/tag1/i)).toBeInTheDocument();

    // Collection:
    expect(wrapper.getByText(/c1/i)).toBeInTheDocument();

    // Projects:
    expect(wrapper.getByText(/project 1/i)).toBeInTheDocument();

    // Barcode
    expect(wrapper.getByDisplayValue("test barcode")).toBeInTheDocument();

    // Publicly Releasable
    expect(wrapper.getByLabelText("True")).toHaveProperty("checked", true);

    // Material Sample State
    expect(wrapper.getByDisplayValue("test-ms-state")).toBeInTheDocument();

    // Set the barcode to the same value to update the form state
    fireEvent.change(wrapper.getByRole("textbox", { name: /barcode/i }), {
      target: { value: "test barcode" }
    });

    // Click the "Save All" button:
    fireEvent.click(wrapper.getByRole("button", { name: /save all/i }));
    await new Promise(setImmediate);

    // No changes should be made
    expect(mockSave.mock.calls).toHaveLength(0);
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

    const barcodeInput = wrapper.container.querySelector(
      ".tabpanel-EDIT_ALL .barcode-field input"
    );
    if (!barcodeInput) {
      fail("Barcode input needs to exist at this point.");
    }

    // Has the default common value:
    expect(barcodeInput).toHaveValue("test barcode");

    // Manually enter the default value:
    fireEvent.change(barcodeInput, { target: { value: "temporary edit" } });
    fireEvent.change(barcodeInput, { target: { value: "test barcode" } });

    // Don't show the green indicator if the field is back to its initial value:
    expect(
      wrapper.container.querySelector(
        ".tabpanel-EDIT_ALL .has-bulk-edit-value .barcode-field"
      )
    ).toBeNull();

    // Has the default common value:
    expect(barcodeInput).toHaveValue("test barcode");

    // Edit the first sample's barcode:
    fireEvent.click(wrapper.getByText(/#1/i));
    const tabpanel1 = wrapper.getByRole("tabpanel", {
      name: /#1/i
    });
    fireEvent.change(
      within(tabpanel1).getByRole("textbox", {
        name: /barcode/i
      }),
      { target: { value: "edited-barcode" } }
    );

    // Save All:
    fireEvent.click(wrapper.getByRole("button", { name: /save all/i }));
    await new Promise(setImmediate);

    // Save the collecting event, then save the 2 material samples:
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              id: "1",
              barcode: "edited-barcode",
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

    const barcodeInput = wrapper.container.querySelector(
      ".tabpanel-EDIT_ALL .barcode-field input"
    );
    if (!barcodeInput) {
      fail("Barcode input needs to exist at this point.");
    }

    // Has the default common value:
    expect(barcodeInput).toHaveValue("test barcode");

    // Manually erase the default value:
    fireEvent.change(barcodeInput, { target: { value: "" } });
    await new Promise(setImmediate);

    // Shows the blank input without the green indicator:
    expect(barcodeInput).toHaveValue("");
    expect(
      wrapper.container.querySelector(
        ".tabpanel-EDIT_ALL .has-bulk-edit-value .barcode-field"
      )
    ).toBeNull();
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

    const barcodeInput = wrapper.container.querySelector(
      ".tabpanel-EDIT_ALL .barcode-field input"
    );
    if (!barcodeInput) {
      fail("Barcode input needs to exist at this point.");
    }

    fireEvent.change(barcodeInput, { target: { value: "edited-barcode-1" } });
    expect(
      wrapper.container.querySelector(
        ".tabpanel-EDIT_ALL .has-bulk-edit-value .barcode-field"
      )
    ).not.toBeNull();
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

    // m1 and m2 have multiple values, so show a blank input with a placeholder:
    expect(
      wrapper.container.querySelector(
        ".tabpanel-EDIT_ALL .managedAttributes_m1-field input"
      )
    ).toHaveValue("");
    expect(
      wrapper.container.querySelector(
        ".tabpanel-EDIT_ALL .managedAttributes_m2-field input"
      )
    ).toHaveValue("");
    expect(
      wrapper.container.querySelector(
        ".tabpanel-EDIT_ALL .managedAttributes_m3-field input"
      )
    ).toHaveValue("common m3 value");

    expect(
      wrapper.container.querySelector(
        ".tabpanel-EDIT_ALL .managedAttributes_m1-field input"
      )
    ).toHaveProperty("placeholder", "Multiple Values");
    expect(
      wrapper.container.querySelector(
        ".tabpanel-EDIT_ALL .managedAttributes_m2-field input"
      )
    ).toHaveProperty("placeholder", "Multiple Values");
  });

  it("Creates and links a unique Collecting Event to all samples", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_NEW_SAMPLES}
      />,
      testCtx
    );
    await new Promise(setImmediate);

    // Enable the collecting event section:
    const collectingEventToggle = wrapper.container.querySelectorAll(
      ".tabpanel-EDIT_ALL .enable-collecting-event .react-switch-bg"
    );
    if (!collectingEventToggle) {
      fail("Collecting event toggle needs to exist at this point.");
    }
    fireEvent.click(collectingEventToggle[0]);
    await new Promise(setImmediate);

    // Edit a collecting event field:
    fireEvent.change(
      wrapper.getByRole("textbox", { name: /verbatim locality/i }),
      { target: { value: "test locality" } }
    );

    // Click the "Save All" button:
    fireEvent.click(wrapper.getByRole("button", { name: /save all/i }));
    await new Promise(setImmediate);

    // Save the collecting event, then save the 2 material samples:
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              type: "collecting-event",
              geoReferenceAssertions: [{ isPrimary: true }],
              dwcVerbatimCoordinateSystem: null,
              dwcVerbatimSRS: "WGS84 (EPSG:4326)",
              publiclyReleasable: true,
              dwcVerbatimLocality: "test locality"
            },
            type: "collecting-event"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ],
      [
        [
          {
            resource: {
              type: "collecting-event",
              geoReferenceAssertions: [{ isPrimary: true }],
              dwcVerbatimCoordinateSystem: null,
              dwcVerbatimSRS: "WGS84 (EPSG:4326)",
              publiclyReleasable: true,
              dwcVerbatimLocality: "test locality"
            },
            type: "collecting-event"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ],
      [
        [
          {
            resource: {
              type: "collecting-event",
              geoReferenceAssertions: [{ isPrimary: true }],
              dwcVerbatimCoordinateSystem: null,
              dwcVerbatimSRS: "WGS84 (EPSG:4326)",
              publiclyReleasable: true,
              dwcVerbatimLocality: "test locality"
            },
            type: "collecting-event"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ],
      [
        [
          {
            resource: {
              type: "material-sample",
              materialSampleName: "MS1",
              collection: { id: "1", type: "collection" },
              collectingEvent: { id: "11111", type: "collecting-event" },
              relationships: {
                collection: { data: { id: "1", type: "collection" } }
              }
            },
            type: "material-sample"
          },
          {
            resource: {
              type: "material-sample",
              materialSampleName: "MS2",
              collection: { id: "1", type: "collection" },
              collectingEvent: { id: "11111", type: "collecting-event" },
              relationships: {
                collection: { data: { id: "1", type: "collection" } }
              }
            },
            type: "material-sample"
          },
          {
            resource: {
              type: "material-sample",
              materialSampleName: "MS3",
              collection: { id: "1", type: "collection" },
              collectingEvent: { id: "11111", type: "collecting-event" },
              relationships: {
                collection: { data: { id: "1", type: "collection" } }
              }
            },
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

    // Enable the collecting event section:
    const collectingEventToggle = wrapper.container.querySelectorAll(
      ".tabpanel-EDIT_ALL .enable-collecting-event .react-switch-bg"
    );
    if (!collectingEventToggle) {
      fail("Collecting event toggle needs to exist at this point.");
    }
    fireEvent.click(collectingEventToggle[0]);
    await new Promise(setImmediate);

    // The collecting event section has a green legend to indicate a bulk edit (event without setting a new Collecting Event):
    expect(
      wrapper.getAllByRole("button", { name: /detach/i })[0]
    ).toBeInTheDocument();

    // Edit the common collecting event:
    fireEvent.change(
      wrapper.getByRole("textbox", { name: /verbatim locality/i }),
      { target: { value: "bulk edited locality" } }
    );

    // Click the "Save All" button:
    fireEvent.click(wrapper.getByRole("button", { name: /save all/i }));
    await new Promise(setImmediate);

    // Save the collecting events, no changes made to the material sample.
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              id: "col-event-1",
              type: "collecting-event",
              dwcVerbatimLocality: "bulk edited locality"
            },
            type: "collecting-event"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ],
      [
        [
          {
            resource: {
              id: "col-event-1",
              type: "collecting-event",
              dwcVerbatimLocality: "bulk edited locality"
            },
            type: "collecting-event"
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

    const storageToggle = wrapper.container.querySelectorAll(
      ".tabpanel-EDIT_ALL .enable-storage .react-switch-bg"
    );
    if (!storageToggle) {
      fail("Storage toggle needs to exist at this point.");
    }
    fireEvent.click(storageToggle[0]);
    await new Promise(setImmediate);

    // Delete the current storage...
    const removeStorageButton = wrapper.container.querySelector(
      ".tabpanel-EDIT_ALL button.remove-storage"
    );
    if (!removeStorageButton) {
      fail("Remove existing storage button doesn't exist on the page.");
    }
    fireEvent.click(removeStorageButton);
    await new Promise(setImmediate);

    // Assign a different storage unit:
    const row = wrapper.getByRole("row", {
      name: /storage unit c \(box\) select/i
    });
    const selectStorageButton = within(row).getByRole("button", {
      name: /select/i
    });
    fireEvent.click(selectStorageButton);
    await new Promise(setImmediate);

    // Green indicator shows up:
    expect(
      wrapper.getByText(
        /this storage unit will be linked to all material samples\./i
      )
    ).toBeInTheDocument();

    // New linked storage unit is indicated:
    expect(
      wrapper.getByRole("link", { name: /storage unit c \(box\)/i })
    ).toBeInTheDocument();

    // Click the "Save All" button:
    fireEvent.click(wrapper.getByRole("button", { name: /save all/i }));
    await new Promise(setImmediate);

    // Saves the new material samples with the new storage unit:
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              id: undefined,
              storageUnit: {
                id: "C",
                type: "storage-unit"
              },
              type: "storage-unit-usage",
              usageType: "material-sample"
            },
            type: "storage-unit-usage"
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
              id: undefined,
              storageUnit: {
                id: "C",
                type: "storage-unit"
              },
              type: "storage-unit-usage",
              usageType: "material-sample"
            },
            type: "storage-unit-usage"
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
              id: "1",
              relationships: {
                storageUnitUsage: {
                  data: {
                    id: "11111",
                    type: "storage-unit-usage"
                  }
                }
              },
              type: "material-sample"
            },
            type: "material-sample"
          },
          {
            resource: {
              id: "2",
              relationships: {
                storageUnitUsage: {
                  data: {
                    id: "11111",
                    type: "storage-unit-usage"
                  }
                }
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

  it("Edits the nested hostOrganism field.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_SAMPLES_SAME_HOST_ORGANISM}
      />,
      testCtx
    );
    await new Promise(setImmediate);

    // Enable host organism fields:
    const toggle = wrapper.container.querySelectorAll(
      ".tabpanel-EDIT_ALL .enable-associations .react-switch-bg"
    );
    if (!toggle) {
      fail("Associations toggle needs to exist at this point.");
    }
    fireEvent.click(toggle[0]);
    await new Promise(setImmediate);

    const hostRemarks = wrapper.container.querySelector(
      ".tabpanel-EDIT_ALL .hostOrganism_remarks-field textarea"
    );
    if (!hostRemarks) {
      fail("Remarks textbox does not exist.");
    }
    fireEvent.change(hostRemarks, { target: { value: "bulk-edit-remarks" } });

    // Click the "Save All" button:
    fireEvent.click(wrapper.getByRole("button", { name: /save all/i }));
    await new Promise(setImmediate);

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
              type: "material-sample"
            },
            type: "material-sample"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ]
    ]);
  });

  it("Allows adding NEW nested Collecting the individual sample tabs.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_NEW_SAMPLES}
      />,
      testCtx
    );
    await new Promise(setImmediate);

    // Edit the first sample only:
    fireEvent.click(wrapper.getByText(/ms1/i));

    // Enable the collecting event section:
    const toggle = wrapper.container.querySelector(
      ".sample-tabpanel-0 .enable-collecting-event .react-switch-bg"
    );
    if (!toggle) {
      fail("Collecting event toggle needs to exist at this point.");
    }
    fireEvent.click(toggle);
    await new Promise(setImmediate);

    const verbatimLocality = wrapper.container.querySelector(
      ".sample-tabpanel-0 #" +
        COLLECTING_EVENT_COMPONENT_NAME +
        " .dwcVerbatimLocality-field input"
    );
    if (!verbatimLocality) {
      fail("Verbatim locality textbox cannot be found.");
    }
    fireEvent.change(verbatimLocality, { target: { value: "test locality" } });

    // Click the "Save All" button:
    fireEvent.click(wrapper.getByRole("button", { name: /save all/i }));
    await new Promise(setImmediate);

    // Saves the new material samples with the new storage unit:
    expect(mockSave.mock.calls).toEqual([
      // Creates the new Col Event:
      [
        [
          {
            resource: {
              type: "collecting-event",
              dwcVerbatimLocality: "test locality",
              dwcVerbatimCoordinateSystem: null,
              dwcVerbatimSRS: "WGS84 (EPSG:4326)",
              geoReferenceAssertions: [
                {
                  isPrimary: true
                }
              ],
              publiclyReleasable: true
            },
            type: "collecting-event"
          }
        ],
        { apiBaseUrl: "/collection-api" }
      ],
      [
        [
          // Creates the first sample with the attached events:
          {
            resource: {
              collectingEvent: {
                id: "11111",
                type: "collecting-event"
              },
              collection: {
                id: "1",
                type: "collection"
              },
              materialSampleName: "MS1",
              relationships: {
                collection: {
                  data: {
                    id: "1",
                    type: "collection"
                  }
                }
              },
              type: "material-sample"
            },
            type: "material-sample"
          },
          // Creates the next 2 samples without the attached events:
          {
            resource: {
              collection: {
                id: "1",
                type: "collection"
              },
              materialSampleName: "MS2",
              relationships: {
                collection: {
                  data: {
                    id: "1",
                    type: "collection"
                  }
                }
              },
              type: "material-sample"
            },
            type: "material-sample"
          },
          {
            resource: {
              collection: {
                id: "1",
                type: "collection"
              },
              materialSampleName: "MS3",
              relationships: {
                collection: {
                  data: {
                    id: "1",
                    type: "collection"
                  }
                }
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

  it("Allows selecting a Form Template to show/hide fields in the bulk and single tabs for material sample section.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_NEW_SAMPLES}
      />,
      testCtx
    );
    await new Promise(setImmediate);

    expect(
      wrapper.getByRole("textbox", { name: /barcode/i })
    ).toBeInTheDocument();
    expect(
      wrapper.container.querySelector(
        ".tabpanel-EDIT_ALL .override-all-button-catalog-numbers"
      )
    ).not.toBeNull();
    wrapper.unmount();

    // Select a form template:
    const wrapper2 = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_NEW_SAMPLES}
        initialFormTemplateUUID={TEST_FORM_TEMPLATE.id}
      />,
      testCtx
    );
    await new Promise(setImmediate);

    // The bulk edit tab shows the barcode field from the FormTemplate:
    // For Material Sample:
    expect(
      wrapper2.getByRole("textbox", { name: /barcode/i })
    ).toBeInTheDocument();
    expect(
      wrapper2.container.querySelector(
        ".tabpanel-EDIT_ALL .override-all-button-catalog-numbers"
      )
    ).toBeNull();

    // Switch to the first individual sample tab:
    fireEvent.click(wrapper2.getByText(/ms1/i));
    await new Promise(setImmediate);

    expect(
      wrapper2.container.querySelector(
        ".sample-tabpanel-0 .barcode-field input"
      )
    ).not.toBeNull();
    expect(
      wrapper2.container.querySelector(
        ".sample-tabpanel-0 .dwcOtherCatalogNumbers_0_-field input"
      )
    ).toBeNull();
  });

  it("Allows selecting a Form Template to provide default values for bulk material sample edit all tab.", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_NEW_SAMPLES}
      />,
      testCtx
    );
    await new Promise(setImmediate);

    expect(
      wrapper.getByRole("textbox", { name: /barcode/i })
    ).toBeInTheDocument();
    expect(
      wrapper.container.querySelector(
        ".tabpanel-EDIT_ALL .override-all-button-catalog-numbers"
      )
    ).not.toBeNull();
    wrapper.unmount();

    // Select a form template:
    const wrapper2 = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_NEW_SAMPLES}
        initialFormTemplateUUID={TEST_FORM_TEMPLATE.id}
      />,
      testCtx
    );
    await new Promise(setImmediate);

    // The bulk edit tab shows the default values from the FormTemplate:
    // For Material Sample:
    expect(
      wrapper2.getByRole("textbox", { name: /barcode/i })
    ).toBeInTheDocument();
    expect(
      wrapper2.container.querySelector(
        ".tabpanel-EDIT_ALL .override-all-button-catalog-numbers"
      )
    ).toBeNull();
    expect(wrapper2.getByRole("textbox", { name: /barcode/i })).toHaveValue(
      "1111"
    );

    // Switch to the first individual sample tab:
    fireEvent.click(wrapper2.getByText(/ms1/i));
    await new Promise(setImmediate);

    expect(
      wrapper2.container.querySelector(
        ".sample-tabpanel-0 .barcode-field input"
      )
    ).toHaveValue("");
  });

  it("Form template should not override previously saved data elements", async () => {
    const wrapper = mountWithAppContext(
      <MaterialSampleBulkEditor
        onSaved={mockOnSaved}
        samples={TEST_COLLECTING_ORGANISM_SAMPLES}
        initialFormTemplateUUID={TEST_FORM_TEMPLATE_COMPONENTS_DISABLED.id}
      />,
      testCtx
    );

    // Continue the test after the data fetch is done.
    await waitFor(() => {
      const loadingElements = screen.queryAllByText(/loading\.\.\./i);
      if (loadingElements.length > 0) {
        throw new Error("Loading elements still present");
      }
    });

    // Change the barcode in the visible section.
    userEvent.type(
      wrapper.getByRole("textbox", { name: /barcode/i }),
      "New Barcode"
    );

    // Click the "Save All" button:
    fireEvent.click(wrapper.getByRole("button", { name: /save all/i }));
    await new Promise(setImmediate);

    // Only the primary ID and barcode should be touched.
    expect(mockSave.mock.calls).toEqual([
      [
        [
          {
            resource: {
              barcode: "New Barcode",
              id: "1",
              type: "material-sample"
            },
            type: "material-sample"
          },
          {
            resource: {
              barcode: "New Barcode",
              id: "2",
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
