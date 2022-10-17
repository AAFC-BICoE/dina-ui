import { ResourceSelect, SaveArgs } from "common-ui";
import { ReactWrapper } from "enzyme";
import { PersistedResource } from "kitsu";
import CreatableSelect from "react-select/creatable";
import ReactSwitch from "react-switch";
import { StorageLinker } from "../../../../components";
import { FormTemplateEditPageLoaded } from "../../../../pages/collection/form-template/edit";
import { mountWithAppContext } from "../../../../test-util/mock-app-context";
import {
  AcquisitionEvent,
  CollectingEvent,
  FormTemplate,
  StorageUnit
} from "../../../../types/collection-api";
import { noop } from "lodash";
import { getComponentOrderFromTemplate } from "../../../../components/form-template/formTemplateUtils";

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

const mockGet = jest.fn<any, any>(async (path) => {
  switch (path) {
    case "user-api/group":
      return { data: [TEST_GROUP_1] };
    case "collection-api/collecting-event":
      return { data: [testCollectionEvent()] };
    case "collection-api/collecting-event/321?include=collectors,attachment,collectionMethod":
      return { data: testCollectionEvent() };
    case "collection-api/acquisition-event":
      return { data: [testAcquisitionEvent()] };
    case "collection-api/acquisition-event/987":
      return { data: testAcquisitionEvent() };
    case "collection-api/preparation-type":
      return { data: [TEST_PREP_TYPE] };
    case "agent-api/person":
    case "collection-api/coordinate-system":
    case "collection-api/srs":
    case "collection-api/material-sample-type":
    case "collection-api/vocabulary/degreeOfEstablishment":
    case "collection-api/vocabulary/srs":
    case "collection-api/material-sample":
    case "collection-api/managed-attribute":
    case "collection-api/vocabulary/materialSampleState":
    case "collection-api/collection":
    case "collection-api/project":
    case "collection-api/vocabulary/materialSampleType":
    case "collection-api/vocabulary/typeStatus":
    case "collection-api/organism":
    case "collection-api/collection-method":
    case "collection-api/vocabulary/coordinateSystem":
    case "collection-api/vocabulary/materialSampleType":
    case "objectstore-api/metadata":
    case "user-api/user":
      return { data: [] };
  }
});

const mockBulkGet = jest.fn<any, any>(async (paths: string[]) =>
  paths.map((path) => {
    switch (path) {
      case "managed-attribute/MATERIAL_SAMPLE.attribute_1":
        return { id: "1", key: "attribute_1", name: "Attribute 1" };
      case "managed-attribute/MATERIAL_SAMPLE.attribute_2":
        return { id: "1", key: "attribute_2", name: "Attribute 2" };
      case "managed-attribute/COLLECTING_EVENT.attribute_1":
        return { id: "1", key: "attribute_1", name: "Attribute 1" };
      case "managed-attribute/COLLECTING_EVENT.attribute_2":
        return { id: "1", key: "attribute_2", name: "Attribute 2" };
      case "managed-attribute/DETERMINATION.attribute_1":
        return { id: "1", key: "attribute_1", name: "Attribute 1" };
      case "managed-attribute/DETERMINATION.attribute_2":
        return { id: "1", key: "attribute_2", name: "Attribute 2" };
    }
  })
);

const mockSave = jest.fn<any, any>(async (saves: SaveArgs[]) =>
  saves.map((save) => ({
    ...save.resource,
    id: save.resource.id ?? "123"
  }))
);

const apiContext = {
  bulkGet: mockBulkGet,
  apiClient: {
    get: mockGet
  },
  save: mockSave
};

