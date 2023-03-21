import { DataTypeEnum, FieldMappingConfigType } from "./useWorkbookConverter";

const FieldMappingConfig: FieldMappingConfigType = {
  "material-sample": {
    materialSampleName: { dataType: DataTypeEnum.STRING },
    preservationType: { dataType: DataTypeEnum.STRING },
    preparationFixative: { dataType: DataTypeEnum.STRING },
    preparationMaterials: { dataType: DataTypeEnum.STRING },
    preparationSubstrate: { dataType: DataTypeEnum.STRING },
    preparationDate: { dataType: DataTypeEnum.DATE },
    preparationRemarks: { dataType: DataTypeEnum.STRING },
    description: { dataType: DataTypeEnum.STRING },
    dwcDegreeOfEstablishment: { dataType: DataTypeEnum.STRING },
    barcode: { dataType: DataTypeEnum.STRING },
    materialSampleState: { dataType: DataTypeEnum.STRING },
    materialSampleRemarks: { dataType: DataTypeEnum.STRING },
    notPubliclyReleasableReason: { dataType: DataTypeEnum.STRING },
    dwcOtherCatalogNumbers: { dataType: DataTypeEnum.STRING_ARRAY },
    tags: { dataType: DataTypeEnum.STRING_ARRAY },
    materialSampleType: {
      dataType: DataTypeEnum.VOCABULARY,
      vocabularyEndpoint: "/collection-api/vocabulary/materialSampleType"
    },
    managedAttributes: { dataType: DataTypeEnum.MANAGED_ATTRIBUTES },
    organismsIndividualEntry: { dataType: DataTypeEnum.BOOLEAN },
    useTargetOrganism: { dataType: DataTypeEnum.BOOLEAN },
    publiclyReleasable: { dataType: DataTypeEnum.BOOLEAN },
    useNextSequence: { dataType: DataTypeEnum.BOOLEAN },
    isRestricted: { dataType: DataTypeEnum.BOOLEAN },
    organism: {
      dataType: DataTypeEnum.OBJECT_ARRAY,
      attributes: {
        lifeStage: { dataType: DataTypeEnum.STRING },
        sex: { dataType: DataTypeEnum.STRING },
        remarks: { dataType: DataTypeEnum.STRING },
        isTarget: { dataType: DataTypeEnum.BOOLEAN },
        determination: {
          dataType: DataTypeEnum.OBJECT_ARRAY,
          attributes: {
            verbatimScientificName: { dataType: DataTypeEnum.STRING },
            verbatimDeterminer: { dataType: DataTypeEnum.STRING },
            verbatimDate: { dataType: DataTypeEnum.DATE },
            typeStatus: { dataType: DataTypeEnum.STRING }
          }
        }
      }
    }
  }
};

export default FieldMappingConfig;
