import { FormLegendComponentInformation } from "packages/dina-ui/types/common/resources/FormLegendInformation";

// Data Components for Material Samples.
export const SPLIT_CONFIGURATION_COMPONENT_NAME: string =
  "split-configuration-component";
export const IDENTIFIER_COMPONENT_NAME: string = "identifiers-component";
export const MATERIAL_SAMPLE_INFO_COMPONENT_NAME: string =
  "material-sample-info-component";
export const COLLECTING_EVENT_COMPONENT_NAME: string =
  "collecting-event-component";
export const PREPARATIONS_COMPONENT_NAME: string = "preparations-component";
export const ORGANISMS_COMPONENT_NAME: string = "organisms-component";
export const ASSOCIATIONS_COMPONENT_NAME: string = "associations-component";
export const STORAGE_COMPONENT_NAME: string = "storage-component";
export const RESTRICTION_COMPONENT_NAME: string = "restriction-component";
export const SCHEDULED_ACTIONS_COMPONENT_NAME: string =
  "scheduled-actions-component";
export const MANAGED_ATTRIBUTES_COMPONENT_NAME: string =
  "managed-attributes-component";
export const MATERIAL_SAMPLE_ATTACHMENTS_COMPONENT_NAME: string =
  "material-sample-attachments-component";
export const FIELD_EXTENSIONS_COMPONENT_NAME: string =
  "field-extensions-component";

/**
 * All Material Sample form data component in order.
 * This array is the source of truth for the section ID names and their order.
 */
