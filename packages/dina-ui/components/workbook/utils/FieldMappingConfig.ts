import { FieldMappingConfigType } from "../";
import { WorkbookDataTypeEnum } from "../";

const FieldMappingConfig: FieldMappingConfigType = {
  "material-sample": {
    relationshipConfig: {
      type: "material-sample",
      hasGroup: true,
      tryToLinkExisting: true,
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
    organism: {
      dataType: WorkbookDataTypeEnum.OBJECT_ARRAY,
      relationshipConfig: {
        hasGroup: true,
        tryToLinkExisting: false,
        type: "organism",
        baseApiPath: "collection-api"
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
