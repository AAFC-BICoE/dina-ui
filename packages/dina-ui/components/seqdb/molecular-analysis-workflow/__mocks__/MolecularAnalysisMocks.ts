import { PersistedResource } from "kitsu";
import {
  MaterialSampleSummary,
  Protocol,
  StorageUnitType,
  Vocabulary
} from "packages/dina-ui/types/collection-api";
import { StorageUnitUsage } from "packages/dina-ui/types/collection-api/resources/StorageUnitUsage";
import { Metadata } from "packages/dina-ui/types/objectstore-api";
import { GenericMolecularAnalysis } from "packages/dina-ui/types/seqdb-api/resources/GenericMolecularAnalysis";
import { GenericMolecularAnalysisItem } from "packages/dina-ui/types/seqdb-api/resources/GenericMolecularAnalysisItem";
import { MolecularAnalysisRun } from "packages/dina-ui/types/seqdb-api/resources/molecular-analysis/MolecularAnalysisRun";
import { MolecularAnalysisRunItem } from "packages/dina-ui/types/seqdb-api/resources/molecular-analysis/MolecularAnalysisRunItem";
import { QualityControl } from "packages/dina-ui/types/seqdb-api/resources/QualityControl";
import { Group } from "packages/dina-ui/types/user-api";

export const TEST_GROUP: PersistedResource<Group>[] = [
  {
    id: "31ee7848-b5c1-46e1-bbca-68006d9eda3b",
    type: "group",
    name: "Agriculture and Agri-food Canada",
    path: "",
    labels: { en: "AAFC", fr: "AAC" }
  }
];

export const TEST_MOLECULAR_ANALYSIS_TYPES: PersistedResource<Vocabulary> = {
  id: "molecularAnalysisType",
  type: "vocabulary",
  vocabularyElements: [
    {
      key: "hrms",
      name: "HRMS",
      multilingualTitle: {
        titles: [
          { lang: "en", title: "High Resolution Mass Spectrometry (HRMS)" }
        ]
      }
    },
    {
      key: "gcms",
      name: "GCMS",
      multilingualTitle: {
        titles: [
          {
            lang: "en",
            title:
              "Gas chromatography coupled to low-resolution mass spectrometry (GCMS)"
          }
        ]
      }
    }
  ]
};

export const TEST_PROTOCOLS: PersistedResource<Protocol>[] = [
  {
    id: "232f661a-bcd4-4ff2-8c6b-dace481b939a",
    type: "protocol",
    name: "Protocol Test 1"
  },
  {
    id: "4faf8fdc-243b-42e8-b106-cf173da67f08",
    type: "protocol",
    name: "Protocol Test 2"
  }
];

export const TEST_MOLECULAR_ANALYSIS_RUN_ID =
  "5fee24e2-2ab1-4511-a6e6-4f8ef237f6c4";

export const TEST_MOLECULAR_ANALYSIS_RUN: PersistedResource<MolecularAnalysisRun> =
  {
    id: TEST_MOLECULAR_ANALYSIS_RUN_ID,
    type: "molecular-analysis-run",
    name: "run-name-1",
    group: "aafc",
    attachments: [
      {
        id: "7f3eccfa-3bc1-412f-9385-bb00e2319ac6",
        type: "metadata"
      }
    ]
  };

export const TEST_MOLECULAR_ANALYSIS_EMPTY_ID =
  "62f25a7d-ebf5-469d-b3ef-f6f3269a6e23";

export const TEST_MOLECULAR_ANALYSIS_EMPTY: PersistedResource<GenericMolecularAnalysis> =
  {
    id: TEST_MOLECULAR_ANALYSIS_EMPTY_ID,
    type: "generic-molecular-analysis",
    name: "empty generic molecular analysis",
    analysisType: "hrms",
    group: "aafc"
  };

export const TEST_MOLECULAR_ANALYSIS_WITH_RUN_ID =
  "2a4fe193-28c7-499e-8eaf-26d7dc1fcd06";

export const TEST_MOLECULAR_ANALYSIS: PersistedResource<GenericMolecularAnalysis> =
  {
    id: TEST_MOLECULAR_ANALYSIS_WITH_RUN_ID,
    type: "generic-molecular-analysis",
    name: "generic molecular analysis",
    analysisType: "hrms",
    group: "aafc"
  };

export const TEST_MATERIAL_SAMPLE_SUMMARY: PersistedResource<MaterialSampleSummary>[] =
  [
    {
      id: "01932b12-fa1a-74dc-b70c-453f55f42444",
      type: "material-sample-summary",
      materialSampleName: "Sample 1"
    },
    {
      id: "1182ca20-d3df-47e1-b27f-2a9cd9b6074f",
      type: "material-sample-summary",
      materialSampleName: "Sample 2"
    },
    {
      id: "239aaf35-9d02-409c-b099-987948cdcd63",
      type: "material-sample-summary",
      materialSampleName: "Sample 3"
    }
  ];

