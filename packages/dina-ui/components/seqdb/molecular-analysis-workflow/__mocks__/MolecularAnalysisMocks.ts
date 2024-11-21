import { PersistedResource } from "kitsu";
import {
  MaterialSampleSummary,
  Protocol,
  Vocabulary
} from "packages/dina-ui/types/collection-api";
import { StorageUnitUsage } from "packages/dina-ui/types/collection-api/resources/StorageUnitUsage";
import { GenericMolecularAnalysis } from "packages/dina-ui/types/seqdb-api/resources/GenericMolecularAnalysis";
import { GenericMolecularAnalysisItem } from "packages/dina-ui/types/seqdb-api/resources/GenericMolecularAnalysisItem";
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
        run: {
          id: TEST_MOLECULAR_ANALYSIS_RUN_ID,
          type: "molecular-analysis-run"
        }
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
        run: {
          id: TEST_MOLECULAR_ANALYSIS_RUN_ID,
          type: "molecular-analysis-run"
        }
      },
      storageUnitUsage: {
        id: "be81e29a-b634-43c7-8f1a-53bf394d87f2",
        type: "storage-unit-usage"
      }
    }
  ];

export const STORAGE_UNIT_USAGE_1: StorageUnitUsage = {
  id: "0192fd01-90a6-75a2-a7a3-daf1a4718471",
  type: "storage-unit-usage",
  cellNumber: 1,
  wellColumn: 1,
  wellRow: "A"
};

export const STORAGE_UNIT_USAGE_2: StorageUnitUsage = {
  id: "0192fd01-90c2-7e45-95a2-a5614f68052f",
  type: "storage-unit-usage",
  cellNumber: 2,
  wellColumn: 2,
  wellRow: "A"
};

export const STORAGE_UNIT_USAGE_3: StorageUnitUsage = {
  id: "0192fd01-9104-72fa-a18f-80d97da0c935",
  type: "storage-unit-usage",
  cellNumber: 3,
  wellColumn: 3,
  wellRow: "A"
};

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