export const MATERIAL_SAMPLE_FORM_LEGEND: FormLegendComponentInformation[] = [
  {
    id: SPLIT_CONFIGURATION_COMPONENT_NAME,
    labelKey: "materialSampleSplitConfiguration",
    maxGridSizeX: 2,
    formTemplateOnly: true,
    sections: [
      {
        id: "split-configuration-condition-section",
        labelKey: "materialSampleSplitConfigurationCondition",
        maxGridSizeX: 2,
        items: [
          {
            id: "splitConfiguration.condition.conditionType"
          },
          {
            id: "splitConfiguration.condition.materialSampleType"
          }
        ]
      },
      {
        id: "split-configuration-material-sample-name-generation-section",
        labelKey:
          "materialSampleSplitConfigurationMaterialSampleNameGeneration",
        maxGridSizeX: 2,
        items: [
          {
            id: "splitConfiguration.materialSampleNameGeneration.strategy"
          },
          {
            id: "splitConfiguration.materialSampleNameGeneration.characterType"
          }
        ]
      }
    ]
  },
  {
    id: IDENTIFIER_COMPONENT_NAME,
    labelKey: "identifiers",
    maxGridSizeX: 2,
    sections: [
      {
        id: "general-section",
        maxGridSizeX: 2,
        items: [
          { id: "group", visible: true },
          {
            id: "tags"
          },
          {
            id: "projects"
          },
          {
            id: "assemblages"
          },
          {
            id: "publiclyReleasable"
          },
          {
            id: "notPubliclyReleasableReason"
          }
        ]
      },
      {
        id: "identifiers-section",
        labelKey: "identifiers",
        maxGridSizeX: 2,
        items: [
          {
            id: "collection",
            visible: true
          },
          {
            id: "materialSampleName",
            visible: true
          },
          {
            id: "useNextSequence"
          },
          {
            id: "dwcOtherCatalogNumbers"
          },
          {
            id: "barcode"
          }
        ]
      }
    ]
  },
  {
    id: MATERIAL_SAMPLE_INFO_COMPONENT_NAME,
    labelKey: "materialSampleInfo",
    maxGridSizeX: 2,
    sections: [
      {
        id: "material-sample-info-section",
        labelKey: "materialSampleInfo",
        maxGridSizeX: 2,
        items: [
          {
            id: "materialSampleType"
          },
          {
            id: "materialSampleRemarks"
          },
          {
            id: "materialSampleState"
          },
          {
            id: "stateChangeRemarks"
          },
          {
            id: "stateChangedOn"
          }
        ]
      }
    ]
  },
  {
    id: COLLECTING_EVENT_COMPONENT_NAME,
    labelKey: "collectingEvent",
    maxGridSizeX: 2,
    switchClassName: "enable-collecting-event",
    sections: [
      {
        id: "general-section",
        maxGridSizeX: 2,
        items: [
          {
            id: "tags"
          },
          {
            id: "publiclyReleasable"
          },
          {
            id: "notPubliclyReleasableReason"
          }
        ]
      },
      {
        id: "identifiers-section",
        maxGridSizeX: 1,
        items: [
          {
            id: "dwcFieldNumber"
          }
        ]
      },
      {
        id: "collecting-date-section",
        maxGridSizeX: 1,
        items: [
          {
            id: "verbatimEventDateTime"
          },
          {
            id: "startEventDateTime"
          },
          {
            id: "endEventDateTime"
          }
        ]
      },
      {
        id: "collecting-agents-section",
        maxGridSizeX: 1,
        items: [
          {
            id: "dwcRecordedBy"
          },
          {
            id: "collectors"
          },
          {
            id: "dwcRecordNumber"
          }
        ]
      },
      {
        id: "verbatim-label-section",
        maxGridSizeX: 1,
        items: [
          {
            id: "dwcVerbatimLocality"
          },
          {
            id: "dwcVerbatimCoordinateSystem"
          },
          {
            id: "dwcVerbatimCoordinates"
          },
          {
            id: "dwcVerbatimLatitude"
          },
          {
            id: "dwcVerbatimLongitude"
          },
          {
            id: "dwcVerbatimSRS"
          },
          {
            id: "dwcVerbatimElevation"
          },
          {
            id: "dwcVerbatimDepth"
          }
        ]
      },
      {
        id: "collecting-event-details",
        maxGridSizeX: 1,
        items: [
          {
            id: "habitat"
          },
          {
            id: "host"
          },
          {
            id: "collectionMethod"
          },
          {
            id: "substrate"
          },
          {
            id: "dwcMinimumElevationInMeters"
          },
          {
            id: "dwcMaximumElevationInMeters"
          },
          {
            id: "dwcMinimumDepthInMeters"
          },
          {
            id: "dwcMaximumDepthInMeters"
          },
          {
            id: "remarks"
          }
        ]
      },
      {
        id: "georeferencing-section",
        maxGridSizeX: 1,
        items: [
          {
            id: "geoReferenceAssertions[0].dwcGeoreferenceVerificationStatus"
          },
          {
            id: "geoReferenceAssertions[0].dwcDecimalLatitude"
          },
          {
            id: "geoReferenceAssertions[0].dwcDecimalLongitude"
          },
          {
            id: "geoReferenceAssertions[0].dwcCoordinateUncertaintyInMeters"
          },
          {
            id: "geoReferenceAssertions[0].dwcGeoreferencedDate"
          },
          {
            id: "geoReferenceAssertions[0].dwcGeodeticDatum"
          },
          {
            id: "geoReferenceAssertions[0].literalGeoreferencedBy"
          },
          {
            id: "geoReferenceAssertions[0].georeferencedBy"
          },
          {
            id: "geoReferenceAssertions[0].dwcGeoreferenceProtocol"
          },
          {
            id: "geoReferenceAssertions[0].dwcGeoreferenceSources"
          },
          {
            id: "geoReferenceAssertions[0].dwcGeoreferenceRemarks"
          },
          {
            id: "geoReferenceAssertions"
          }
        ]
      },
      {
        id: "current-geographic-place",
        maxGridSizeX: 1,
        items: [
          {
            id: "srcAdminLevels"
          },
          {
            id: "geographicPlaceNameSourceDetail.stateProvince"
          },
          {
            id: "geographicPlaceNameSourceDetail.country"
          }
        ]
      },
      {
        id: "collecting-event-field-extension-section",
        maxGridSizeX: 1,
        items: [{ id: "extensionValues" }]
      },
      {
        id: "collecting-event-managed-attributes-section",
        maxGridSizeX: 2,
        items: []
      },
      {
        id: "collecting-event-attachments-section",
        maxGridSizeX: 1,
        items: [
          {
            id: "managedAttributes.attachmentsConfig.allowNew"
          },
          {
            id: "managedAttributes.attachmentsConfig.allowExisting"
          }
        ]
      }
    ]
  },
  {
    id: PREPARATIONS_COMPONENT_NAME,
    labelKey: "preparations",
    maxGridSizeX: 2,
    switchClassName: "enable-catalogue-info",
    sections: [
      {
        id: "general-section",
        maxGridSizeX: 2,
        labelKey: "preparations",
        items: [
          {
            id: "preparationType"
          },
          {
            id: "preparationMethod"
          },
          {
            id: "preservationType"
          },
          {
            id: "preparationFixative"
          },
          {
            id: "preparationMaterials"
          },
          {
            id: "preparationSubstrate"
          },
          {
            id: "preparationRemarks"
          },
          {
            id: "dwcDegreeOfEstablishment"
          },
          {
            id: "preparedBy"
          },
          {
            id: "preparationDate"
          },
          {
            id: "preparationProtocol"
          }
        ]
      }
    ]
  },
  {
    id: ORGANISMS_COMPONENT_NAME,
    labelKey: "organisms",
    maxGridSizeX: 2,
    switchClassName: "enable-organisms",
    sections: [
      {
        id: "organisms-general-section",
        labelKey: "organisms",
        maxGridSizeX: 2,
        items: [
          {
            id: "organism[0].lifeStage"
          },
          {
            id: "organism[0].sex"
          },
          {
            id: "organism[0].remarks"
          },
          {
            id: "organism"
          }
        ]
      },
      {
        id: "organism-verbatim-determination-section",
        labelKey: "verbatimDeterminationLegend",
        maxGridSizeX: 1,
        items: [
          {
            id: "organism[0].determination[0].verbatimScientificName"
          },
          {
            id: "organism[0].determination[0].verbatimDeterminer"
          },
          {
            id: "organism[0].determination[0].verbatimDate"
          },
          {
            id: "organism[0].determination[0].verbatimRemarks"
          },
          {
            id: "organism[0].determination[0].transcriberRemarks"
          }
        ]
      },
      {
        id: "organism-determination-section",
        labelKey: "determination",
        maxGridSizeX: 1,
        items: [
          {
            id: "organism[0].determination[0].scientificName"
          },
          {
            id: "organism[0].determination[0].scientificNameInput"
          },
          {
            id: "organism[0].determination[0].determiner"
          },
          {
            id: "organism[0].determination[0].determinedOn"
          },
          {
            id: "organism[0].determination[0].determinationRemarks"
          }
        ]
      },
      {
        id: "organism-type-specimen-section",
        labelKey: "typeSpecimen",
        maxGridSizeX: 1,
        items: [
          {
            id: "organism[0].determination[0].typeStatus"
          },
          {
            id: "organism[0].determination[0].typeStatusEvidence"
          }
        ]
      },
      {
        id: "organism-managed-attributes-section",
        labelKey: "typeSpecimen",
        maxGridSizeX: 2,
        items: []
      }
    ]
  },
  {
    id: ASSOCIATIONS_COMPONENT_NAME,
    labelKey: "associationsLegend",
    maxGridSizeX: 2,
    switchClassName: "enable-associations",
    sections: [
      {
        id: "associations-host-organism-section",
        labelKey: "hostOrganismLegend",
        maxGridSizeX: 2,
        items: [
          {
            id: "hostOrganism.name"
          },
          {
            id: "hostOrganism.remarks"
          }
        ]
      },
      {
        id: "associations-material-sample-section",
        labelKey: "materialSampleAssociationLegend",
        maxGridSizeX: 2,
        items: [
          {
            id: "associations.associationType"
          },
          {
            id: "associations.associatedSample"
          },
          {
            id: "associations.remarks"
          }
        ]
      }
    ]
  },
  {
    id: STORAGE_COMPONENT_NAME,
    labelKey: "storage",
    maxGridSizeX: 2,
    switchClassName: "enable-storage",
    sections: [
      {
        id: "storage-selection-section",
        labelKey: "storage",
        maxGridSizeX: 1,
        items: [
          {
            id: "storageUnit"
          }
        ]
      }
    ]
  },
  {
    id: RESTRICTION_COMPONENT_NAME,
    labelKey: "restrictions",
    maxGridSizeX: 2,
    switchClassName: "enable-restrictions",
    sections: [
      {
        id: "restriction-general-section",
        labelKey: "restrictions",
        maxGridSizeX: 2,
        items: [
          {
            id: "phac_animal_rg"
          },
          {
            id: "cfia_ppc"
          },
          {
            id: "phac_human_rg"
          },
          {
            id: "phac_cl"
          },
          {
            id: "isRestricted"
          },
          {
            id: "restrictionRemarks"
          }
        ]
      }
    ]
  },
  {
    id: SCHEDULED_ACTIONS_COMPONENT_NAME,
    labelKey: "scheduledActions",
    maxGridSizeX: 2,
    switchClassName: "enable-scheduled-actions",
    sections: [
      {
        id: "scheduled-actions-add-section",
        labelKey: "",
        maxGridSizeX: 2,
        items: [
          {
            id: "scheduledAction.actionType"
          },
          {
            id: "scheduledAction.actionStatus"
          },
          {
            id: "scheduledAction.date"
          },
          {
            id: "scheduledAction.assignedTo"
          },
          {
            id: "scheduledAction.remarks"
          }
        ]
      }
    ]
  },
  {
    id: FIELD_EXTENSIONS_COMPONENT_NAME,
    labelKey: "fieldExtensions",
    maxGridSizeX: 1,
    sections: [
      {
        id: "field-extension-section",
        maxGridSizeX: 1,
        items: [{ id: "extensionValues" }]
      }
    ]
  },
  {
    id: MANAGED_ATTRIBUTES_COMPONENT_NAME,
    labelKey: "managedAttributes",
    maxGridSizeX: 2,
    sections: [
      {
        id: "managed-attributes-section",
        labelKey: "managedAttributes",
        maxGridSizeX: 2,
        items: [
          {
            id: "managedAttributes",
            visible: true
          },
          { id: "managedAttributesOrder", visible: true }
        ]
      }
    ]
  },
  {
    id: MATERIAL_SAMPLE_ATTACHMENTS_COMPONENT_NAME,
    labelKey: "materialSampleAttachments",
    maxGridSizeX: 2,
    sections: [
      {
        id: "material-sample-attachments-sections",
        labelKey: "materialSampleAttachments",
        maxGridSizeX: 1,
        items: [
          {
            id: "attachmentsConfig.allowNew"
          },
          {
            id: "attachmentsConfig.allowExisting"
          }
        ]
      }
    ]
  }
];