export const TEST_MOLECULAR_ANALYSIS_ITEMS_WITH_RUN: PersistedResource<GenericMolecularAnalysisItem>[] =
  [
    {
      id: "99ecc6fc-7378-4641-8914-1b9104e37b95",
      type: "generic-molecular-analysis-item",
      genericMolecularAnalysis: TEST_MOLECULAR_ANALYSIS,
      materialSample: TEST_MATERIAL_SAMPLE_SUMMARY[0],
      molecularAnalysisRunItem: {
        id: "f65ed036-eb92-40d9-af03-d027646e8948",
        type: "molecular-analysis-run-item",
        usageType: "hrms",
        run: TEST_MOLECULAR_ANALYSIS_RUN
      },
      storageUnitUsage: {
        id: "45ed6126-26b8-4ebd-a89f-1bbcf6c69d27",
        type: "storage-unit-usage"
      }
    },
    {
      id: "169eafe4-44f2-407e-aa90-1a5483edf522",
      type: "generic-molecular-analysis-item",
      genericMolecularAnalysis: TEST_MOLECULAR_ANALYSIS,
      materialSample: TEST_MATERIAL_SAMPLE_SUMMARY[1],
      molecularAnalysisRunItem: {
        id: "021e1676-2eff-45e5-aed3-1c1b6cfece0a",
        type: "molecular-analysis-run-item",
        usageType: "hrms",
        run: TEST_MOLECULAR_ANALYSIS_RUN
      },
      storageUnitUsage: {
        id: "be81e29a-b634-43c7-8f1a-53bf394d87f2",
        type: "storage-unit-usage"
      }
    }
  ];

export const STORAGE_UNIT_USAGE_1: StorageUnitUsage = {
  id: "45ed6126-26b8-4ebd-a89f-1bbcf6c69d27",
  type: "storage-unit-usage",
  cellNumber: 1,
  wellColumn: 1,
  wellRow: "A",
  storageUnit: {
    id: "6f5f6d1c-69cc-49b1-b3ae-1675c18ef5b5",
    type: "storage-unit",
    group: "aafc",
    name: "Storage Unit Name",
    storageUnitType: {
      id: "61909244-5af7-453c-bc57-99504ed4bec4",
      type: "storage-unit-type",
      group: "aafc",
      name: "Storage Unit Type Name",
      gridLayoutDefinition: {
        fillDirection: "BY_ROW",
        numberOfColumns: 5,
        numberOfRows: 5
      }
    }
  }
};

export const STORAGE_UNIT_USAGE_2: StorageUnitUsage = {
  id: "be81e29a-b634-43c7-8f1a-53bf394d87f2",
  type: "storage-unit-usage",
  cellNumber: 2,
  wellColumn: 2,
  wellRow: "A",
  storageUnit: {
    id: "6f5f6d1c-69cc-49b1-b3ae-1675c18ef5b5",
    type: "storage-unit",
    group: "aafc",
    name: "Storage Unit Name",
    storageUnitType: {
      id: "61909244-5af7-453c-bc57-99504ed4bec4",
      type: "storage-unit-type",
      group: "aafc",
      name: "Storage Unit Type Name",
      gridLayoutDefinition: {
        fillDirection: "BY_ROW",
        numberOfColumns: 5,
        numberOfRows: 5
      }
    }
  }
};

export const STORAGE_UNIT_USAGE_3: StorageUnitUsage = {
  id: "0192fd01-9104-72fa-a18f-80d97da0c935",
  type: "storage-unit-usage",
  cellNumber: 3,
  wellColumn: 3,
  wellRow: "A",
  storageUnit: {
    id: "6f5f6d1c-69cc-49b1-b3ae-1675c18ef5b5",
    type: "storage-unit",
    group: "aafc",
    name: "Storage Unit Name",
    storageUnitType: {
      id: "61909244-5af7-453c-bc57-99504ed4bec4",
      type: "storage-unit-type",
      group: "aafc",
      name: "Storage Unit Type Name",
      gridLayoutDefinition: {
        fillDirection: "BY_ROW",
        numberOfColumns: 5,
        numberOfRows: 5
      }
    }
  }
};

