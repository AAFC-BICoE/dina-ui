import { FieldMappingConfigType, LinkOrCreateSetting } from "../";
import { WorkbookDataTypeEnum } from "../";

const FieldMappingConfig: FieldMappingConfigType = {
  "material-sample": {
    relationshipConfig: {
      type: "material-sample",
      hasGroup: true,
      baseApiPath: "/collection-api"
    },
    materialSampleName: { dataType: WorkbookDataTypeEnum.STRING },
    preservationType: { dataType: WorkbookDataTypeEnum.STRING },
    preparationFixative: { dataType: WorkbookDataTypeEnum.STRING },
    preparationMaterials: { dataType: WorkbookDataTypeEnum.STRING },
    preparationSubstrate: { dataType: WorkbookDataTypeEnum.STRING },
    preparationDate: { dataType: WorkbookDataTypeEnum.DATE },
    preparationRemarks: { dataType: WorkbookDataTypeEnum.STRING },
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
      vocabularyEndpoint: "/collection-api/vocabulary/materialSampleType"
    },
    managedAttributes: { dataType: WorkbookDataTypeEnum.MANAGED_ATTRIBUTES },
    organismsIndividualEntry: { dataType: WorkbookDataTypeEnum.BOOLEAN },
    useTargetOrganism: { dataType: WorkbookDataTypeEnum.BOOLEAN },
    publiclyReleasable: { dataType: WorkbookDataTypeEnum.BOOLEAN },
    useNextSequence: { dataType: WorkbookDataTypeEnum.BOOLEAN },
    isRestricted: { dataType: WorkbookDataTypeEnum.BOOLEAN },
    collection: {
      dataType: WorkbookDataTypeEnum.OBJECT,
      relationshipConfig: {
        hasGroup: true,
        linkOrCreateSetting: LinkOrCreateSetting.LINK_OR_CREATE,
        type: "collection",
        baseApiPath: "/collection-api"
      },
      attributes: {
        name: { dataType: WorkbookDataTypeEnum.STRING },
        code: { dataType: WorkbookDataTypeEnum.STRING },
        webpage: { dataType: WorkbookDataTypeEnum.STRING },
        contact: { dataType: WorkbookDataTypeEnum.STRING },
        address: { dataType: WorkbookDataTypeEnum.STRING },
        remarks: { dataType: WorkbookDataTypeEnum.STRING },
        identifiers: {
          dataType: WorkbookDataTypeEnum.OBJECT_ARRAY,
          attributes: {
            type: { dataType: WorkbookDataTypeEnum.STRING },
            uri: { dataType: WorkbookDataTypeEnum.STRING }
          }
        }
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
              dataType: WorkbookDataTypeEnum.OBJECT_ARRAY,
              relationshipConfig: {
                hasGroup: false,
                type: "person",
                linkOrCreateSetting: LinkOrCreateSetting.LINK_OR_CREATE,
                baseApiPath: "agent-api"
              },
              attributes: {
                displayName: { dataType: WorkbookDataTypeEnum.STRING },
                email: { dataType: WorkbookDataTypeEnum.STRING },
                givenNames: { dataType: WorkbookDataTypeEnum.STRING },
                familyNames: { dataType: WorkbookDataTypeEnum.STRING },
                aliases: { dataType: WorkbookDataTypeEnum.STRING },
                webpage: { dataType: WorkbookDataTypeEnum.STRING },
                remarks: { dataType: WorkbookDataTypeEnum.STRING }
              }
            },
            literalGeoreferencedBy: { dataType: WorkbookDataTypeEnum.STRING },
            dwcGeoreferenceProtocol: { dataType: WorkbookDataTypeEnum.STRING },
            dwcGeoreferenceSources: { dataType: WorkbookDataTypeEnum.STRING },
            dwcGeoreferenceRemarks: { dataType: WorkbookDataTypeEnum.STRING }
          }
        },
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
            linkOrCreateSetting: LinkOrCreateSetting.LINK_OR_CREATE,
            baseApiPath: "agent-api"
          },
          attributes: {
            displayName: { dataType: WorkbookDataTypeEnum.STRING },
            email: { dataType: WorkbookDataTypeEnum.STRING },
            givenNames: { dataType: WorkbookDataTypeEnum.STRING },
            familyNames: { dataType: WorkbookDataTypeEnum.STRING },
            aliases: { dataType: WorkbookDataTypeEnum.STRING },
            webpage: { dataType: WorkbookDataTypeEnum.STRING },
            remarks: { dataType: WorkbookDataTypeEnum.STRING }
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
        type: "preparation-type",
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
        name: { dataType: WorkbookDataTypeEnum.STRING },
        protocolType: { dataType: WorkbookDataTypeEnum.STRING }
      }
    },
    preparedBy: {
      dataType: WorkbookDataTypeEnum.OBJECT_ARRAY,
      relationshipConfig: {
        hasGroup: false,
        type: "person",
        linkOrCreateSetting: LinkOrCreateSetting.LINK_OR_CREATE,
        baseApiPath: "agent-api"
      },
      attributes: {
        displayName: { dataType: WorkbookDataTypeEnum.STRING },
        email: { dataType: WorkbookDataTypeEnum.STRING },
        givenNames: { dataType: WorkbookDataTypeEnum.STRING },
        familyNames: { dataType: WorkbookDataTypeEnum.STRING },
        aliases: { dataType: WorkbookDataTypeEnum.STRING },
        webpage: { dataType: WorkbookDataTypeEnum.STRING },
        remarks: { dataType: WorkbookDataTypeEnum.STRING }
      }
    },
    storageUnit: {
      dataType: WorkbookDataTypeEnum.OBJECT,
      relationshipConfig: {
        hasGroup: true,
        linkOrCreateSetting: LinkOrCreateSetting.LINK,
        type: "storage-unit",
        baseApiPath: "/collection-api"
      },
      attributes: {
        name: { dataType: WorkbookDataTypeEnum.STRING },
        barcode: { dataType: WorkbookDataTypeEnum.STRING }
      }
    },
    projects: {
      dataType: WorkbookDataTypeEnum.OBJECT_ARRAY,
      relationshipConfig: {
        hasGroup: true,
        type: "project",
        linkOrCreateSetting: LinkOrCreateSetting.LINK_OR_CREATE,
        baseApiPath: "collection-api"
      },
      attributes: {
        name: { dataType: WorkbookDataTypeEnum.STRING },
        startDate: { dataType: WorkbookDataTypeEnum.DATE },
        endDate: { dataType: WorkbookDataTypeEnum.DATE },
        status: { dataType: WorkbookDataTypeEnum.STRING }
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
            typeStatus: { dataType: WorkbookDataTypeEnum.STRING }
          }
        }
      }
    }
  }
};

export default FieldMappingConfig;
