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
          id: "tags-section",
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
      sections: []
    },
    {
      id: "acquisition-event-component",
      labelKey: "acquisitionEvent",
      maxGridSizeX: 2,
      switchClassName: "enable-acquisition-event",
      sections: []
    },
    {
      id: "preparations-component",
      labelKey: "preparations",
      maxGridSizeX: 2,
      switchClassName: "enable-catalogue-info",
      sections: []
    },
    {
      id: "organisms-component",
      labelKey: "organisms",
      maxGridSizeX: 2,
      switchClassName: "enable-organisms",
      sections: []
    },
    {
      id: "associations-component",
      labelKey: "associationsLegend",
      maxGridSizeX: 2,
      switchClassName: "enable-associations",
      sections: []
    },
    {
      id: "storage-component",
      labelKey: "storage",
      maxGridSizeX: 2,
      switchClassName: "enable-storage",
      sections: []
    },
    {
      id: "restriction-component",
      labelKey: "restrictions",
      maxGridSizeX: 2,
      switchClassName: "enable-restrictions",
      sections: []
    },
    {
      id: "scheduled-actions-component",
      labelKey: "scheduledActions",
      maxGridSizeX: 2,
      switchClassName: "enable-scheduled-actions",
      sections: []
    },
    {
      id: "managedAttributes-component",
      labelKey: "managedAttributes",
      maxGridSizeX: 2,
      sections: []
    },
    {
      id: "material-sample-attachments-component",
      labelKey: "materialSampleAttachments",
      maxGridSizeX: 2,
      sections: []
    }
  ];