export const STORAGE_UNIT_USAGE_4: StorageUnitUsage = {
  id: "6cdbf4c8-3d83-45c7-9c54-65830b8e8ca8",
  type: "storage-unit-usage",
  cellNumber: 3,
  wellColumn: 3,
  wellRow: "A",
  storageUnit: {
    id: "2ad75f28-7666-43b9-a1c7-469cc4b7a8e5",
    type: "storage-unit",
    group: "aafc",
    name: "Another Storage Unit Name",
    storageUnitType: {
      id: "61909244-5af7-453c-bc57-99504ed4bec4",
      type: "storage-unit-type",
      group: "aafc",
      name: "Storage Unit Type Name",
      gridLayoutDefinition: {
        fillDirection: "BY_ROW",
        numberOfColumns: 5,
        numberOfRows: 5
      }
    }
  }
};

export const TEST_STORAGE_UNIT_TYPES: PersistedResource<StorageUnitType>[] = [
  {
    id: "e6781d27-ed23-4a7b-b02a-575a14a9c407",
    type: "storage-unit-type",
    group: "aafc",
    name: "Test Storage Unit Type 1",
    gridLayoutDefinition: {
      fillDirection: "BY_ROW",
      numberOfColumns: 5,
      numberOfRows: 5
    }
  },
  {
    id: "1599d01b-cdf0-40ce-a96a-544d8c8cb840",
    type: "storage-unit-type",
    group: "aafc",
    name: "Test Storage Unit Type 2",
    gridLayoutDefinition: {
      fillDirection: "BY_ROW",
      numberOfColumns: 10,
      numberOfRows: 10
    }
  },
  {
    id: "1599d01b-cdf0-40ce-a96a-544d8c8cb840",
    type: "storage-unit-type",
    group: "aafc",
    name: "Test Storage Unit Type 3"
  }
];

export const TEST_MOLECULAR_ANALYSIS_WITHOUT_RUN_ID =
  "6222c981-41ac-42dd-98bc-42350b879721";

export const TEST_MOLECULAR_ANALYSIS_ITEMS_WITHOUT_RUN: PersistedResource<GenericMolecularAnalysisItem>[] =
  [
    {
      id: "99ecc6fc-7378-4641-8914-1b9104e37b95",
      type: "generic-molecular-analysis-item",
      genericMolecularAnalysis: TEST_MOLECULAR_ANALYSIS,
      materialSample: TEST_MATERIAL_SAMPLE_SUMMARY[0],
      storageUnitUsage: {
        id: STORAGE_UNIT_USAGE_1.id ?? "",
        type: "storage-unit-usage"
      }
    },
    {
      id: "169eafe4-44f2-407e-aa90-1a5483edf522",
      type: "generic-molecular-analysis-item",
      genericMolecularAnalysis: TEST_MOLECULAR_ANALYSIS,
      materialSample: TEST_MATERIAL_SAMPLE_SUMMARY[1],
      storageUnitUsage: {
        id: STORAGE_UNIT_USAGE_2.id ?? "",
        type: "storage-unit-usage"
      }
    },
    {
      id: "9df16fe8-8510-4723-8f88-0a6bc0536624",
      type: "generic-molecular-analysis-item",
      genericMolecularAnalysis: TEST_MOLECULAR_ANALYSIS,
      materialSample: TEST_MATERIAL_SAMPLE_SUMMARY[2],
      storageUnitUsage: {
        id: STORAGE_UNIT_USAGE_3.id ?? "",
        type: "storage-unit-usage"
      }
    }
  ];

export const TEST_MOLECULAR_ANALYSIS_WITHOUT_STORAGE_ID =
  "fcb75bec-8c3a-4708-8068-6d5060ef0310";

export const TEST_MOLECULAR_ANALYSIS_ITEMS_WITHOUT_STORAGE: PersistedResource<GenericMolecularAnalysisItem>[] =
  [
    {
      id: "99ecc6fc-7378-4641-8914-1b9104e37b95",
      type: "generic-molecular-analysis-item",
      genericMolecularAnalysis: TEST_MOLECULAR_ANALYSIS,
      materialSample: TEST_MATERIAL_SAMPLE_SUMMARY[0]
    },
    {
      id: "169eafe4-44f2-407e-aa90-1a5483edf522",
      type: "generic-molecular-analysis-item",
      genericMolecularAnalysis: TEST_MOLECULAR_ANALYSIS,
      materialSample: TEST_MATERIAL_SAMPLE_SUMMARY[1]
    },
    {
      id: "9df16fe8-8510-4723-8f88-0a6bc0536624",
      type: "generic-molecular-analysis-item",
      genericMolecularAnalysis: TEST_MOLECULAR_ANALYSIS,
      materialSample: TEST_MATERIAL_SAMPLE_SUMMARY[2]
    }
  ];

