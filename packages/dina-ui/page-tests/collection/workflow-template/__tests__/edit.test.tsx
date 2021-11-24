import { SaveArgs } from "common-ui";
import { ReactWrapper } from "enzyme";
import { PersistedResource } from "kitsu";
import CreatableSelect from "react-select/creatable";
import ReactSwitch from "react-switch";
import { StorageLinker } from "../../../../components";
import { WorkflowTemplateForm } from "../../../../pages/collection/workflow-template/edit";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import {
  AcquisitionEvent,
  CollectingEvent,
  PreparationProcessDefinition,
  StorageUnit
} from "../../../../types/collection-api";

const mockOnSaved = jest.fn();

const TEST_GROUP_1 = {
  type: "group",
  name: "test-group-1",
  labels: { en: "Test Group 1" }
};

const TEST_PREP_TYPE = {
  id: "100",
  type: "preparation-type",
  name: "test-prep-type"
};

function testCollectionEvent(): Partial<CollectingEvent> {
  return {
    startEventDateTime: "2021-04-13",
    id: "321",
    type: "collecting-event",
    group: "test group"
  };
}

function testAcquisitionEvent(): Partial<AcquisitionEvent> {
  return {
    id: "987",
    type: "acquisition-event",
    group: "test group",
    receptionRemarks: "test reception remarks"
  };
}

const mockGet = jest.fn<any, any>(async path => {
  switch (path) {
    case "user-api/group":
      return { data: [TEST_GROUP_1] };
    case "objectstore-api/metadata":
      return { data: [] };
    case "collection-api/coordinate-system":
      return { data: [] };
    case "collection-api/srs":
      return { data: [] };
    case "collection-api/collecting-event":
      return { data: [testCollectionEvent()] };
    case "collection-api/collecting-event/321?include=collectors,attachment,collectionMethod":
      return { data: testCollectionEvent() };
    case "collection-api/acquisition-event":
      return { data: [testAcquisitionEvent()] };
    case "collection-api/acquisition-event/987":
      return { data: testAcquisitionEvent() };
    case "agent-api/person":
    case "collection-api/material-sample-type":
    case "collection-api/vocabulary/degreeOfEstablishment":
    case "collection-api/vocabulary/srs":
      return { data: [] };
    case "collection-api/preparation-type":
      return { data: [TEST_PREP_TYPE] };
  }
});

const mockSave = jest.fn<any, any>(async (saves: SaveArgs[]) =>
  saves.map(save => {
    switch (save.type) {
      case "material-sample-action-definition":
        return { ...save.resource, id: "123" };
      default:
        console.error("No save return type defined for", save);
    }
  })
);

const apiContext = {
  apiClient: {
    get: mockGet
  },
  save: mockSave
};