/** Mount the form and provide test util functions. */
async function mountForm(
  existingActionDefinition?: PersistedResource<FormTemplate>
) {
  const wrapper = mountWithAppContext(
    <FormTemplateEditPageLoaded
      id={existingActionDefinition?.id}
      fetchedFormTemplate={existingActionDefinition}
      onSaved={mockOnSaved}
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
  const organismsSwitch = () =>
    wrapper.find(".enable-organisms").find(ReactSwitch);
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

  async function toggleOrganisms(val: boolean) {
    await toggleDataComponent(organismsSwitch(), val);
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
    toggleOrganisms,
    toggleScheduledActions,
    toggleAcquisitionEvent,
    toggleAssociations,
    colEventSwitch,
    catalogSwitch,
    storageSwitch,
    scheduledActionsSwitch,
    organismsSwitch,
    acquisitionEventSwitch,
    associationsSwitch,
    fillOutRequiredFields,
    submitForm
  };
}

const formTemplate: PersistedResource<FormTemplate> = {
  id: "123",
  type: "form-template",
  name: "form1",
  group: "aafc",
  restrictToCreatedBy: false,
  viewConfiguration: {},
  components: [
    {
      name: "identifiers-component",
      visible: true,
      order: 0,
      sections: [
        {
          name: "general-section",
          visible: true,
          items: [
            {
              name: "tags",
              visible: false
            },
            {
              name: "projects",
              visible: false
            },
            {
              name: "assemblages",
              visible: false
            },
            {
              name: "publiclyReleasable",
              visible: false
            },
            {
              name: "notPubliclyReleasableReason",
              visible: false
            }
          ]
        },
        {
          name: "identifiers-section",
          visible: true,
          items: [
            {
              name: "collection",
              visible: false
            },
            {
              name: "materialSampleName",
              visible: false
            },
            {
              name: "useNextSequence",
              visible: false
            },
            {
              name: "dwcOtherCatalogNumbers",
              visible: false
            },
            {
              name: "barcode",
              visible: false
            }
          ]
        }
      ]
    },
    {
      name: "material-sample-info-component",
      visible: true,
      order: 1,
      sections: [
        {
          name: "material-sample-info-section",
          visible: true,
          items: [
            {
              name: "materialSampleType",
              visible: false
            },
            {
              name: "materialSampleRemarks",
              visible: false
            },
            {
              name: "materialSampleState",
              visible: false
            },
            {
              name: "stateChangeRemarks",
              visible: false
            },
            {
              name: "stateChangedOn",
              visible: false
            }
          ]
        }
      ]
    },
    {
      name: "collecting-event-component",
      visible: false,
      order: 3,
      sections: [
        {
          name: "general-section",
          visible: true,
          items: [
            {
              name: "tags",
              visible: false
            },
            {
              name: "publiclyReleasable",
              visible: false
            },
            {
              name: "notPubliclyReleasableReason",
              visible: false
            }
          ]
        },
        {
          name: "identifiers-section",
          visible: true,
          items: [
            {
              name: "dwcFieldNumber",
              visible: false
            }
          ]
        },
        {
          name: "collecting-date-section",
          visible: true,
          items: [
            {
              name: "verbatimEventDateTime",
              visible: false
            },
            {
              name: "startEventDateTime",
              visible: false
            },
            {
              name: "endEventDateTime",
              visible: false
            }
          ]
        },
        {
          name: "collecting-agents-section",
          visible: true,
          items: [
            {
              name: "dwcRecordedBy",
              visible: false
            },
            {
              name: "collectors",
              visible: false
            },
            {
              name: "dwcRecordNumber",
              visible: false
            }
          ]
        },
        {
          name: "verbatim-label-section",
          visible: true,
          items: [
            {
              name: "dwcVerbatimLocality",
              visible: false
            },
            {
              name: "dwcVerbatimCoordinateSystem",
              visible: false
            },
            {
              name: "dwcVerbatimCoordinates",
              visible: false
            },
            {
              name: "dwcVerbatimLatitude",
              visible: false
            },
            {
              name: "dwcVerbatimLongitude",
              visible: false
            },
            {
              name: "dwcVerbatimSRS",
              visible: false
            },
            {
              name: "dwcVerbatimElevation",
              visible: false
            },
            {
              name: "dwcVerbatimDepth",
              visible: false
            }
          ]
        },
        {
          name: "collecting-event-details",
          visible: true,
          items: [
            {
              name: "habitat",
              visible: false
            },
            {
              name: "host",
              visible: false
            },
            {
              name: "collectionMethod",
              visible: false
            },
            {
              name: "substrate",
              visible: false
            },
            {
              name: "dwcMinimumElevationInMeters",
              visible: false
            },
            {
              name: "dwcMaximumElevationInMeters",
              visible: false
            },
            {
              name: "dwcMinimumDepthInMeters",
              visible: false
            },
            {
              name: "dwcMaximumDepthInMeters",
              visible: false
            },
            {
              name: "remarks",
              visible: false
            }
          ]
        },
        {
          name: "georeferencing-section",
          visible: true,
          items: [
            {
              name: "geoReferenceAssertions[0].dwcGeoreferenceVerificationStatus",
              visible: false
            },
            {
              name: "geoReferenceAssertions[0].dwcDecimalLatitude",
              visible: false
            },
            {
              name: "geoReferenceAssertions[0].dwcDecimalLongitude",
              visible: false
            },
            {
              name: "geoReferenceAssertions[0].dwcCoordinateUncertaintyInMeters",
              visible: false
            },
            {
              name: "geoReferenceAssertions[0].dwcGeoreferencedDate",
              visible: false
            },
            {
              name: "geoReferenceAssertions[0].dwcGeodeticDatum",
              visible: false
            },
            {
              name: "geoReferenceAssertions[0].literalGeoreferencedBy",
              visible: false
            },
            {
              name: "geoReferenceAssertions[0].georeferencedBy",
              visible: false
            },
            {
              name: "geoReferenceAssertions[0].dwcGeoreferenceProtocol",
              visible: false
            },
            {
              name: "geoReferenceAssertions[0].dwcGeoreferenceSources",
              visible: false
            },
            {
              name: "geoReferenceAssertions[0].dwcGeoreferenceRemarks",
              visible: false
            },
            {
              name: "geoReferenceAssertions",
              visible: false
            }
          ]
        },
        {
          name: "current-geographic-place",
          visible: true,
          items: [
            {
              name: "srcAdminLevels",
              visible: false
            },
            {
              name: "geographicPlaceNameSourceDetail.stateProvince",
              visible: false
            },
            {
              name: "geographicPlaceNameSourceDetail.country",
              visible: false
            }
          ]
        },
        {
          name: "collecting-event-managed-attributes-section",
          visible: true,
          items: []
        },
        {
          name: "collecting-event-attachments-section",
          visible: true,
          items: [
            {
              name: "managedAttributes.attachmentsConfig.allowNew",
              visible: false
            },
            {
              name: "managedAttributes.attachmentsConfig.allowExisting",
              visible: false
            }
          ]
        }
      ]
    },
    {
      name: "acquisition-event-component",
      visible: false,
      order: 2,
      sections: [
        {
          name: "acquisition-event-reception-section",
          visible: true,
          items: [
            {
              name: "group",
              visible: false,
              defaultValue: "aafc"
            },
            {
              name: "receivedFrom",
              visible: false
            },
            {
              name: "receivedDate",
              visible: false
            },
            {
              name: "receptionRemarks",
              visible: false
            }
          ]
        },
        {
          name: "acquisition-event-isolation-section",
          visible: true,
          items: [
            {
              name: "isolatedBy",
              visible: false
            },
            {
              name: "isolatedOn",
              visible: false
            },
            {
              name: "isolationRemarks",
              visible: false
            }
          ]
        }
      ]
    },
    {
      name: "preparations-component",
      visible: false,
      order: 4,
      sections: [
        {
          name: "general-section",
          visible: true,
          items: [
            {
              name: "preparationType",
              visible: false
            },
            {
              name: "preparationMethod",
              visible: false
            },
            {
              name: "preservationType",
              visible: false
            },
            {
              name: "preparationFixative",
              visible: false
            },
            {
              name: "preparationMaterials",
              visible: false
            },
            {
              name: "preparationSubstrate",
              visible: false
            },
            {
              name: "preparationRemarks",
              visible: false
            },
            {
              name: "dwcDegreeOfEstablishment",
              visible: false
            },
            {
              name: "preparedBy",
              visible: false
            },
            {
              name: "preparationDate",
              visible: false
            },
            {
              name: "preparationProtocol",
              visible: false
            }
          ]
        }
      ]
    },
    {
      name: "organisms-component",
      visible: false,
      order: 5,
      sections: [
        {
          name: "organisms-general-section",
          visible: true,
          items: [
            {
              name: "organism[0].lifeStage",
              visible: false
            },
            {
              name: "organism[0].sex",
              visible: false
            },
            {
              name: "organism[0].remarks",
              visible: false
            },
            {
              name: "organism",
              visible: false
            }
          ]
        },
        {
          name: "organism-verbatim-determination-section",
          visible: true,
          items: [
            {
              name: "organism[0].determination[0].verbatimScientificName",
              visible: false
            },
            {
              name: "organism[0].determination[0].verbatimDeterminer",
              visible: false
            },
            {
              name: "organism[0].determination[0].verbatimDate",
              visible: false
            },
            {
              name: "organism[0].determination[0].verbatimRemarks",
              visible: false
            },
            {
              name: "organism[0].determination[0].transcriberRemarks",
              visible: false
            }
          ]
        },
        {
          name: "organism-determination-section",
          visible: true,
          items: [
            {
              name: "organism[0].determination[0].scientificName",
              visible: false
            },
            {
              name: "organism[0].determination[0].scientificNameInput",
              visible: false
            },
            {
              name: "organism[0].determination[0].determiner",
              visible: false
            },
            {
              name: "organism[0].determination[0].determinedOn",
              visible: false
            },
            {
              name: "organism[0].determination[0].determinationRemarks",
              visible: false
            }
          ]
        },
        {
          name: "organism-type-specimen-section",
          visible: true,
          items: [
            {
              name: "organism[0].determination[0].typeStatus",
              visible: false
            },
            {
              name: "organism[0].determination[0].typeStatusEvidence",
              visible: false
            }
          ]
        },
        {
          name: "organism-managed-attributes-section",
          visible: true,
          items: []
        }
      ]
    },
    {
      name: "associations-component",
      visible: false,
      order: 6,
      sections: [
        {
          name: "associations-host-organism-section",
          visible: true,
          items: [
            {
              name: "hostOrganism.name",
              visible: false
            },
            {
              name: "hostOrganism.remarks",
              visible: false
            }
          ]
        },
        {
          name: "associations-material-sample-section",
          visible: true,
          items: [
            {
              name: "associations.associationType",
              visible: false
            },
            {
              name: "associations.associatedSample",
              visible: false
            },
            {
              name: "associations.remarks",
              visible: false
            }
          ]
        }
      ]
    },
    {
      name: "storage-component",
      visible: false,
      order: 7,
      sections: [
        {
          name: "storage-selection-section",
          visible: true,
          items: [
            {
              name: "storageUnit",
              visible: false
            }
          ]
        }
      ]
    },
    {
      name: "restriction-component",
      visible: false,
      order: 8,
      sections: [
        {
          name: "restriction-general-section",
          visible: true,
          items: [
            {
              name: "phac_animal_rg",
              visible: false
            },
            {
              name: "cfia_ppc",
              visible: false
            },
            {
              name: "phac_human_rg",
              visible: false
            },
            {
              name: "phac_cl",
              visible: false
            },
            {
              name: "isRestricted",
              visible: false
            },
            {
              name: "restrictionRemarks",
              visible: false
            }
          ]
        }
      ]
    },
    {
      name: "scheduled-actions-component",
      visible: false,
      order: 9,
      sections: [
        {
          name: "scheduled-actions-add-section",
          visible: true,
          items: [
            {
              name: "scheduledAction.actionType",
              visible: false
            },
            {
              name: "scheduledAction.actionStatus",
              visible: false
            },
            {
              name: "scheduledAction.date",
              visible: false
            },
            {
              name: "scheduledAction.assignedTo",
              visible: false
            },
            {
              name: "scheduledAction.remarks",
              visible: false
            }
          ]
        }
      ]
    },
    {
      name: "managed-attributes-component",
      visible: true,
      order: 10,
      sections: [
        {
          name: "managed-attributes-section",
          visible: true,
          items: []
        }
      ]
    },
    {
      name: "material-sample-attachments-component",
      visible: true,
      order: 11,
      sections: [
        {
          name: "material-sample-attachments-sections",
          visible: true,
          items: [
            {
              name: "attachmentsConfig.allowNew",
              visible: false
            },
            {
              name: "attachmentsConfig.allowExisting",
              visible: false
            }
          ]
        }
      ]
    }
  ]
};

describe("Workflow template edit page", () => {
  beforeEach(jest.clearAllMocks);

  it("Renders the blank template edit page", async () => {
    const { wrapper } = await mountForm();

    // Get the switches:
    const switches = wrapper.find(".material-sample-nav").find(ReactSwitch);
    expect(switches.length).not.toEqual(0);

    // All switches should be unchecked:
    expect(switches.map((node) => node.prop("checked"))).toEqual(
      switches.map(() => false)
    );
  });

  it("Renders the template page with a custom Nav Order.", async () => {
    const { submitForm } = await mountForm(formTemplate);

    await submitForm();

    // The nav order was re-saved:
    const navOrder = getComponentOrderFromTemplate(
      mockOnSaved.mock.calls[0][0]
    );
    expect(navOrder).toEqual([
      "identifiers-component",
      "material-sample-info-component",
      "acquisition-event-component",
      "collecting-event-component",
      "preparations-component",
      "organisms-component",
      "associations-component",
      "storage-component",
      "restriction-component",
      "scheduled-actions-component",
      "managed-attributes-component",
      "material-sample-attachments-component"
    ]);
  });

  it("Edits an existing action-definition: Renders the form with minimal data.", async () => {
    const { colEventSwitch, catalogSwitch, scheduledActionsSwitch } =
      await mountForm(formTemplate);

    // Checkboxes are unchecked:
    expect(colEventSwitch().prop("checked")).toEqual(false);
    expect(catalogSwitch().prop("checked")).toEqual(false);
    expect(scheduledActionsSwitch().prop("checked")).toEqual(false);
  });
});
