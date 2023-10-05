import { FieldMappingConfigType } from "../";
import { WorkBookDataTypeEnum } from "../";

const FieldMappingConfig: FieldMappingConfigType = {
  "material-sample": {
    materialSampleName: { dataType: WorkBookDataTypeEnum.STRING },
    preservationType: { dataType: WorkBookDataTypeEnum.STRING },
    preparationFixative: { dataType: WorkBookDataTypeEnum.STRING },
    preparationMaterials: { dataType: WorkBookDataTypeEnum.STRING },
    preparationSubstrate: { dataType: WorkBookDataTypeEnum.STRING },
    preparationDate: { dataType: WorkBookDataTypeEnum.DATE },
    preparationRemarks: { dataType: WorkBookDataTypeEnum.STRING },
    description: { dataType: WorkBookDataTypeEnum.STRING },
    dwcDegreeOfEstablishment: { dataType: WorkBookDataTypeEnum.STRING },
    barcode: { dataType: WorkBookDataTypeEnum.STRING },
    materialSampleState: { dataType: WorkBookDataTypeEnum.STRING },
    materialSampleRemarks: { dataType: WorkBookDataTypeEnum.STRING },
    notPubliclyReleasableReason: { dataType: WorkBookDataTypeEnum.STRING },
    dwcOtherCatalogNumbers: { dataType: WorkBookDataTypeEnum.STRING_ARRAY },
    tags: { dataType: WorkBookDataTypeEnum.STRING_ARRAY },
    materialSampleType: {
      dataType: WorkBookDataTypeEnum.VOCABULARY,
      vocabularyEndpoint: "/collection-api/vocabulary/materialSampleType"
    },
    managedAttributes: { dataType: WorkBookDataTypeEnum.MANAGED_ATTRIBUTES },
    organismsIndividualEntry: { dataType: WorkBookDataTypeEnum.BOOLEAN },
    useTargetOrganism: { dataType: WorkBookDataTypeEnum.BOOLEAN },
    publiclyReleasable: { dataType: WorkBookDataTypeEnum.BOOLEAN },
    useNextSequence: { dataType: WorkBookDataTypeEnum.BOOLEAN },
    isRestricted: { dataType: WorkBookDataTypeEnum.BOOLEAN },
    organism: {
      dataType: WorkBookDataTypeEnum.OBJECT_ARRAY,
      attributes: {
        lifeStage: { dataType: WorkBookDataTypeEnum.STRING },
        sex: { dataType: WorkBookDataTypeEnum.STRING },
        remarks: { dataType: WorkBookDataTypeEnum.STRING },
        isTarget: { dataType: WorkBookDataTypeEnum.BOOLEAN },
        determination: {
          dataType: WorkBookDataTypeEnum.OBJECT_ARRAY,
          attributes: {
            verbatimScientificName: { dataType: WorkBookDataTypeEnum.STRING },
            verbatimDeterminer: { dataType: WorkBookDataTypeEnum.STRING },
            verbatimDate: { dataType: WorkBookDataTypeEnum.DATE },
            typeStatus: { dataType: WorkBookDataTypeEnum.STRING }
          }
        }
      }
    }
  }
};

export default FieldMappingConfig;