/** Mount the form and provide test util functions. */
async function mountForm(
  existingActionDefinition?: PersistedResource<PreparationProcessDefinition>
) {
  const wrapper = mountWithAppContext(
    <WorkflowTemplateForm
      onSaved={mockOnSaved}
      fetchedActionDefinition={existingActionDefinition}
    />,
    { apiContext }
  );

  await new Promise(setImmediate);
  wrapper.update();

  const colEventSwitch = () =>
    wrapper.find(".enable-collecting-event").find(ReactSwitch);
  const catalogSwitch = () =>
    wrapper.find(".enable-catalogue-info").find(ReactSwitch);
  const storageSwitch = () => wrapper.find(".enable-storage").find(ReactSwitch);
  const determinationSwitch = () =>
    wrapper.find(".enable-determination").find(ReactSwitch);
  const scheduledActionsSwitch = () =>
    wrapper.find(".enable-scheduled-actions").find(ReactSwitch);
  const acquisitionEventSwitch = () =>
    wrapper.find(".enable-acquisition-event").find(ReactSwitch);
  const associationsSwitch = () =>
    wrapper.find(".enable-associations").find(ReactSwitch);

  async function toggleDataComponent(
    switchElement: ReactWrapper<any>,
    val: boolean
  ) {
    switchElement.prop<any>("onChange")(val);
    if (!val) {
      // Click "yes" when asked Are You Sure:
      await new Promise(setImmediate);
      wrapper.update();
      wrapper.find(".modal-content form").simulate("submit");
      await new Promise(setImmediate);
      await new Promise(setImmediate);
    }
    await new Promise(setImmediate);
    wrapper.update();
  }

  async function toggleColEvent(val: boolean) {
    await toggleDataComponent(colEventSwitch(), val);
  }

  async function togglePreparations(val: boolean) {
    await toggleDataComponent(catalogSwitch(), val);
  }

  async function toggleStorage(val: boolean) {
    await toggleDataComponent(storageSwitch(), val);
  }

  async function toggleDeterminations(val: boolean) {
    await toggleDataComponent(determinationSwitch(), val);
  }

  async function toggleScheduledActions(val: boolean) {
    await toggleDataComponent(scheduledActionsSwitch(), val);
  }

  async function toggleAcquisitionEvent(val: boolean) {
    await toggleDataComponent(acquisitionEventSwitch(), val);
  }
  async function toggleAssociations(val: boolean) {
    await toggleDataComponent(associationsSwitch(), val);
  }

  async function fillOutRequiredFields() {
    // Set the name:
    wrapper
      .find(".workflow-main-details .name-field input")
      .simulate("change", { target: { value: "test-config" } });

    await new Promise(setImmediate);
    wrapper.update();
  }

  async function submitForm() {
    wrapper.find("form").simulate("submit");
    await new Promise(setImmediate);
    wrapper.update();
  }

  return {
    wrapper,
    toggleColEvent,
    togglePreparations,
    toggleStorage,
    toggleDeterminations,
    toggleScheduledActions,
    toggleAcquisitionEvent,
    toggleAssociations,
    colEventSwitch,
    catalogSwitch,
    storageSwitch,
    scheduledActionsSwitch,
    determinationSwitch,
    acquisitionEventSwitch,
    associationsSwitch,
    fillOutRequiredFields,
    submitForm
  };
}

