import { SaveArgs } from "common-ui";
import { PersistedResource } from "kitsu";
import { getComponentOrderFromTemplate } from "../../../../components/form-template/formTemplateUtils";
import { FormTemplateEditPageLoaded } from "../../../../pages/collection/form-template/edit";
import { mountWithAppContext } from "common-ui";
import {
  ASSOCIATIONS_COMPONENT_NAME,
  CollectingEvent,
  COLLECTING_EVENT_COMPONENT_NAME,
  FIELD_EXTENSIONS_COMPONENT_NAME,
  FormTemplate,
  IDENTIFIER_COMPONENT_NAME,
  MANAGED_ATTRIBUTES_COMPONENT_NAME,
  MATERIAL_SAMPLE_ATTACHMENTS_COMPONENT_NAME,
  MATERIAL_SAMPLE_INFO_COMPONENT_NAME,
  ORGANISMS_COMPONENT_NAME,
  PREPARATIONS_COMPONENT_NAME,
  RESTRICTION_COMPONENT_NAME,
  SCHEDULED_ACTIONS_COMPONENT_NAME,
  STORAGE_COMPONENT_NAME
} from "../../../../types/collection-api";
import { screen, waitFor, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom";
const mockOnSaved = jest.fn();

const TEST_GROUP_1 = {
  type: "group",
  name: "aafc",
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

const mockGet = jest.fn<any, any>(async (path) => {
  switch (path) {
    case "user-api/group":
      return { data: [TEST_GROUP_1] };
    case "collection-api/collecting-event":
      return { data: [testCollectionEvent()] };
    case "collection-api/collecting-event/321?include=collectors,attachment,collectionMethod,protocol":
      return { data: testCollectionEvent() };
    case "collection-api/preparation-type":
      return { data: [TEST_PREP_TYPE] };
    case "agent-api/person":
    case "collection-api/coordinate-system":
    case "collection-api/srs":
    case "collection-api/material-sample-type":
    case "collection-api/vocabulary2/degreeOfEstablishment":
    case "collection-api/vocabulary2/srs":
    case "collection-api/material-sample":
    case "collection-api/managed-attribute":
    case "collection-api/vocabulary2/materialSampleState":
    case "collection-api/collection":
    case "collection-api/project":
    case "collection-api/vocabulary2/materialSampleType":
    case "collection-api/vocabulary2/typeStatus":
    case "collection-api/organism":
    case "collection-api/collection-method":
    case "collection-api/vocabulary2/coordinateSystem":
    case "collection-api/vocabulary2/materialSampleType":
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

  // Helper to query and interact with React Switch components.
  const colEventSwitch = within(
    wrapper.container.querySelector(".enable-collecting-event")! as HTMLElement
  ).getByRole("switch") as HTMLInputElement;
  const catalogSwitch = within(
    wrapper.container.querySelector(".enable-catalogue-info")! as HTMLElement
  ).getByRole("switch") as HTMLInputElement;
  const storageSwitch = within(
    wrapper.container.querySelector(".enable-storage")! as HTMLElement
  ).getByRole("switch") as HTMLInputElement;
  const organismsSwitch = within(
    wrapper.container.querySelector(".enable-organisms")! as HTMLElement
  ).getByRole("switch") as HTMLInputElement;
  const scheduledActionsSwitch = within(
    wrapper.container.querySelector(".enable-scheduled-actions")! as HTMLElement
  ).getByRole("switch") as HTMLInputElement;
  const associationsSwitch = within(
    wrapper.container.querySelector(".enable-associations")! as HTMLElement
  ).getByRole("switch") as HTMLInputElement;

  async function toggleDataComponent(switchElement: HTMLElement, val: boolean) {
    // Simulate click event on the checkbox
    fireEvent.click(switchElement);
    if (!val) {
      // Click "yes" when asked Are You Sure:
      const modalForm = wrapper.container.querySelector(".modal-content form");
      fireEvent.submit(modalForm!);
      await new Promise(setImmediate);
    }
    await new Promise(setImmediate);
  }

  async function toggleColEvent(val: boolean) {
    await toggleDataComponent(colEventSwitch, val);
  }

  async function togglePreparations(val: boolean) {
    await toggleDataComponent(catalogSwitch, val);
  }

  async function toggleStorage(val: boolean) {
    await toggleDataComponent(storageSwitch, val);
  }

  async function toggleOrganisms(val: boolean) {
    await toggleDataComponent(organismsSwitch, val);
  }

  async function toggleScheduledActions(val: boolean) {
    await toggleDataComponent(scheduledActionsSwitch, val);
  }

  async function toggleAssociations(val: boolean) {
    await toggleDataComponent(associationsSwitch, val);
  }

  async function fillOutRequiredFields() {
    const nameInput = wrapper.container.querySelector(
      ".workflow-main-details .name-field input"
    );
    fireEvent.change(nameInput!, { target: { value: "form1" } });

    await new Promise(setImmediate);
  }

  async function submitForm() {
    const form = wrapper.container.querySelector("form");
    fireEvent.submit(form!);

    await new Promise(setImmediate);
  }

  return {
    wrapper,
    toggleColEvent,
    togglePreparations,
    toggleStorage,
    toggleOrganisms,
    toggleScheduledActions,
    toggleAssociations,
    colEventSwitch,
    catalogSwitch,
    storageSwitch,
    scheduledActionsSwitch,
    organismsSwitch,
    associationsSwitch,
    fillOutRequiredFields,
    submitForm
  };
}

/**
 * Form Template used for tests.
 * Nav Order has collecting event swapped compared to default
 */
const formTemplate: PersistedResource<FormTemplate> = {
  id: "123",
  type: "form-template",
  name: "form1",
  group: "aafc",
  restrictToCreatedBy: true,
  viewConfiguration: {},
  components: [
    {
      name: IDENTIFIER_COMPONENT_NAME,
      visible: true,
      order: 1,
      sections: [
        {
          name: "general-section",
          visible: true,
          items: [
            {
              defaultValue: undefined,
              name: "tags",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "projects",
              visible: false
            },
            { defaultValue: undefined, name: "assemblages", visible: false },
            {
              defaultValue: undefined,
              name: "publiclyReleasable",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "notPubliclyReleasableReason",
              visible: false
            }
          ]
        },
        {
          name: "identifiers-section",
          visible: true,
          items: [
            { defaultValue: undefined, name: "collection", visible: true },
            {
              defaultValue: undefined,
              name: "materialSampleName",
              visible: true
            },
            {
              defaultValue: undefined,
              name: "useNextSequence",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "dwcOtherCatalogNumbers",
              visible: false
            },
            { defaultValue: undefined, name: "barcode", visible: false }
          ]
        }
      ]
    },
    {
      name: MATERIAL_SAMPLE_INFO_COMPONENT_NAME,
      visible: true,
      order: 2,
      sections: [
        {
          name: "material-sample-info-section",
          visible: true,
          items: [
            {
              defaultValue: undefined,
              name: "materialSampleType",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "materialSampleRemarks",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "materialSampleState",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "stateChangeRemarks",
              visible: false
            },
            { defaultValue: undefined, name: "stateChangedOn", visible: false }
          ]
        }
      ]
    },
    {
      name: COLLECTING_EVENT_COMPONENT_NAME,
      visible: false,
      order: 3,
      sections: [
        {
          name: "general-section",
          visible: true,
          items: [
            { defaultValue: undefined, name: "tags", visible: false },
            {
              defaultValue: undefined,
              name: "publiclyReleasable",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "notPubliclyReleasableReason",
              visible: false
            }
          ]
        },
        {
          name: "identifiers-section",
          visible: true,
          items: [
            { defaultValue: undefined, name: "dwcFieldNumber", visible: false }
          ]
        },
        {
          name: "collecting-date-section",
          visible: true,
          items: [
            {
              defaultValue: undefined,
              name: "verbatimEventDateTime",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "startEventDateTime",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "endEventDateTime",
              visible: false
            }
          ]
        },
        {
          name: "collecting-agents-section",
          visible: true,
          items: [
            { defaultValue: undefined, name: "dwcRecordedBy", visible: false },
            { defaultValue: undefined, name: "collectors", visible: false },
            {
              defaultValue: undefined,
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
              defaultValue: undefined,
              name: "dwcVerbatimLocality",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "dwcVerbatimCoordinateSystem",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "dwcVerbatimCoordinates",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "dwcVerbatimLatitude",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "dwcVerbatimLongitude",
              visible: false
            },
            { defaultValue: undefined, name: "dwcVerbatimSRS", visible: false },
            {
              defaultValue: undefined,
              name: "dwcVerbatimElevation",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "dwcVerbatimDepth",
              visible: false
            }
          ]
        },
        {
          name: "collecting-event-details",
          visible: true,
          items: [
            { defaultValue: undefined, name: "habitat", visible: false },
            { defaultValue: undefined, name: "host", visible: false },
            {
              defaultValue: undefined,
              name: "collectionMethod",
              visible: false
            },
            { defaultValue: undefined, name: "substrate", visible: false },
            {
              defaultValue: undefined,
              name: "dwcMinimumElevationInMeters",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "dwcMaximumElevationInMeters",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "dwcMinimumDepthInMeters",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "dwcMaximumDepthInMeters",
              visible: false
            },
            { defaultValue: undefined, name: "remarks", visible: false }
          ]
        },
        {
          name: "georeferencing-section",
          visible: true,
          items: [
            {
              defaultValue: undefined,
              name: "geoReferenceAssertions[0].dwcGeoreferenceVerificationStatus",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "geoReferenceAssertions[0].dwcDecimalLatitude",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "geoReferenceAssertions[0].dwcDecimalLongitude",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "geoReferenceAssertions[0].dwcCoordinateUncertaintyInMeters",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "geoReferenceAssertions[0].dwcGeoreferencedDate",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "geoReferenceAssertions[0].dwcGeodeticDatum",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "geoReferenceAssertions[0].literalGeoreferencedBy",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "geoReferenceAssertions[0].georeferencedBy",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "geoReferenceAssertions[0].dwcGeoreferenceProtocol",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "geoReferenceAssertions[0].dwcGeoreferenceSources",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "geoReferenceAssertions[0].dwcGeoreferenceRemarks",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "geoReferenceAssertions",
              visible: false
            }
          ]
        },
        {
          name: "current-geographic-place",
          visible: true,
          items: [
            { defaultValue: undefined, name: "srcAdminLevels", visible: false },
            {
              defaultValue: undefined,
              name: "geographicPlaceNameSourceDetail.stateProvince",
              visible: false
            },
            {
              defaultValue: undefined,
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
              defaultValue: undefined,
              name: "managedAttributes.attachmentsConfig.allowNew",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "managedAttributes.attachmentsConfig.allowExisting",
              visible: false
            }
          ]
        }
      ]
    },
    {
      name: PREPARATIONS_COMPONENT_NAME,
      visible: false,
      order: 4,
      sections: [
        {
          name: "general-section",
          visible: true,
          items: [
            {
              defaultValue: undefined,
              name: "preparationType",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "preparationMethod",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "preservationType",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "preparationFixative",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "preparationMaterials",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "preparationSubstrate",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "preparationRemarks",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "dwcDegreeOfEstablishment",
              visible: false
            },
            { defaultValue: undefined, name: "preparedBy", visible: false },
            {
              defaultValue: undefined,
              name: "preparationDate",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "preparationProtocol",
              visible: false
            }
          ]
        }
      ]
    },
    {
      name: ORGANISMS_COMPONENT_NAME,
      visible: false,
      order: 5,
      sections: [
        {
          name: "organisms-general-section",
          visible: true,
          items: [
            {
              defaultValue: undefined,
              name: "organism[0].lifeStage",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "organism[0].sex",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "organism[0].remarks",
              visible: false
            },
            { defaultValue: undefined, name: "organism", visible: false }
          ]
        },
        {
          name: "organism-verbatim-determination-section",
          visible: true,
          items: [
            {
              defaultValue: undefined,
              name: "organism[0].determination[0].verbatimScientificName",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "organism[0].determination[0].verbatimDeterminer",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "organism[0].determination[0].verbatimDate",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "organism[0].determination[0].verbatimRemarks",
              visible: false
            },
            {
              defaultValue: undefined,
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
              defaultValue: undefined,
              name: "organism[0].determination[0].scientificName",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "organism[0].determination[0].scientificNameInput",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "organism[0].determination[0].determiner",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "organism[0].determination[0].determinedOn",
              visible: false
            },
            {
              defaultValue: undefined,
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
              defaultValue: undefined,
              name: "organism[0].determination[0].typeStatus",
              visible: false
            },
            {
              defaultValue: undefined,
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
      name: ASSOCIATIONS_COMPONENT_NAME,
      visible: false,
      order: 6,
      sections: [
        {
          name: "associations-host-organism-section",
          visible: true,
          items: [
            {
              defaultValue: undefined,
              name: "hostOrganism.name",
              visible: false
            },
            {
              defaultValue: undefined,
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
              defaultValue: undefined,
              name: "associations.associationType",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "associations.associatedSample",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "associations.remarks",
              visible: false
            }
          ]
        }
      ]
    },
    {
      name: STORAGE_COMPONENT_NAME,
      visible: false,
      order: 7,
      sections: [
        {
          name: "storage-selection-section",
          visible: true,
          items: [
            { defaultValue: undefined, name: "storageUnit", visible: false }
          ]
        }
      ]
    },
    {
      name: RESTRICTION_COMPONENT_NAME,
      visible: false,
      order: 8,
      sections: [
        {
          name: "restriction-general-section",
          visible: true,
          items: [
            { defaultValue: undefined, name: "phac_animal_rg", visible: false },
            { defaultValue: undefined, name: "cfia_ppc", visible: false },
            { defaultValue: undefined, name: "phac_human_rg", visible: false },
            { defaultValue: undefined, name: "phac_cl", visible: false },
            { defaultValue: undefined, name: "isRestricted", visible: false },
            {
              defaultValue: undefined,
              name: "restrictionRemarks",
              visible: false
            }
          ]
        }
      ]
    },
    {
      name: SCHEDULED_ACTIONS_COMPONENT_NAME,
      visible: false,
      order: 9,
      sections: [
        {
          name: "scheduled-actions-add-section",
          visible: true,
          items: [
            {
              defaultValue: undefined,
              name: "scheduledAction.actionType",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "scheduledAction.actionStatus",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "scheduledAction.date",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "scheduledAction.assignedTo",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "scheduledAction.remarks",
              visible: false
            }
          ]
        }
      ]
    },
    {
      name: FIELD_EXTENSIONS_COMPONENT_NAME,
      visible: undefined,
      order: 10,
      sections: [
        {
          items: [
            {
              defaultValue: undefined,
              name: "extensionValues",
              visible: false
            }
          ],
          name: "field-extension-section",
          visible: true
        }
      ]
    },
    {
      name: MANAGED_ATTRIBUTES_COMPONENT_NAME,
      visible: true,
      order: 11,
      sections: [
        {
          name: "managed-attributes-section",
          visible: true,
          items: []
        }
      ]
    },
    {
      name: MATERIAL_SAMPLE_ATTACHMENTS_COMPONENT_NAME,
      visible: true,
      order: 12,
      sections: [
        {
          name: "material-sample-attachments-sections",
          visible: true,
          items: [
            {
              defaultValue: undefined,
              name: "attachmentsConfig.allowNew",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "attachmentsConfig.allowExisting",
              visible: false
            }
          ]
        }
      ]
    }
  ]
};

// Set expected values values
const expected = {
  id: "123",
  type: "form-template",
  name: "form1",
  group: "aafc",
  restrictToCreatedBy: true,
  viewConfiguration: { type: "material-sample-form-template" },
  components: [
    {
      name: "show-parent-attributes-component",
      order: 0,
      sections: [
        {
          items: [
            {
              defaultValue: [],
              name: "parentAttributes",
              visible: true
            }
          ],
          name: "parent-attributes-section",
          visible: true
        }
      ],
      visible: false
    },
    {
      name: "identifiers-component",
      visible: true,
      order: 1,
      sections: [
        {
          name: "general-section",
          visible: true,
          items: [
            {
              defaultValue: "aafc",
              name: "group",
              visible: true
            },
            {
              defaultValue: undefined,
              name: "tags",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "projects",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "assemblages",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "publiclyReleasable",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "notPubliclyReleasableReason",
              visible: false
            }
          ]
        },
        {
          name: "identifiers-section",
          visible: true,
          items: [
            { defaultValue: undefined, name: "collection", visible: true },
            {
              defaultValue: undefined,
              name: "materialSampleName",
              visible: true
            },
            {
              defaultValue: undefined,
              name: "useNextSequence",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "dwcOtherCatalogNumbers",
              visible: false
            },
            { defaultValue: undefined, name: "barcode", visible: false },
            {
              defaultValue: undefined,
              name: "identifiers",
              visible: false
            }
          ]
        }
      ]
    },
    {
      name: "material-sample-info-component",
      visible: true,
      order: 2,
      sections: [
        {
          name: "material-sample-info-section",
          visible: true,
          items: [
            {
              defaultValue: undefined,
              name: "materialSampleType",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "materialSampleRemarks",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "materialSampleState",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "stateChangeRemarks",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "stateChangedOn",
              visible: false
            }
          ]
        }
      ]
    },
    {
      name: "collecting-event-component",
      visible: true,
      order: 3,
      sections: [
        {
          name: "general-section",
          visible: true,
          items: [
            { defaultValue: undefined, name: "tags", visible: false },
            {
              defaultValue: undefined,
              name: "publiclyReleasable",
              visible: false
            },
            {
              defaultValue: undefined,
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
              defaultValue: undefined,
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
              defaultValue: "test-verbatim-default-datetime",
              name: "verbatimEventDateTime",
              visible: true
            },
            {
              defaultValue: undefined,
              name: "startEventDateTime",
              visible: true
            },
            {
              defaultValue: undefined,
              name: "endEventDateTime",
              visible: true
            }
          ]
        },
        {
          name: "collecting-agents-section",
          visible: true,
          items: [
            {
              defaultValue: undefined,
              name: "dwcRecordedBy",
              visible: false
            },
            { defaultValue: undefined, name: "collectors", visible: false },
            {
              defaultValue: undefined,
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
              defaultValue: undefined,
              name: "dwcVerbatimLocality",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "dwcVerbatimCoordinateSystem",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "dwcVerbatimCoordinates",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "dwcVerbatimLatitude",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "dwcVerbatimLongitude",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "dwcVerbatimSRS",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "dwcVerbatimElevation",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "dwcVerbatimDepth",
              visible: false
            }
          ]
        },
        {
          name: "collecting-event-details",
          visible: true,
          items: [
            { defaultValue: undefined, name: "habitat", visible: false },
            { defaultValue: undefined, name: "host", visible: false },
            {
              defaultValue: undefined,
              name: "collectionMethod",
              visible: false
            },
            { defaultValue: undefined, name: "substrate", visible: false },
            {
              defaultValue: undefined,
              name: "dwcMinimumElevationInMeters",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "dwcMaximumElevationInMeters",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "dwcMinimumDepthInMeters",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "dwcMaximumDepthInMeters",
              visible: false
            },
            { defaultValue: undefined, name: "remarks", visible: false }
          ]
        },
        {
          name: "georeferencing-section",
          visible: true,
          items: [
            {
              defaultValue: undefined,
              name: "geoReferenceAssertions[0].dwcGeoreferenceVerificationStatus",
              visible: false
            },
            {
              defaultValue: "1",
              name: "geoReferenceAssertions[0].dwcDecimalLatitude",
              visible: true
            },
            {
              defaultValue: "2",
              name: "geoReferenceAssertions[0].dwcDecimalLongitude",
              visible: true
            },
            {
              defaultValue: undefined,
              name: "geoReferenceAssertions[0].dwcCoordinateUncertaintyInMeters",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "geoReferenceAssertions[0].dwcGeoreferencedDate",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "geoReferenceAssertions[0].dwcGeodeticDatum",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "geoReferenceAssertions[0].literalGeoreferencedBy",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "geoReferenceAssertions[0].georeferencedBy",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "geoReferenceAssertions[0].dwcGeoreferenceProtocol",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "geoReferenceAssertions[0].dwcGeoreferenceSources",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "geoReferenceAssertions[0].dwcGeoreferenceRemarks",
              visible: false
            },
            {
              defaultValue: [
                {
                  dwcDecimalLatitude: "1",
                  dwcDecimalLongitude: "2"
                }
              ],
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
              defaultValue: undefined,
              name: "srcAdminLevels",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "geographicPlaceNameSourceDetail.stateProvince",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "geographicPlaceNameSourceDetail.country",
              visible: false
            }
          ]
        },
        {
          name: "collecting-event-field-extension-section",
          visible: true,
          items: [
            {
              defaultValue: undefined,
              name: "extensionValues",
              visible: false
            }
          ]
        },
        {
          name: "collecting-event-managed-attributes-section",
          visible: true,
          items: [
            {
              name: "managedAttributes",
              visible: true,
              defaultValue: undefined
            },
            {
              name: "managedAttributesOrder",
              visible: true,
              defaultValue: undefined
            }
          ]
        },
        {
          name: "collecting-event-attachments-section",
          visible: true,
          items: [
            {
              defaultValue: undefined,
              name: "managedAttributes.attachmentsConfig.allowNew",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "managedAttributes.attachmentsConfig.allowExisting",
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
              defaultValue: undefined,
              name: "preparationType",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "preparationMethod",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "preservationType",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "preparationFixative",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "preparationMaterials",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "preparationSubstrate",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "preparationRemarks",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "dwcDegreeOfEstablishment",
              visible: false
            },
            { defaultValue: undefined, name: "preparedBy", visible: false },
            {
              defaultValue: undefined,
              name: "preparationDate",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "preparationProtocol",
              visible: false
            }
          ]
        },
        {
          name: "preparations-managed-attributes-section",
          visible: true,
          items: [
            {
              defaultValue: undefined,
              name: "preparationManagedAttributes",
              visible: true
            },
            {
              defaultValue: undefined,
              name: "preparationManagedAttributesOrder",
              visible: true
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
              defaultValue: undefined,
              name: "organism[0].lifeStage",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "organism[0].sex",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "organism[0].remarks",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "organism[0].dwcVernacularName",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "organism[0].managedAttributes",
              visible: false
            }
          ]
        },
        {
          name: "organism-verbatim-determination-section",
          visible: true,
          items: [
            {
              defaultValue: undefined,
              name: "organism[0].determination[0].verbatimScientificName",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "organism[0].determination[0].verbatimDeterminer",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "organism[0].determination[0].verbatimDate",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "organism[0].determination[0].verbatimRemarks",
              visible: false
            },
            {
              defaultValue: undefined,
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
              defaultValue: undefined,
              name: "organism[0].determination[0].scientificName",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "organism[0].determination[0].scientificNameInput",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "organism[0].determination[0].determiner",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "organism[0].determination[0].determinedOn",
              visible: false
            },
            {
              defaultValue: undefined,
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
              defaultValue: undefined,
              name: "organism[0].determination[0].typeStatus",
              visible: false
            },
            {
              defaultValue: undefined,
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
              defaultValue: undefined,
              name: "hostOrganism.name",
              visible: false
            },
            {
              defaultValue: undefined,
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
              defaultValue: undefined,
              name: "associations.associationType",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "associations.associatedSample",
              visible: false
            },
            {
              defaultValue: undefined,
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
              defaultValue: undefined,
              name: "storageUnit",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "storageUnitUsage.wellRow",
              visible: true
            },
            {
              defaultValue: undefined,
              name: "storageUnitUsage.wellColumn",
              visible: true
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
              defaultValue: undefined,
              name: "phac_animal_rg",
              visible: false
            },
            { defaultValue: undefined, name: "cfia_ppc", visible: false },
            {
              defaultValue: undefined,
              name: "phac_human_rg",
              visible: false
            },
            { defaultValue: undefined, name: "phac_cl", visible: false },
            {
              defaultValue: undefined,
              name: "isRestricted",
              visible: false
            },
            {
              defaultValue: undefined,
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
              defaultValue: undefined,
              name: "scheduledAction.actionType",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "scheduledAction.actionStatus",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "scheduledAction.date",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "scheduledAction.assignedTo",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "scheduledAction.remarks",
              visible: false
            }
          ]
        }
      ]
    },
    {
      name: "field-extensions-component",
      visible: true,
      order: 10,
      sections: [
        {
          items: [
            {
              defaultValue: undefined,
              name: "extensionValues",
              visible: false
            }
          ],
          name: "field-extension-section",
          visible: true
        }
      ]
    },
    {
      name: "managed-attributes-component",
      visible: true,
      order: 11,
      sections: [
        {
          name: "managed-attributes-section",
          visible: true,
          items: [
            {
              defaultValue: undefined,
              name: "managedAttributes",
              visible: true
            },
            {
              defaultValue: undefined,
              name: "managedAttributesOrder",
              visible: true
            }
          ]
        }
      ]
    },
    {
      name: "material-sample-attachments-component",
      visible: true,
      order: 12,
      sections: [
        {
          name: "material-sample-attachments-sections",
          visible: true,
          items: [
            {
              defaultValue: undefined,
              name: "attachmentsConfig.allowNew",
              visible: false
            },
            {
              defaultValue: undefined,
              name: "attachmentsConfig.allowExisting",
              visible: false
            }
          ]
        }
      ]
    }
  ]
};

describe("Form template edit page", () => {
  beforeEach(jest.clearAllMocks);

  it("Renders the blank template edit page", async () => {
    const { wrapper } = await mountForm();

    // Get the switches:
    const switches = wrapper.container.querySelectorAll(
      ".material-sample-nav input[type='checkbox']"
    );
    expect(switches.length).not.toEqual(0);

    // All switches should be unchecked:
    expect(
      Array.from(switches).map((node) => (node as HTMLInputElement).checked)
    ).toEqual(Array.from(switches).map(() => false));
  });

  it("Renders the template page with a custom Nav Order.", async () => {
    const { submitForm } = await mountForm(formTemplate);

    await submitForm();

    // The nav order was re-saved:
    const navOrder = getComponentOrderFromTemplate(
      mockOnSaved.mock.calls[0][0]
    );
    expect(navOrder).toEqual([
      "show-parent-attributes-component",
      "identifiers-component",
      "material-sample-info-component",
      "collecting-event-component",
      "preparations-component",
      "organisms-component",
      "associations-component",
      "storage-component",
      "restriction-component",
      "scheduled-actions-component",
      "field-extensions-component",
      "managed-attributes-component",
      "material-sample-attachments-component"
    ]);
  });

  it("Submits a new action-definition: Only set collecting event template fields.", async () => {
    const { toggleColEvent, fillOutRequiredFields, submitForm, wrapper } =
      await mountForm();

    await fillOutRequiredFields();

    // Enable the component toggles:
    await toggleColEvent(true);

    // Include all collecting date fields:
    const includeAllCollectingDateInput = wrapper.container.querySelector(
      "#collectingDateLegend > label > input"
    );
    fireEvent.click(includeAllCollectingDateInput!);

    const verbatimEventDateTimeInput = wrapper.container.querySelector(
      ".verbatimEventDateTime-field input"
    )!;
    fireEvent.change(verbatimEventDateTimeInput, {
      target: { value: "test-verbatim-default-datetime" }
    });

    // Set default geo assertion lat/lng:
    const latCheckbox = wrapper.container.querySelector(
      ".dwcDecimalLatitude input[type='checkbox']"
    )!;
    fireEvent.click(latCheckbox);

    const lngCheckbox = wrapper.container.querySelector(
      ".dwcDecimalLongitude input[type='checkbox']"
    )!;
    fireEvent.click(lngCheckbox);

    const latInput = wrapper.container.querySelector(
      ".dwcDecimalLatitude input[type='text']"
    )!;
    fireEvent.change(latInput, { target: { value: "1" } });

    const lngInput = wrapper.container.querySelector(
      ".dwcDecimalLongitude input[type='text']"
    )!;
    fireEvent.change(lngInput, { target: { value: "2" } });

    await new Promise(setImmediate);

    await submitForm();

    expect(mockOnSaved).toHaveBeenCalledWith(expected);
  });

  it("Edits an existing action-definition: Renders the form with minimal data.", async () => {
    const { colEventSwitch, catalogSwitch, scheduledActionsSwitch } =
      await mountForm(formTemplate);

    // Checkboxes are unchecked:
    expect(colEventSwitch).not.toBeChecked();
    expect(catalogSwitch).not.toBeChecked();
    expect(scheduledActionsSwitch).not.toBeChecked();
  });
});