export const TEST_MOLECULAR_ANALYSIS_MULTIPLE_RUN_ID =
  "d984b9e0-3247-42df-8b5b-6b71b957cd21";

export const TEST_MOLECULAR_ANALYSIS_ITEMS_MULTIPLE_RUN: PersistedResource<GenericMolecularAnalysisItem>[] =
  [
    {
      id: "99ecc6fc-7378-4641-8914-1b9104e37b95",
      type: "generic-molecular-analysis-item",
      genericMolecularAnalysis: TEST_MOLECULAR_ANALYSIS,
      materialSample: TEST_MATERIAL_SAMPLE_SUMMARY[0],
      molecularAnalysisRunItem: {
        id: "021e1676-2eff-45e5-aed3-1c1b6cfece0a",
        type: "molecular-analysis-run-item",
        usageType: "hrms",
        run: TEST_MOLECULAR_ANALYSIS_RUN
      },
      storageUnitUsage: {
        id: STORAGE_UNIT_USAGE_1.id ?? "",
        type: "storage-unit-usage"
      }
    },
    {
      id: "169eafe4-44f2-407e-aa90-1a5483edf522",
      type: "generic-molecular-analysis-item",
      genericMolecularAnalysis: TEST_MOLECULAR_ANALYSIS,
      materialSample: TEST_MATERIAL_SAMPLE_SUMMARY[1],
      molecularAnalysisRunItem: {
        id: "021e1676-2eff-45e5-aed3-1c1b6cfece0a",
        type: "molecular-analysis-run-item",
        usageType: "hrms",
        run: {
          id: "9ec624c9-8465-4f00-b3d4-1bbab5f1e2f2",
          type: "molecular-analysis-run",
          name: "run-name-2"
        }
      },
      storageUnitUsage: {
        id: STORAGE_UNIT_USAGE_2.id ?? "",
        type: "storage-unit-usage"
      }
    },
    {
      id: "9df16fe8-8510-4723-8f88-0a6bc0536624",
      type: "generic-molecular-analysis-item",
      genericMolecularAnalysis: TEST_MOLECULAR_ANALYSIS,
      materialSample: TEST_MATERIAL_SAMPLE_SUMMARY[2],
      molecularAnalysisRunItem: {
        id: "021e1676-2eff-45e5-aed3-1c1b6cfece0a",
        type: "molecular-analysis-run-item",
        usageType: "hrms",
        run: {
          id: "9ec624c9-8465-4f00-b3d4-1bbab5f1e2f2",
          type: "molecular-analysis-run",
          name: "run-name-2"
        }
      },
      storageUnitUsage: {
        id: STORAGE_UNIT_USAGE_3.id ?? "",
        type: "storage-unit-usage"
      }
    }
  ];

export const TEST_MOLECULAR_ANALYSIS_MULTIPLE_STORAGE_ID =
  "df88f781-6884-455e-9c70-6a303e67a258";

export const TEST_MOLECULAR_ANALYSIS_ITEMS_MULTIPLE_STORAGE: PersistedResource<GenericMolecularAnalysisItem>[] =
  [
    {
      id: "99ecc6fc-7378-4641-8914-1b9104e37b95",
      type: "generic-molecular-analysis-item",
      genericMolecularAnalysis: TEST_MOLECULAR_ANALYSIS,
      materialSample: TEST_MATERIAL_SAMPLE_SUMMARY[0],
      storageUnitUsage: {
        id: STORAGE_UNIT_USAGE_1.id ?? "",
        type: "storage-unit-usage"
      }
    },
    {
      id: "169eafe4-44f2-407e-aa90-1a5483edf522",
      type: "generic-molecular-analysis-item",
      genericMolecularAnalysis: TEST_MOLECULAR_ANALYSIS,
      materialSample: TEST_MATERIAL_SAMPLE_SUMMARY[1],
      storageUnitUsage: {
        id: STORAGE_UNIT_USAGE_2.id ?? "",
        type: "storage-unit-usage"
      }
    },
    {
      id: "9df16fe8-8510-4723-8f88-0a6bc0536624",
      type: "generic-molecular-analysis-item",
      genericMolecularAnalysis: TEST_MOLECULAR_ANALYSIS,
      materialSample: TEST_MATERIAL_SAMPLE_SUMMARY[2],
      storageUnitUsage: {
        id: STORAGE_UNIT_USAGE_4.id ?? "",
        type: "storage-unit-usage"
      }
    }
  ];

