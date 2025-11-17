import { DCTYPE_OPTIONS } from "../../../pages/object-store/metadata/edit";
import {
  FieldMappingConfigType,
  LinkOrCreateSetting,
  WorkbookDataTypeEnum
} from "../";

const FieldMappingConfig: FieldMappingConfigType = {
  "material-sample": {
    relationshipConfig: {
      type: "material-sample",
      hasGroup: true,
      baseApiPath: "/collection-api",
      allowAppendData: true,
      fieldColumnLocaleId: "materialSampleFieldsMapping"
    },
    materialSampleName: { dataType: WorkbookDataTypeEnum.STRING },
    preservationType: { dataType: WorkbookDataTypeEnum.STRING },
    preparationFixative: { dataType: WorkbookDataTypeEnum.STRING },
    preparationMaterials: { dataType: WorkbookDataTypeEnum.STRING },
    preparationSubstrate: { dataType: WorkbookDataTypeEnum.STRING },
    preparationDate: { dataType: WorkbookDataTypeEnum.DATE },
    preparationRemarks: { dataType: WorkbookDataTypeEnum.STRING },
    preparationManagedAttributes: {
      dataType: WorkbookDataTypeEnum.MANAGED_ATTRIBUTES,
      endpoint: "collection-api/managed-attribute",
      managedAttributeComponent: "PREPARATION"
    },
    description: { dataType: WorkbookDataTypeEnum.STRING },
    dwcDegreeOfEstablishment: { dataType: WorkbookDataTypeEnum.STRING },
    barcode: { dataType: WorkbookDataTypeEnum.STRING },
    materialSampleState: { dataType: WorkbookDataTypeEnum.STRING },
    materialSampleRemarks: { dataType: WorkbookDataTypeEnum.STRING },
    notPubliclyReleasableReason: { dataType: WorkbookDataTypeEnum.STRING },
    dwcOtherCatalogNumbers: { dataType: WorkbookDataTypeEnum.STRING_ARRAY },
    tags: { dataType: WorkbookDataTypeEnum.STRING_ARRAY },
    materialSampleType: {
      dataType: WorkbookDataTypeEnum.VOCABULARY,
      endpoint: "/collection-api/vocabulary2/materialSampleType"
    },
    managedAttributes: {
      dataType: WorkbookDataTypeEnum.MANAGED_ATTRIBUTES,
      endpoint: "collection-api/managed-attribute",
      managedAttributeComponent: "MATERIAL_SAMPLE"
    },
    organismsIndividualEntry: { dataType: WorkbookDataTypeEnum.BOOLEAN },
    useTargetOrganism: { dataType: WorkbookDataTypeEnum.BOOLEAN },
    publiclyReleasable: { dataType: WorkbookDataTypeEnum.BOOLEAN },
    useNextSequence: { dataType: WorkbookDataTypeEnum.BOOLEAN },
    isRestricted: { dataType: WorkbookDataTypeEnum.BOOLEAN },
    hostOrganism: {
      dataType: WorkbookDataTypeEnum.OBJECT,
      attributes: {
        name: { dataType: WorkbookDataTypeEnum.STRING },
        remarks: { dataType: WorkbookDataTypeEnum.STRING }
      }
    },
    collection: {
      dataType: WorkbookDataTypeEnum.OBJECT,
      relationshipConfig: {
        hasGroup: true,
        linkOrCreateSetting: LinkOrCreateSetting.LINK,
        type: "collection",
        baseApiPath: "/collection-api"
      },
      attributes: {
        name: { dataType: WorkbookDataTypeEnum.STRING }
      }
    },
    collectingEvent: {
      dataType: WorkbookDataTypeEnum.OBJECT,
      relationshipConfig: {
        type: "collecting-event",
        hasGroup: true,
        linkOrCreateSetting: LinkOrCreateSetting.LINK_OR_CREATE,
        baseApiPath: "/collection-api"
      },
      attributes: {
        dwcFieldNumber: { dataType: WorkbookDataTypeEnum.STRING },
        dwcRecordNumber: { dataType: WorkbookDataTypeEnum.STRING },
        otherRecordNumbers: { dataType: WorkbookDataTypeEnum.STRING_ARRAY },
        geoReferenceAssertions: {
          dataType: WorkbookDataTypeEnum.OBJECT_ARRAY,
          attributes: {
            dwcDecimalLatitude: { dataType: WorkbookDataTypeEnum.STRING },
            dwcDecimalLongitude: { dataType: WorkbookDataTypeEnum.STRING },
            dwcCoordinateUncertaintyInMeters: {
              dataType: WorkbookDataTypeEnum.NUMBER
            },
            dwcGeoreferencedDate: { dataType: WorkbookDataTypeEnum.DATE },
            georeferencedBy: {
              dataType: WorkbookDataTypeEnum.STRING_ARRAY
            },
            literalGeoreferencedBy: { dataType: WorkbookDataTypeEnum.STRING },
            dwcGeoreferenceProtocol: { dataType: WorkbookDataTypeEnum.STRING },
            dwcGeoreferenceSources: { dataType: WorkbookDataTypeEnum.STRING },
            dwcGeoreferenceRemarks: { dataType: WorkbookDataTypeEnum.STRING },
            dwcGeodeticDatum: { dataType: WorkbookDataTypeEnum.STRING }
          }
        },
        dwcVerbatimCoordinates: { dataType: WorkbookDataTypeEnum.STRING },
        dwcRecordedBy: { dataType: WorkbookDataTypeEnum.STRING },
        startEventDateTime: { dataType: WorkbookDataTypeEnum.STRING },
        endEventDateTime: { dataType: WorkbookDataTypeEnum.STRING },
        verbatimEventDateTime: { dataType: WorkbookDataTypeEnum.STRING },
        dwcVerbatimLocality: { dataType: WorkbookDataTypeEnum.STRING },
        host: { dataType: WorkbookDataTypeEnum.STRING },
        dwcVerbatimCoordinateSystem: { dataType: WorkbookDataTypeEnum.STRING },
        dwcVerbatimSRS: { dataType: WorkbookDataTypeEnum.STRING },
        dwcVerbatimElevation: { dataType: WorkbookDataTypeEnum.STRING },
        dwcVerbatimDepth: { dataType: WorkbookDataTypeEnum.STRING },
        dwcCountry: { dataType: WorkbookDataTypeEnum.STRING },
        dwcCountryCode: { dataType: WorkbookDataTypeEnum.STRING },
        dwcStateProvince: { dataType: WorkbookDataTypeEnum.STRING },
        habitat: { dataType: WorkbookDataTypeEnum.STRING },
        dwcMinimumElevationInMeters: { dataType: WorkbookDataTypeEnum.NUMBER },
        dwcMinimumDepthInMeters: { dataType: WorkbookDataTypeEnum.NUMBER },
        managedAttributes: {
          dataType: WorkbookDataTypeEnum.MANAGED_ATTRIBUTES,
          endpoint: "collection-api/managed-attribute",
          managedAttributeComponent: "COLLECTING_EVENT"
        },
        dwcMaximumElevationInMeters: { dataType: WorkbookDataTypeEnum.NUMBER },
        dwcMaximumDepthInMeters: { dataType: WorkbookDataTypeEnum.NUMBER },
        substrate: { dataType: WorkbookDataTypeEnum.STRING },
        remarks: { dataType: WorkbookDataTypeEnum.STRING },
        publiclyReleasable: { dataType: WorkbookDataTypeEnum.BOOLEAN },
        notPubliclyReleasableReason: { dataType: WorkbookDataTypeEnum.STRING },
        tags: { dataType: WorkbookDataTypeEnum.STRING_ARRAY },
        geographicPlaceNameSource: { dataType: WorkbookDataTypeEnum.STRING },
        collectionMethod: {
          dataType: WorkbookDataTypeEnum.OBJECT,
          relationshipConfig: {
            linkOrCreateSetting: LinkOrCreateSetting.LINK,
            type: "collection-method",
            hasGroup: true,
            baseApiPath: "/collection-api"
          },
          attributes: {
            name: { dataType: WorkbookDataTypeEnum.STRING }
          }
        },
        protocol: {
          dataType: WorkbookDataTypeEnum.OBJECT,
          relationshipConfig: {
            linkOrCreateSetting: LinkOrCreateSetting.LINK,
            type: "protocol",
            hasGroup: true,
            baseApiPath: "/collection-api"
          },
          attributes: {
            name: { dataType: WorkbookDataTypeEnum.STRING },
            protocolType: { dataType: WorkbookDataTypeEnum.STRING }
          }
        },
        collectors: {
          dataType: WorkbookDataTypeEnum.OBJECT_ARRAY,
          relationshipConfig: {
            hasGroup: false,
            type: "person",
            linkOrCreateSetting: LinkOrCreateSetting.LINK,
            baseApiPath: "agent-api"
          },
          attributes: {
            displayName: { dataType: WorkbookDataTypeEnum.STRING }
          }
        }
      }
    },
    preparationType: {
      dataType: WorkbookDataTypeEnum.OBJECT,
      relationshipConfig: {
        linkOrCreateSetting: LinkOrCreateSetting.LINK,
        type: "preparation-type",
        hasGroup: true,
        baseApiPath: "/collection-api"
      },
      attributes: {
        name: { dataType: WorkbookDataTypeEnum.STRING }
      }
    },
    preparationMethod: {
      dataType: WorkbookDataTypeEnum.OBJECT,
      relationshipConfig: {
        linkOrCreateSetting: LinkOrCreateSetting.LINK,
        type: "preparation-method",
        hasGroup: true,
        baseApiPath: "/collection-api"
      },
      attributes: {
        name: { dataType: WorkbookDataTypeEnum.STRING }
      }
    },
    preparationProtocol: {
      dataType: WorkbookDataTypeEnum.OBJECT,
      relationshipConfig: {
        linkOrCreateSetting: LinkOrCreateSetting.LINK,
        type: "protocol",
        hasGroup: true,
        baseApiPath: "/collection-api"
      },
      attributes: {
        name: { dataType: WorkbookDataTypeEnum.STRING }
      }
    },
    preparedBy: {
      dataType: WorkbookDataTypeEnum.OBJECT_ARRAY,
      relationshipConfig: {
        hasGroup: false,
        type: "person",
        linkOrCreateSetting: LinkOrCreateSetting.LINK,
        baseApiPath: "agent-api"
      },
      attributes: {
        displayName: { dataType: WorkbookDataTypeEnum.STRING }
      }
    },
    storageUnitUsage: {
      dataType: WorkbookDataTypeEnum.OBJECT,
      relationshipConfig: {
        hasGroup: false,
        linkOrCreateSetting: LinkOrCreateSetting.CREATE,
        type: "storage-unit-usage",
        baseApiPath: "/collection-api"
      },
      attributes: {
        wellColumn: { dataType: WorkbookDataTypeEnum.NUMBER },
        wellRow: { dataType: WorkbookDataTypeEnum.STRING_COORDINATE },
        storageUnit: {
          dataType: WorkbookDataTypeEnum.OBJECT,
          relationshipConfig: {
            hasGroup: true,
            linkOrCreateSetting: LinkOrCreateSetting.LINK,
            type: "storage-unit",
            baseApiPath: "/collection-api"
          },
          attributes: {
            name: { dataType: WorkbookDataTypeEnum.STRING }
          }
        }
      }
    },
    projects: {
      dataType: WorkbookDataTypeEnum.OBJECT_ARRAY,
      relationshipConfig: {
        hasGroup: true,
        type: "project",
        linkOrCreateSetting: LinkOrCreateSetting.LINK,
        baseApiPath: "collection-api"
      },
      attributes: {
        name: { dataType: WorkbookDataTypeEnum.STRING }
      }
    },
    organism: {
      dataType: WorkbookDataTypeEnum.OBJECT_ARRAY,
      relationshipConfig: {
        hasGroup: true,
        linkOrCreateSetting: LinkOrCreateSetting.CREATE,
        type: "organism",
        baseApiPath: "/collection-api"
      },
      attributes: {
        lifeStage: { dataType: WorkbookDataTypeEnum.STRING },
        sex: { dataType: WorkbookDataTypeEnum.STRING },
        remarks: { dataType: WorkbookDataTypeEnum.STRING },
        isTarget: { dataType: WorkbookDataTypeEnum.BOOLEAN },
        determination: {
          dataType: WorkbookDataTypeEnum.OBJECT_ARRAY,
          attributes: {
            verbatimScientificName: { dataType: WorkbookDataTypeEnum.STRING },
            verbatimDeterminer: { dataType: WorkbookDataTypeEnum.STRING },
            verbatimDate: { dataType: WorkbookDataTypeEnum.DATE },
            typeStatus: { dataType: WorkbookDataTypeEnum.STRING },
            scientificName: { dataType: WorkbookDataTypeEnum.STRING },
            scientificNameDetails: {
              dataType: WorkbookDataTypeEnum.CLASSIFICATION
            }
          }
        }
      }
    },
    parentMaterialSample: {
      dataType: WorkbookDataTypeEnum.OBJECT,
      relationshipConfig: {
        linkOrCreateSetting: LinkOrCreateSetting.LINK_OR_ERROR,
        type: "material-sample",
        hasGroup: true,
        baseApiPath: "/collection-api"
      },
      attributes: {
        materialSampleName: { dataType: WorkbookDataTypeEnum.STRING }
      }
    },
    assemblages: {
      dataType: WorkbookDataTypeEnum.OBJECT_ARRAY,
      relationshipConfig: {
        hasGroup: true,
        linkOrCreateSetting: LinkOrCreateSetting.LINK,
        type: "assemblage",
        baseApiPath: "/collection-api"
      },
      attributes: {
        name: { dataType: WorkbookDataTypeEnum.STRING }
      }
    },
    attachment: {
      dataType: WorkbookDataTypeEnum.OBJECT_ARRAY,
      relationshipConfig: {
        hasGroup: false,
        type: "metadata",
        linkOrCreateSetting: LinkOrCreateSetting.LINK,
        baseApiPath: "/objectstore-api"
      },
      attributes: {
        name: { dataType: WorkbookDataTypeEnum.STRING }
      }
    }
  },
  metadata: {
    relationshipConfig: {
      type: "metadata",
      hasGroup: true,
      baseApiPath: "/objectstore-api",
      allowAppendData: false,
      fieldColumnLocaleId: "metadataFieldsMapping"
    },

    // Linking the file identifier to the metadata 'fileName' field.
    originalFilename: { dataType: WorkbookDataTypeEnum.STRING },

    filename: { dataType: WorkbookDataTypeEnum.STRING },
    acCaption: { dataType: WorkbookDataTypeEnum.STRING },

    acDigitizationDate: { dataType: WorkbookDataTypeEnum.DATE_TIME },

    dcType: {
      dataType: WorkbookDataTypeEnum.ENUM,
      allowedValues: DCTYPE_OPTIONS
    },
    acSubtype: { dataType: WorkbookDataTypeEnum.STRING },

    orientation: { dataType: WorkbookDataTypeEnum.NUMBER },

    dcCreator: {
      dataType: WorkbookDataTypeEnum.OBJECT,
      relationshipConfig: {
        hasGroup: false,
        type: "person",
        linkOrCreateSetting: LinkOrCreateSetting.LINK,
        baseApiPath: "agent-api"
      },
      attributes: {
        displayName: { dataType: WorkbookDataTypeEnum.STRING }
      }
    },

    managedAttributes: {
      dataType: WorkbookDataTypeEnum.MANAGED_ATTRIBUTES,
      endpoint: "objectstore-api/managed-attribute",
      managedAttributeComponent: "METADATA"
    }
  }
};

export default FieldMappingConfig;
