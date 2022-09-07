export interface MaterialSampleFormComponentInformation {
  /** ID/Name of the section. Also used as the scroll target for each section. */
  id: string;

  /**
   * Sometimes a section can store multiple items but the visibility will apply to all the items.
   *
   * Example: organisms
   */
  arrayName?: string;

  /** Translated label key of the section. */
  labelKey: string;

  /** ClassName for the switch. */
  switchClassName?: string;

  maxGridSizeX: number;

  sections: MaterialSampleFormSectionInformation[];
}

export interface MaterialSampleFormSectionInformation {
  id: string;

  labelKey?: string;

  maxGridSizeX: number;

  /**
   * Sometimes a section can store multiple items but the visibility will apply to all the items.
   *
   * Example: determinations
   */
  arrayName?: string;

  fields: MaterialSampleFormFieldInformation[];
}

export interface MaterialSampleFormFieldInformation {
  id: string;
}

/**
 * All Material Sample form data component in order.
 * This array is the source of truth for the section ID names and their order.
 */
export const MATERIAL_SAMPLE_FORM_LEGEND: MaterialSampleFormComponentInformation[] =
  [
    {
      id: "identifiers-component",
      labelKey: "identifiers",
      maxGridSizeX: 2,
      sections: [
        {
          id: "general-section",
          maxGridSizeX: 2,
          fields: [
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
          fields: [
            {
              id: "collection"
            },
            {
              id: "materialSampleName"
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
      id: "material-sample-info-component",
      labelKey: "materialSampleInfo",
      maxGridSizeX: 2,
      sections: [
        {
          id: "material-sample-info-section",
          labelKey: "materialSampleInfo",
          maxGridSizeX: 2,
          fields: [
            {
              id: "materialSampleType"
            },
            {
              id: "materialSampleRemarks"
            },
            {
              id: "materialSampleState"
            }
          ]
        }
      ]
    },
    {
      id: "collecting-event-component",
      labelKey: "collectingEvent",
      maxGridSizeX: 2,
      switchClassName: "enable-collecting-event",
      sections: [
        {
          id: "general-section",
          maxGridSizeX: 2,
          fields: [
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
          fields: [
            {
              id: "dwcFieldNumber"
            }
          ]
        },
        {
          id: "collecting-date-section",
          maxGridSizeX: 1,
          fields: [
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
          fields: [
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
          fields: [
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
          fields: [
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
          arrayName: "geoReferenceAssertions",
          fields: [
            {
              id: "dwcGeoreferenceVerificationStatus"
            },
            {
              id: "dwcDecimalLatitude"
            },
            {
              id: "dwcDecimalLongitude"
            },
            {
              id: "dwcCoordinateUncertaintyInMeters"
            },
            {
              id: "dwcGeoreferencedDate"
            },
            {
              id: "dwcGeodeticDatum"
            },
            {
              id: "literalGeoreferencedBy"
            },
            {
              id: "georeferencedBy"
            },
            {
              id: "dwcGeoreferenceProtocol"
            },
            {
              id: "dwcGeoreferenceSources"
            },
            {
              id: "dwcGeoreferenceRemarks"
            }
          ]
        },
        {
          id: "current-geographic-place",
          maxGridSizeX: 1,
          fields: [
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
          id: "collecting-event-managed-attributes-section",
          maxGridSizeX: 2,
          arrayName: "managedAttributes",
          fields: []
        },
        {
          id: "collecting-event-attachments-section",
          maxGridSizeX: 1,
          fields: [
            {
              id: "attachmentsConfig.allowNew"
            },
            {
              id: "attachmentsConfig.allowExisting"
            }
          ]
        }
      ]
    },
    {
      id: "acquisition-event-component",
      labelKey: "acquisitionEvent",
      maxGridSizeX: 2,
      switchClassName: "enable-acquisition-event",
      sections: [
        {
          id: "acquisition-event-reception-section",
          labelKey: "reception",
          maxGridSizeX: 2,
          fields: [
            {
              id: "group"
            },
            {
              id: "receivedFrom"
            },
            {
              id: "receivedDate"
            },
            {
              id: "receptionRemarks"
            }
          ]
        },
        {
          id: "acquisition-event-isolation-section",
          labelKey: "isolation",
          maxGridSizeX: 2,
          fields: [
            {
              id: "isolatedBy"
            },
            {
              id: "isolatedOn"
            },
            {
              id: "isolationRemarks"
            }
          ]
        }
      ]
    },
    {
      id: "preparations-component",
      labelKey: "preparations",
      maxGridSizeX: 2,
      switchClassName: "enable-catalogue-info",
      sections: [
        {
          id: "general-section",
          maxGridSizeX: 2,
          labelKey: "preparations",
          fields: [
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
      id: "organisms-component",
      arrayName: "organism",
      labelKey: "organisms",
      maxGridSizeX: 2,
      switchClassName: "enable-organisms",
      sections: [
        {
          id: "organisms-general-section",
          labelKey: "organisms",
          maxGridSizeX: 2,
          fields: [
            {
              id: "lifeStage"
            },
            {
              id: "sex"
            },
            {
              id: "remarks"
            }
          ]
        },
        {
          id: "organism-verbatim-determination-section",
          arrayName: "determination",
          labelKey: "verbatimDeterminationLegend",
          maxGridSizeX: 1,
          fields: [
            {
              id: "verbatimScientificName"
            },
            {
              id: "verbatimDeterminer"
            },
            {
              id: "verbatimDate"
            },
            {
              id: "verbatimRemarks"
            },
            {
              id: "transcriberRemarks"
            }
          ]
        },
        {
          id: "organism-determination-section",
          arrayName: "determination",
          labelKey: "determination",
          maxGridSizeX: 1,
          fields: [
            {
              id: "scientificName"
            },
            {
              id: "scientificNameInput"
            },
            {
              id: "determiner"
            },
            {
              id: "determinedOn"
            },
            {
              id: "determinationRemarks"
            }
          ]
        },
        {
          id: "organism-type-specimen-section",
          arrayName: "determination",
          labelKey: "typeSpecimen",
          maxGridSizeX: 1,
          fields: [
            {
              id: "typeStatus"
            },
            {
              id: "typeStatusEvidence"
            }
          ]
        },
        {
          id: "organism-managed-attributes-section",
          arrayName: "determination",
          labelKey: "typeSpecimen",
          maxGridSizeX: 2,
          fields: []
        }
      ]
    },
    {
      id: "associations-component",
      labelKey: "associationsLegend",
      maxGridSizeX: 2,
      switchClassName: "enable-associations",
      sections: [
        {
          id: "associations-host-organism-section",
          labelKey: "hostOrganismLegend",
          maxGridSizeX: 2,
          fields: [
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
          arrayName: "associations",
          fields: [
            {
              id: "associationType"
            },
            {
              id: "associatedSample"
            },
            {
              id: "remarks"
            }
          ]
        }
      ]
    },
    {
      id: "storage-component",
      labelKey: "storage",
      maxGridSizeX: 2,
      switchClassName: "enable-storage",
      sections: [
        {
          id: "storage-selection-section",
          labelKey: "storage",
          maxGridSizeX: 1,
          fields: [
            {
              id: "storageUnit"
            }
          ]
        }
      ]
    },
    {
      id: "restriction-component",
      labelKey: "restrictions",
      maxGridSizeX: 2,
      switchClassName: "enable-restrictions",
      sections: [
        {
          id: "restriction-general-section",
          labelKey: "restrictions",
          maxGridSizeX: 2,
          fields: [
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
      id: "scheduled-actions-component",
      labelKey: "scheduledActions",
      maxGridSizeX: 2,
      switchClassName: "enable-scheduled-actions",
      sections: [
        {
          id: "scheduled-actions-add-section",
          labelKey: "",
          maxGridSizeX: 2,
          fields: [
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
      id: "managed-attributes-component",
      labelKey: "managedAttributes",
      maxGridSizeX: 2,
      sections: [
        {
          id: "managed-attributes-section",
          labelKey: "managedAttributes",
          maxGridSizeX: 2,
          fields: []
        }
      ]
    },
    {
      id: "material-sample-attachments-component",
      labelKey: "materialSampleAttachments",
      maxGridSizeX: 2,
      sections: [
        {
          id: "material-sample-attachments-sections",
          labelKey: "materialSampleAttachments",
          maxGridSizeX: 1,
          fields: [
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