export const TEST_MAPPING = {
  attributes: [
    {
      name: "materialSampleName",
      type: "text",
      fields: ["keyword"],
      path: "data.attributes"
    }
  ],
  relationships: [
    {
      referencedBy: "collectingEvent",
      name: "type",
      path: "included",
      value: "collecting-event",
      attributes: [
        {
          name: "dwcOtherRecordNumbers",
          type: "text",
          path: "attributes"
        }
      ]
    }
  ],
  index_name: "dina_material_sample_index"
};

export const TEST_SEARCH_RESPONSE = {
  data: {
    hits: {
      total: {
        relation: "eq",
        value: 3
      },
      hits: [
        {
          _source: {
            data: {
              relationships: {},
              attributes: {
                materialSampleName: "Sample 1"
              },
              id: "01932b12-fa1a-74dc-b70c-453f55f42444",
              type: "material-sample"
            }
          }
        },
        {
          _source: {
            data: {
              relationships: {},
              attributes: {
                materialSampleName: "Sample 2"
              },
              id: "1182ca20-d3df-47e1-b27f-2a9cd9b6074f",
              type: "material-sample"
            }
          }
        },
        {
          _source: {
            data: {
              relationships: {},
              attributes: {
                materialSampleName: "Sample 3"
              },
              id: "239aaf35-9d02-409c-b099-987948cdcd63",
              type: "material-sample"
            }
          }
        }
      ]
    }
  }
};

export const TEST_METADATA: PersistedResource<Metadata> = {
  id: "7f3eccfa-3bc1-412f-9385-bb00e2319ac6",
  type: "metadata",
  createdOn: "2024-12-03T14:56:51.439016Z",
  bucket: "aafc",
  fileIdentifier: "01938d06-12e5-793c-aecf-cadc6b18d6c2",
  fileExtension: ".jpg",
  dcFormat: "image/jpeg",
  dcType: "IMAGE",
  acCaption: "japan.jpg",
  originalFilename: "japan.jpg",
  publiclyReleasable: true,
  group: "aafc"
};

export const TEST_QUALITY_CONTROL_TYPES: PersistedResource<Vocabulary> = {
  id: "qualityControlType",
  type: "vocabulary",
  vocabularyElements: [
    {
      key: "reserpine_standard",
      name: "reserpine standard",
      multilingualTitle: {
        titles: [
          {
            lang: "en",
            title: "Reserpine Standard"
          },
          {
            lang: "fr",
            title: "Standard Reserpine"
          }
        ]
      }
    },
    {
      key: "acn_blank",
      name: "acn blank",
      multilingualTitle: {
        titles: [
          {
            lang: "en",
            title: "ACN Blank"
          },
          {
            lang: "fr",
            title: "ACN Blank (fr)"
          }
        ]
      }
    },
    {
      key: "meoh_blank",
      name: "meoh blank",
      multilingualTitle: {
        titles: [
          {
            lang: "en",
            title: "MEOH Blank"
          },
          {
            lang: "fr",
            title: "MEOH Blank (fr)"
          }
        ]
      }
    }
  ]
};

export const TEST_QUALITY_CONTROL_RUN_ITEMS: PersistedResource<MolecularAnalysisRunItem>[] =
  [
    {
      id: "2a3b15ce-6781-466b-bc1e-49e35af3df58",
      type: "molecular-analysis-run-item",
      createdBy: "dina-admin",
      createdOn: "2024-12-11T20:52:48.43824Z",
      usageType: "quality-control"
    },
    {
      id: "e9e39b72-ece7-454b-893a-2fc2d075e7b7",
      type: "molecular-analysis-run-item",
      createdBy: "dina-admin",
      createdOn: "2024-12-11T20:52:48.43824Z",
      usageType: "quality-control"
    }
  ];

export const TEST_QUALITY_CONTROL_1: PersistedResource<QualityControl>[] = [
  {
    id: "0193b77e-eb54-77c0-84d1-ba64dba0c5e2",
    type: "quality-control",
    createdBy: "dina-admin",
    createdOn: "2024-12-11T20:52:48.562429Z",
    group: "aafc",
    name: "test1",
    qcType: "reserpine_standard",
    molecularAnalysisRunItem: TEST_QUALITY_CONTROL_RUN_ITEMS[0]
  }
];

export const TEST_QUALITY_CONTROL_2: PersistedResource<QualityControl>[] = [
  {
    id: "0193b77e-eb77-7a28-9a0f-a18549bf7df8",
    type: "quality-control",
    createdBy: "dina-admin",
    createdOn: "2024-12-11T20:52:48.562429Z",
    group: "aafc",
    name: "test2",
    qcType: "acn_blank",
    molecularAnalysisRunItem: TEST_QUALITY_CONTROL_RUN_ITEMS[1]
  }
];