describe("Workflow template edit page", () => {
  beforeEach(jest.clearAllMocks);

  it("Renders the blank template edit page", async () => {
    const { wrapper } = await mountForm();

    // Get the switches:
    const switches = wrapper.find(".material-sample-nav").find(ReactSwitch);
    expect(switches.length).not.toEqual(0);

    // All switches should be unchecked:
    expect(switches.map(node => node.prop("checked"))).toEqual(
      switches.map(() => false)
    );
  });

  it("Submits a new action-definition: minimal form submission.", async () => {
    const {
      toggleColEvent,
      togglePreparations,
      toggleStorage,
      catalogSwitch,
      colEventSwitch,
      storageSwitch,
      fillOutRequiredFields,
      submitForm
    } = await mountForm();

    // Enable the component toggles:
    await toggleColEvent(true);
    expect(colEventSwitch().prop("checked")).toEqual(true);
    await togglePreparations(true);
    expect(catalogSwitch().prop("checked")).toEqual(true);
    await toggleStorage(true);
    expect(storageSwitch().prop("checked")).toEqual(true);

    await fillOutRequiredFields();

    await submitForm();

    expect(mockOnSaved).lastCalledWith({
      actionType: "ADD",
      formTemplates: {
        // Both data components enabled but no fields defined:
        COLLECTING_EVENT: {
          templateFields: {}
        },
        MATERIAL_SAMPLE: {
          templateFields: {}
        }
      },
      group: "test-group-1",
      id: "123",
      name: "test-config",
      type: "material-sample-action-definition"
    });
  });

  it("Submits a new action-definition: Only set collecting event template fields.", async () => {
    const { wrapper, toggleColEvent, fillOutRequiredFields, submitForm } =
      await mountForm();

    await fillOutRequiredFields();

    // Enable the component toggles:
    await toggleColEvent(true);

    // Include all col date fields:
    wrapper
      .find("input[name='includeAllCollectingDate']")
      .simulate("change", { target: { checked: true } });
    wrapper.find(".verbatimEventDateTime-field input").simulate("change", {
      target: { value: "test-verbatim-default-datetime" }
    });

    // Set default geo assertion lat/lng:
    wrapper
      .find(".dwcDecimalLatitude.row input[type='checkbox']")
      .simulate("change", { target: { checked: true } });
    wrapper
      .find(".dwcDecimalLongitude.row input[type='checkbox']")
      .simulate("change", { target: { checked: true } });
    wrapper
      .find(".dwcDecimalLatitude.row NumberFormat")
      .prop<any>("onValueChange")({ floatValue: 1 });
    wrapper
      .find(".dwcDecimalLongitude.row NumberFormat")
      .prop<any>("onValueChange")({ floatValue: 2 });

    // Only allow new attachments:
    wrapper
      .find("#collecting-event-section input.allow-new-checkbox")
      .simulate("change", { target: { checked: true } });

    await new Promise(setImmediate);
    wrapper.update();

    await submitForm();

    expect(mockOnSaved).lastCalledWith({
      actionType: "ADD",
      formTemplates: {
        COLLECTING_EVENT: {
          allowNew: true,
          templateFields: {
            "geoReferenceAssertions[0].dwcDecimalLatitude": {
              defaultValue: 1,
              enabled: true
            },
            "geoReferenceAssertions[0].dwcDecimalLongitude": {
              defaultValue: 2,
              enabled: true
            },
            startEventDateTime: {
              // No default value set:
              enabled: true
            },
            endEventDateTime: {
              // No default value set:
              enabled: true
            },
            verbatimEventDateTime: {
              defaultValue: "test-verbatim-default-datetime",
              enabled: true
            }
          }
        },
        MATERIAL_SAMPLE: {
          templateFields: {}
        }
      },
      group: "test-group-1",
      id: "123",
      name: "test-config",
      type: "material-sample-action-definition"
    });
  });

  it("Submits a new action-definition: Only set preparations template fields.", async () => {
    const { wrapper, togglePreparations, fillOutRequiredFields, submitForm } =
      await mountForm();

    await fillOutRequiredFields();

    // Enable the component toggles:
    await togglePreparations(true);

    // Only allow new attachments:
    wrapper
      .find("#material-sample-attachments-section input.allow-new-checkbox")
      .simulate("change", { target: { checked: true } });

    // Set a default prep type:
    wrapper
      .find(".preparation-type input[type='checkbox']")
      .simulate("change", { target: { checked: true } });
    wrapper.find(".preparationType-field Select").prop<any>("onChange")({
      resource: TEST_PREP_TYPE
    });

    await submitForm();

    expect(mockOnSaved).lastCalledWith({
      actionType: "ADD",
      formTemplates: {
        MATERIAL_SAMPLE: {
          allowNew: true,
          templateFields: {
            preparationType: {
              defaultValue: {
                id: "100",
                name: "test-prep-type",
                type: "preparation-type"
              },
              enabled: true
            }
          }
        }
      },
      group: "test-group-1",
      id: "123",
      name: "test-config",
      type: "material-sample-action-definition"
    });
  });

  it("Submits a new action-definition: Only set Determinations template fields.", async () => {
    const { wrapper, toggleDeterminations, fillOutRequiredFields, submitForm } =
      await mountForm();

    await fillOutRequiredFields();

    // Enable the component toggles:
    await toggleDeterminations(true);

    // Only allow new attachments:
    wrapper
      .find("#material-sample-attachments-section input.allow-new-checkbox")
      .simulate("change", { target: { checked: true } });

    // Set a default verbatim scientific name:
    wrapper
      .find(".verbatimScientificName input[type='checkbox']")
      .simulate("change", { target: { checked: true } });
    wrapper
      .find(".verbatimScientificName-field input")
      .simulate("change", { target: { value: "test scientific name" } });

    await submitForm();

    expect(mockOnSaved).lastCalledWith({
      actionType: "ADD",
      formTemplates: {
        MATERIAL_SAMPLE: {
          allowNew: true,
          templateFields: {
            "determination[0].verbatimScientificName": {
              defaultValue: "test scientific name",
              enabled: true
            }
          }
        }
      },
      group: "test-group-1",
      id: "123",
      name: "test-config",
      type: "material-sample-action-definition"
    });
  });

  it("Submits a new action-definition: Only set Associations template fields.", async () => {
    const { wrapper, toggleAssociations, fillOutRequiredFields, submitForm } =
      await mountForm();

    await fillOutRequiredFields();

    // Enable the component toggles:
    await toggleAssociations(true);

    wrapper
      .find(".association-type input[type='checkbox']")
      .simulate("change", { target: { checked: true } });
    wrapper
      .find(".association-type")
      .find(CreatableSelect)
      .prop<any>("onChange")({
      value: "test default association type"
    });

    wrapper
      .find(".associated-sample input[type='checkbox']")
      .simulate("change", { target: { checked: true } });

    await submitForm();

    expect(mockOnSaved).lastCalledWith({
      actionType: "ADD",
      formTemplates: {
        MATERIAL_SAMPLE: {
          templateFields: {
            "associations[0].associatedSample": {
              enabled: true
            },
            "associations[0].associationType": {
              defaultValue: "test default association type",
              enabled: true
            }
          }
        }
      },
      group: "test-group-1",
      id: "123",
      name: "test-config",
      type: "material-sample-action-definition"
    });
  });

  it("Submits a new action-definition: Link to an existing Collecting Event.", async () => {
    const { wrapper, toggleColEvent, fillOutRequiredFields, submitForm } =
      await mountForm();

    await fillOutRequiredFields();

    // Enable the component toggles:
    await toggleColEvent(true);

    wrapper.find("button.collecting-event-link-button").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(".attached-resource-link").text()).toEqual(
      "Attached: 321"
    );

    await submitForm();

    expect(mockOnSaved).lastCalledWith({
      actionType: "ADD",
      formTemplates: {
        COLLECTING_EVENT: {
          templateFields: {
            // Only includes the linked collecting event's ID:
            id: {
              defaultValue: "321",
              enabled: true
            }
          }
        },
        MATERIAL_SAMPLE: {
          templateFields: {}
        }
      },
      group: "test-group-1",
      id: "123",
      name: "test-config",
      type: "material-sample-action-definition"
    });
  });

  it("Submits a new action-definition: Only set the storage template fields.", async () => {
    const { wrapper, toggleStorage, fillOutRequiredFields, submitForm } =
      await mountForm();

    await fillOutRequiredFields();

    // Enable the component toggles:
    await toggleStorage(true);

    // Add a default storage unit:
    wrapper
      .find("#storage-section input[type='checkbox']")
      .first()
      .simulate("change", { target: { checked: true } });
    wrapper.find(StorageLinker).prop<any>("onChange")({
      id: "TEST_STORAGE",
      name: "TEST_STORAGE"
    });

    await submitForm();

    expect(mockOnSaved).lastCalledWith({
      actionType: "ADD",
      formTemplates: {
        MATERIAL_SAMPLE: {
          templateFields: {
            storageUnit: {
              enabled: true,
              defaultValue: {
                id: "TEST_STORAGE",
                name: "TEST_STORAGE"
              }
            }
          }
        }
      },
      group: "test-group-1",
      id: "123",
      name: "test-config",
      type: "material-sample-action-definition"
    });
  });

  it("Submits a new action-definition: Only set the scheduled action template fields.", async () => {
    const {
      wrapper,
      toggleScheduledActions,
      fillOutRequiredFields,
      submitForm
    } = await mountForm();

    await fillOutRequiredFields();

    // Enable the component toggles:
    await toggleScheduledActions(true);

    // Add default remarks:
    wrapper
      .find("#scheduled-actions-section input[type='checkbox']")
      .last()
      .simulate("change", { target: { checked: true } });
    wrapper
      .find("#scheduled-actions-section .remarks-field textarea")
      .simulate("change", { target: { value: "default-remarks" } });

    await submitForm();

    expect(mockOnSaved).lastCalledWith({
      actionType: "ADD",
      formTemplates: {
        MATERIAL_SAMPLE: {
          templateFields: {
            "scheduledAction.remarks": {
              defaultValue: "default-remarks",
              enabled: true
            }
          }
        }
      },
      group: "test-group-1",
      id: "123",
      name: "test-config",
      type: "material-sample-action-definition"
    });
  });

  it("Submits a new action-definition: Only set the acquisition event template fields.", async () => {
    const {
      wrapper,
      toggleAcquisitionEvent,
      fillOutRequiredFields,
      submitForm
    } = await mountForm();

    await fillOutRequiredFields();

    // Enable the component toggles:
    await toggleAcquisitionEvent(true);

    // Add default remarks:
    wrapper
      .find(".receptionRemarks input[type='checkbox']")
      .last()
      .simulate("change", { target: { checked: true } });
    wrapper
      .find(".receptionRemarks-field textarea")
      .simulate("change", { target: { value: "default-reception-remarks" } });

    await submitForm();

    expect(mockOnSaved).lastCalledWith({
      actionType: "ADD",
      formTemplates: {
        MATERIAL_SAMPLE: {
          templateFields: {}
        },
        ACQUISITION_EVENT: {
          templateFields: {
            receptionRemarks: {
              defaultValue: "default-reception-remarks",
              enabled: true
            }
          }
        }
      },
      group: "test-group-1",
      id: "123",
      name: "test-config",
      type: "material-sample-action-definition"
    });
  });

  it("Submits a new action-definition: Link to an existing Acquisition Event.", async () => {
    const {
      wrapper,
      toggleAcquisitionEvent,
      fillOutRequiredFields,
      submitForm
    } = await mountForm();

    await fillOutRequiredFields();

    // Enable the component toggles:
    await toggleAcquisitionEvent(true);

    wrapper.find("button.acquisition-event-link-button").simulate("click");

    await new Promise(setImmediate);
    wrapper.update();

    expect(wrapper.find(".attached-resource-link").text()).toEqual(
      "Attached: 987"
    );

    await submitForm();

    expect(mockOnSaved).lastCalledWith({
      actionType: "ADD",
      formTemplates: {
        ACQUISITION_EVENT: {
          templateFields: {
            // Only includes the linked acquisition event's ID:
            id: {
              defaultValue: "987",
              enabled: true
            }
          }
        },
        MATERIAL_SAMPLE: {
          templateFields: {}
        }
      },
      group: "test-group-1",
      id: "123",
      name: "test-config",
      type: "material-sample-action-definition"
    });
  });

  it("Edits an existing action-definition: Renders the form with minimal data.", async () => {
    const { colEventSwitch, catalogSwitch, scheduledActionsSwitch } =
      await mountForm({
        actionType: "ADD",
        formTemplates: {},
        group: "test-group-1",
        id: "123",
        name: "test-config",
        type: "material-sample-action-definition"
      });

    // Checkboxes are unchecked:
    expect(colEventSwitch().prop("checked")).toEqual(false);
    expect(catalogSwitch().prop("checked")).toEqual(false);
    expect(scheduledActionsSwitch().prop("checked")).toEqual(false);
  });

  it("Edits an existing action-definition: Can unlink an existing Collecting Event.", async () => {
    const { wrapper, colEventSwitch, catalogSwitch, submitForm } =
      await mountForm({
        actionType: "ADD",
        formTemplates: {
          COLLECTING_EVENT: {
            allowExisting: false,
            allowNew: false,
            templateFields: {
              id: {
                enabled: true,
                defaultValue: "321"
              }
            }
          }
        },
        group: "test-group-1",
        id: "123",
        name: "test-config",
        type: "material-sample-action-definition"
      });

    expect(colEventSwitch().prop("checked")).toEqual(true);
    expect(catalogSwitch().prop("checked")).toEqual(false);

    expect(wrapper.find(".attached-resource-link").text()).toEqual(
      "Attached: 321"
    );

    // Unlink the Collecting Event:
    wrapper.find("button.detach-resource-button").simulate("click");

    await submitForm();

    // The template's link was removed:
    expect(mockOnSaved).lastCalledWith({
      actionType: "ADD",
      formTemplates: {
        COLLECTING_EVENT: {
          allowExisting: false,
          allowNew: false,
          templateFields: {}
        },
        MATERIAL_SAMPLE: {
          templateFields: {}
        }
      },
      group: "test-group-1",
      id: "123",
      name: "test-config",
      type: "material-sample-action-definition"
    });
  });

  it("Edits an existing action-definition: Can unlink an existing Acquisition Event.", async () => {
    const { wrapper, acquisitionEventSwitch, submitForm } = await mountForm({
      actionType: "ADD",
      formTemplates: {
        ACQUISITION_EVENT: {
          allowExisting: true,
          allowNew: true,
          templateFields: {
            id: {
              enabled: true,
              defaultValue: "987"
            }
          }
        }
      },
      group: "test-group-1",
      id: "123",
      name: "test-config",
      type: "material-sample-action-definition"
    });

    expect(acquisitionEventSwitch().prop("checked")).toEqual(true);

    expect(wrapper.find(".attached-resource-link").text()).toEqual(
      "Attached: 987"
    );

    // Unlink the Collecting Event:
    wrapper.find("button.detach-resource-button").simulate("click");

    await submitForm();

    // The template's link was removed:
    expect(mockOnSaved).lastCalledWith({
      actionType: "ADD",
      formTemplates: {
        ACQUISITION_EVENT: {
          templateFields: {}
        },
        MATERIAL_SAMPLE: {
          templateFields: {}
        }
      },
      group: "test-group-1",
      id: "123",
      name: "test-config",
      type: "material-sample-action-definition"
    });
  });

  it("Edits an existing action-definition: Can change the enabled and default values.", async () => {
    const { wrapper, colEventSwitch, catalogSwitch, submitForm } =
      await mountForm({
        actionType: "ADD",
        formTemplates: {
          COLLECTING_EVENT: {
            allowNew: true,
            allowExisting: true,
            templateFields: {
              dwcRecordNumber: {
                defaultValue: null,
                enabled: true
              },
              verbatimEventDateTime: {
                defaultValue: "test-verbatim-default-datetime",
                enabled: true
              }
            }
          },
          MATERIAL_SAMPLE: {
            allowNew: true,
            allowExisting: true,
            templateFields: {
              preparationType: {
                defaultValue: {
                  id: "100",
                  name: "test-prep-type",
                  type: "preparation-type"
                },
                enabled: true
              }
            }
          }
        },
        group: "test-group-1",
        id: "123",
        name: "test-config",
        type: "material-sample-action-definition"
      });

    // Data Component checkboxes are checked:
    expect(colEventSwitch().prop("checked")).toEqual(true);
    expect(catalogSwitch().prop("checked")).toEqual(true);

    // Change a default value:
    wrapper.find(".dwcRecordNumber-field input").simulate("change", {
      target: { value: "test-default-recorded-by" }
    });
    // Uncheck a box:
    wrapper
      .find("input[name='includeAllCollectingDate']")
      .simulate("change", { target: { checked: false } });

    await new Promise(setImmediate);
    wrapper.update();

    await submitForm();

    // The template's link was removed:
    expect(mockOnSaved).lastCalledWith({
      actionType: "ADD",
      formTemplates: {
        COLLECTING_EVENT: {
          allowExisting: true,
          allowNew: true,
          templateFields: {
            // New values:
            dwcRecordNumber: {
              enabled: true,
              defaultValue: "test-default-recorded-by"
            }
          }
        },
        MATERIAL_SAMPLE: {
          allowExisting: true,
          allowNew: true,
          templateFields: {
            preparationType: {
              defaultValue: {
                id: "100",
                name: "test-prep-type",
                type: "preparation-type"
              },
              enabled: true
            }
          }
        }
      },
      group: "test-group-1",
      id: "123",
      name: "test-config",
      type: "material-sample-action-definition"
    });
  });

  it("Edits an existing action-definition: Can remove the data components.", async () => {
    const {
      colEventSwitch,
      catalogSwitch,
      storageSwitch,
      determinationSwitch,
      scheduledActionsSwitch,
      toggleColEvent,
      togglePreparations,
      toggleStorage,
      toggleDeterminations,
      toggleScheduledActions,
      submitForm
    } = await mountForm({
      actionType: "ADD",
      formTemplates: {
        COLLECTING_EVENT: {
          allowNew: true,
          allowExisting: true,
          templateFields: {
            verbatimEventDateTime: {
              defaultValue: "test-verbatim-default-datetime",
              enabled: true
            }
          }
        },
        MATERIAL_SAMPLE: {
          allowNew: true,
          allowExisting: true,
          templateFields: {
            preparationType: {
              defaultValue: {
                id: "100",
                name: "test-prep-type",
                type: "preparation-type"
              },
              enabled: true
            },
            storageUnit: {
              enabled: true,
              defaultValue: {
                id: "TEST_STORAGE",
                type: "storage-unit",
                name: "TEST_STORAGE"
              } as StorageUnit
            },
            ...{
              "determination[0].verbatimScientificName": {
                defaultValue: "test scientific name",
                enabled: true
              },
              "scheduledAction.remarks": {
                defaultValue: "default-remarks",
                enabled: true
              }
            }
          }
        }
      },
      group: "test-group-1",
      id: "123",
      name: "test-config",
      type: "material-sample-action-definition"
    });

    // Data Component checkboxes are checked:
    expect(colEventSwitch().prop("checked")).toEqual(true);
    expect(catalogSwitch().prop("checked")).toEqual(true);
    expect(storageSwitch().prop("checked")).toEqual(true);
    expect(determinationSwitch().prop("checked")).toEqual(true);
    expect(scheduledActionsSwitch().prop("checked")).toEqual(true);

    // Remove all data components:
    await toggleColEvent(false);
    await togglePreparations(false);
    await toggleStorage(false);
    await toggleDeterminations(false);
    await toggleScheduledActions(false);

    await submitForm();

    expect(mockOnSaved).lastCalledWith({
      actionType: "ADD",
      // Both data components removed:
      formTemplates: {
        MATERIAL_SAMPLE: {
          allowNew: true,
          allowExisting: true,
          templateFields: {}
        }
      },
      group: "test-group-1",
      id: "123",
      name: "test-config",
      type: "material-sample-action-definition"
    });
  });

  it("Edits an existing action-definition: Splits the Identifiers and Preparation subforms correctly", async () => {
    const { wrapper, submitForm } = await mountForm({
      actionType: "ADD",
      formTemplates: {
        MATERIAL_SAMPLE: {
          allowNew: true,
          allowExisting: true,
          templateFields: {
            materialSampleName: {
              defaultValue: "test-default-name",
              enabled: true
            },
            dwcOtherCatalogNumbers: {
              defaultValue: ["other-number-1", "other-number-2"],
              enabled: true
            },
            preparationType: {
              defaultValue: {
                id: "100",
                name: "test-prep-type",
                type: "preparation-type"
              },
              enabled: true
            }
          }
        }
      },
      group: "test-group-1",
      id: "123",
      name: "test-config",
      type: "material-sample-action-definition"
    });

    // The input values should be initialized:
    expect(
      wrapper.find(".materialSampleName-field input").prop("value")
    ).toEqual("test-default-name");
    expect(
      wrapper.find(".dwcOtherCatalogNumbers-field textarea").prop("value")
    ).toEqual("other-number-1\nother-number-2\n");
    expect(
      wrapper.find(".preparationType-field ResourceSelect").prop<any>("value")
    ).toEqual({
      id: "100",
      name: "test-prep-type",
      type: "preparation-type"
    });

    wrapper
      .find(".materialSampleName-field input")
      .simulate("change", { target: { value: "edited-material-sample-name" } });

    await submitForm();

    expect(mockOnSaved).lastCalledWith({
      actionType: "ADD",
      formTemplates: {
        MATERIAL_SAMPLE: {
          allowExisting: true,
          allowNew: true,
          templateFields: {
            dwcOtherCatalogNumbers: {
              defaultValue: ["other-number-1", "other-number-2"],
              enabled: true
            },
            materialSampleName: {
              // The edited value:
              defaultValue: "edited-material-sample-name",
              enabled: true
            },
            preparationType: {
              defaultValue: {
                id: "100",
                name: "test-prep-type",
                type: "preparation-type"
              },
              enabled: true
            }
          }
        }
      },
      group: "test-group-1",
      id: "123",
      name: "test-config",
      type: "material-sample-action-definition"
    });
  });
});
