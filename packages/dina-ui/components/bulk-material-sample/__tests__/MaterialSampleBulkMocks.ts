import { InputResource, PersistedResource } from "kitsu";
import {
  FormTemplate,
  MaterialSample,
  StorageUnit
} from "packages/dina-ui/types/collection-api";

export const TEST_COLLECTING_EVENT = {
  id: "col-event-1",
  type: "collecting-event",
  dwcVerbatimLocality: "test initial locality"
};

export const TEST_COLLECTION_1 = {
  id: "1",
  type: "collection",
  name: "test-collection",
  code: "TC"
};

export const TEST_STORAGE_UNIT: PersistedResource<StorageUnit> = {
  id: "su-1",
  isGeneric: false,
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

export const TEST_STORAGE_UNITS = ["A", "B", "C"].map<
  PersistedResource<StorageUnit>
>((id) => ({
  id,
  type: "storage-unit",
  isGeneric: false,
  group: "test-group",
  name: `storage unit ${id}`,
  storageUnitType: {
    id: "storage-type-1",
    type: "storage-unit-type",
    name: "Box",
    group: "test-group"
  }
}));

// Samples without IDs:
export const TEST_NEW_SAMPLES: InputResource<MaterialSample>[] = [
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
export const TEST_SAMPLES_DIFFERENT_ARRAY_VALUES: InputResource<MaterialSample>[] =
  [
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
export const TEST_SAMPLES_DIFFERENT_FLAT_FIELDS_VALUES: InputResource<MaterialSample>[] =
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

export const TEST_SAMPLES_SAME_FLAT_FIELDS_VALUES: InputResource<MaterialSample>[] =
  ["1", "2"].map((id) => ({
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

export const TEST_SAMPLES_DIFFERENT_MANAGED_ATTRIBUTES: InputResource<MaterialSample>[] =
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

export const TEST_SAMPLES_SAME_COLLECTING_EVENT: InputResource<MaterialSample>[] =
  [
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

export const TEST_SAMPLES_SAME_STORAGE_UNIT: InputResource<MaterialSample>[] = [
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

export const TEST_SAMPLES_SAME_HOST_ORGANISM: InputResource<MaterialSample>[] =
  [
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

export const TEST_FORM_TEMPLATE: PersistedResource<FormTemplate> = {
  id: "cd6d8297-43a0-45c6-b44e-983db917eb11",
  type: "form-template",
  name: "test view with managed attributes",
  group: "cnc",
  restrictToCreatedBy: false,
  viewConfiguration: { type: "material-sample-form-template" },
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
            { defaultValue: undefined, name: "collection", visible: false },
            {
              defaultValue: "material sample 1",
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
            { defaultValue: "1111", name: "barcode", visible: true }
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
      name: "collecting-event-component",
      visible: true,
      order: 2,
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
            { defaultValue: "123", name: "dwcFieldNumber", visible: true }
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
            { defaultValue: undefined, name: "storageUnit", visible: false }
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

function blankMaterialSample(): InputResource<MaterialSample> {
  throw new Error("Function not implemented.");
}
