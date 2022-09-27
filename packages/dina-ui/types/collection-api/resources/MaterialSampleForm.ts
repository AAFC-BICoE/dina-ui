export interface MaterialSampleFormComponentInformation {
  /** ID/Name of the section. Also used as the scroll target for each section. */
  id: string;

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

  items: MaterialSampleFormFieldInformation[];
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
          items: [
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
          items: [
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
      id: "acquisition-event-component",
      labelKey: "acquisitionEvent",
      maxGridSizeX: 2,
      switchClassName: "enable-acquisition-event",
      sections: [
        {
          id: "acquisition-event-reception-section",
          labelKey: "reception",
          maxGridSizeX: 2,
          items: [
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
          items: [
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
      id: "organisms-component",
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
              id: "organisms.lifeStage"
            },
            {
              id: "organisms.sex"
            },
            {
              id: "organisms.remarks"
            }
          ]
        },
        {
          id: "organism-verbatim-determination-section",
          labelKey: "verbatimDeterminationLegend",
          maxGridSizeX: 1,
          items: [
            {
              id: "organisms.determination.verbatimScientificName"
            },
            {
              id: "organisms.determination.verbatimDeterminer"
            },
            {
              id: "organisms.determination.verbatimDate"
            },
            {
              id: "organisms.determination.verbatimRemarks"
            },
            {
              id: "organisms.determination.transcriberRemarks"
            }
          ]
        },
        {
          id: "organism-determination-section",
          labelKey: "determination",
          maxGridSizeX: 1,
          items: [
            {
              id: "organisms.determination.scientificName"
            },
            {
              id: "organisms.determination.scientificNameInput"
            },
            {
              id: "organisms.determination.determiner"
            },
            {
              id: "organisms.determination.determinedOn"
            },
            {
              id: "organisms.determination.determinationRemarks"
            }
          ]
        },
        {
          id: "organism-type-specimen-section",
          labelKey: "typeSpecimen",
          maxGridSizeX: 1,
          items: [
            {
              id: "organisms.determination.typeStatus"
            },
            {
              id: "organisms.determination.typeStatusEvidence"
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
      id: "associations-component",
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
      id: "storage-component",
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
      id: "restriction-component",
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
      id: "scheduled-actions-component",
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
      id: "managed-attributes-component",
      labelKey: "managedAttributes",
      maxGridSizeX: 2,
      sections: [
        {
          id: "managed-attributes-section",
          labelKey: "managedAttributes",
          maxGridSizeX: 2,
          items: []
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
