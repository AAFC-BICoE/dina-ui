import { PersistedResource } from "kitsu";
import { MolecularAnalysisRun } from "../../../../types/seqdb-api/resources/molecular-analysis/MolecularAnalysisRun";
import { Metadata } from "../../../../types/objectstore-api";
import {
  MaterialSampleSummary,
  Vocabulary
} from "../../../../types/collection-api";
import {
  MolecularAnalysisRunItem,
  MolecularAnalysisRunItemUsageType
} from "../../../../types/seqdb-api/resources/molecular-analysis/MolecularAnalysisRunItem";
import { GenericMolecularAnalysisItem } from "packages/dina-ui/types/seqdb-api/resources/GenericMolecularAnalysisItem";
import { GenericMolecularAnalysis } from "packages/dina-ui/types/seqdb-api/resources/GenericMolecularAnalysis";
import { StorageUnitUsage } from "packages/dina-ui/types/collection-api/resources/StorageUnitUsage";
import { QualityControl } from "packages/dina-ui/types/seqdb-api/resources/QualityControl";
import { MetagenomicsBatchItem } from "packages/dina-ui/types/seqdb-api/resources/metagenomics/MetagenomicsBatchItem";
import { PcrBatchItem, SeqReaction } from "packages/dina-ui/types/seqdb-api";

export const TEST_MOLECULAR_ANALYSIS_RUN_GENRIC_ID =
  "b4c78082-61a8-4784-a116-8601f76c85d7";

export const TEST_MOLECULAR_ANALYSIS_RUN_QUALITY_CONTROL_ID =
  "47260760-21ef-4a2b-a31a-5dd3a0f9edf1";

export const TEST_MOLECULAR_ANALYSIS_RUN_NO_ITEMS_ID =
  "628c1636-f6f4-4a77-ad2f-c9314c3a2575";

export const TEST_METAGENOMICS_BATCH_RUN_ID =
  "cdd1335c-d4f0-4fdf-a55a-0590484444b6";

export const TEST_SEQ_REACTIONS_RUN_ID = "9b4a3e04-1aed-42a4-8982-155cbf093312";

export const TEST_MOLECULAR_ANALYSIS_RUN: PersistedResource<MolecularAnalysisRun> =
  {
    id: TEST_MOLECULAR_ANALYSIS_RUN_GENRIC_ID,
    type: "molecular-analysis-run",
    name: "Run Name 1",
    attachments: [
      {
        id: "7f3eccfa-3bc1-412f-9385-bb00e2319ac6",
        type: "metadata"
      }
    ]
  };

export const TEST_MOLECULAR_ANALYSIS_RUN_QUALITY_CONTROL: PersistedResource<MolecularAnalysisRun> =
  {
    id: TEST_MOLECULAR_ANALYSIS_RUN_QUALITY_CONTROL_ID,
    type: "molecular-analysis-run",
    name: "Quality Control Run Name 1"
  };

export const TEST_MOLECULAR_ANALYSIS_RUN_NO_ITEMS: PersistedResource<MolecularAnalysisRun> =
  {
    id: TEST_MOLECULAR_ANALYSIS_RUN_NO_ITEMS_ID,
    type: "molecular-analysis-run",
    name: "No run items"
  };

export const TEST_METAGENOMICS_BATCH_RUN: PersistedResource<MolecularAnalysisRun> =
  {
    id: TEST_METAGENOMICS_BATCH_RUN_ID,
    type: "molecular-analysis-run",
    name: "Metagenomics Batch Run"
  };

export const TEST_SEQ_REACTION_RUN: PersistedResource<MolecularAnalysisRun> = {
  id: TEST_SEQ_REACTIONS_RUN_ID,
  type: "molecular-analysis-run",
  name: "Seq Reactions Run"
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
  id: "437005b1-1221-4ab3-bd29-62eac0c6b2f9",
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
  id: "67b82b6f-1c16-49ff-995d-07ad7c760d5d",
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

export const TEST_MOLECULAR_ANALYSIS_RUN_ITEMS_GENERIC: PersistedResource<MolecularAnalysisRunItem>[] =
  [
    {
      id: "8b994643-e8e1-48ef-87fa-a9614d3d0d27",
      type: "molecular-analysis-run-item",
      createdBy: "dina-admin",
      createdOn: "2024-12-11T20:52:48.43824Z",
      name: "Run Item 1",
      usageType:
        MolecularAnalysisRunItemUsageType.GENERIC_MOLECULAR_ANALYSIS_ITEM
    },
    {
      id: "c578c258-761e-4d36-b2d4-e895cbb7d6b0",
      type: "molecular-analysis-run-item",
      createdBy: "dina-admin",
      createdOn: "2024-12-11T20:52:48.43824Z",
      name: "Run Item 2",
      usageType:
        MolecularAnalysisRunItemUsageType.GENERIC_MOLECULAR_ANALYSIS_ITEM
    },
    {
      id: "834c44bb-7f0a-46d8-8054-6c1b6e37dad1",
      type: "molecular-analysis-run-item",
      createdBy: "dina-admin",
      createdOn: "2024-12-11T20:52:48.43824Z",
      name: "Run Item 3",
      usageType:
        MolecularAnalysisRunItemUsageType.GENERIC_MOLECULAR_ANALYSIS_ITEM
    }
  ];

export const TEST_MOLECULAR_ANALYSIS_RUN_ITEMS_GENERIC_QUALITY_CONTROL: PersistedResource<MolecularAnalysisRunItem>[] =
  [
    {
      id: "b6b32dce-9cce-4d0b-9992-4a11d1698a02",
      type: "molecular-analysis-run-item",
      createdBy: "dina-admin",
      createdOn: "2024-12-11T20:52:48.43824Z",
      name: "Quality Control Run Item 1",
      usageType: MolecularAnalysisRunItemUsageType.QUALITY_CONTROL
    },
    {
      id: "bb595f7b-996f-440e-91ae-682efafd65e1",
      type: "molecular-analysis-run-item",
      createdBy: "dina-admin",
      createdOn: "2024-12-11T20:52:48.43824Z",
      name: "Quality Control Run Item 2",
      usageType: MolecularAnalysisRunItemUsageType.QUALITY_CONTROL
    },
    {
      id: "668fa5c1-8c9f-4802-a133-21c34fc2a664",
      type: "molecular-analysis-run-item",
      createdBy: "dina-admin",
      createdOn: "2024-12-11T20:52:48.43824Z",
      name: "Quality Control Run Item 3",
      usageType: MolecularAnalysisRunItemUsageType.QUALITY_CONTROL
    }
  ];

export const TEST_MOLECULAR_ANALYSIS_RUN_ITEMS_METAGENOMICS: PersistedResource<MolecularAnalysisRunItem>[] =
  [
    {
      id: "82927bad-da28-4736-8dcd-36fb515b28fe",
      type: "molecular-analysis-run-item",
      createdBy: "dina-admin",
      createdOn: "2024-12-11T20:52:48.43824Z",
      name: "Metagenomic Run Item 1",
      usageType: MolecularAnalysisRunItemUsageType.METAGENOMICS_BATCH_ITEM
    },
    {
      id: "882de68c-b1fd-4f7a-95dd-00d8ad9aef28",
      type: "molecular-analysis-run-item",
      createdBy: "dina-admin",
      createdOn: "2024-12-11T20:52:48.43824Z",
      name: undefined,
      usageType: MolecularAnalysisRunItemUsageType.METAGENOMICS_BATCH_ITEM
    },
    {
      id: "e8a1df84-846a-4bca-86c4-570273dd1c53",
      type: "molecular-analysis-run-item",
      createdBy: "dina-admin",
      createdOn: "2024-12-11T20:52:48.43824Z",
      name: undefined,
      usageType: MolecularAnalysisRunItemUsageType.METAGENOMICS_BATCH_ITEM
    }
  ];

export const TEST_MOLECULAR_ANALYSIS_RUN_ITEMS_SEQ_REACTIONS: PersistedResource<MolecularAnalysisRunItem>[] =
  [
    {
      id: "70106e74-1218-41a7-bb51-8b0b41d31197",
      type: "molecular-analysis-run-item",
      createdBy: "dina-admin",
      createdOn: "2024-12-11T20:52:48.43824Z",
      name: "Seq Reaction Run Item 1",
      usageType: MolecularAnalysisRunItemUsageType.SEQ_REACTION
    },
    {
      id: "41d6ec20-f81f-4b4f-a37f-71265544484e",
      type: "molecular-analysis-run-item",
      createdBy: "dina-admin",
      createdOn: "2024-12-11T20:52:48.43824Z",
      name: "Seq Reaction Run Item 2",
      usageType: MolecularAnalysisRunItemUsageType.SEQ_REACTION
    },
    {
      id: "6c1a6afe-6ad8-4dfc-9a2f-26a23cda108a",
      type: "molecular-analysis-run-item",
      createdBy: "dina-admin",
      createdOn: "2024-12-11T20:52:48.43824Z",
      name: "Seq Reaction Run Item 3",
      usageType: MolecularAnalysisRunItemUsageType.SEQ_REACTION
    }
  ];

export const QUALITY_CONTROL_1: PersistedResource<QualityControl> = {
  id: "5c07075e-e686-4546-8545-20cf7e867c61",
  type: "quality-control",
  group: "aafc",
  name: "Quality Control 1",
  qcType: "reserpine_standard",
  molecularAnalysisRunItem:
    TEST_MOLECULAR_ANALYSIS_RUN_ITEMS_GENERIC_QUALITY_CONTROL[0]
};

export const QUALITY_CONTROL_2: PersistedResource<QualityControl> = {
  id: "10d2dc14-9726-4943-84ad-817d8e93f124",
  type: "quality-control",
  group: "aafc",
  name: "Quality Control 2",
  qcType: "acn_blank",
  molecularAnalysisRunItem:
    TEST_MOLECULAR_ANALYSIS_RUN_ITEMS_GENERIC_QUALITY_CONTROL[1]
};

export const QUALITY_CONTROL_3: PersistedResource<QualityControl> = {
  id: "f6c92ce3-6f35-4c62-ad21-8c06dd74ad69",
  type: "quality-control",
  group: "aafc",
  name: "Quality Control 3",
  qcType: "meoh_blank",
  molecularAnalysisRunItem:
    TEST_MOLECULAR_ANALYSIS_RUN_ITEMS_GENERIC_QUALITY_CONTROL[2]
};

export const TEST_MOLECULAR_ANALYSIS: PersistedResource<GenericMolecularAnalysis> =
  {
    id: "d1e4a8b0-c6d5-4e23-9b30-0ae8d8763f2b",
    type: "generic-molecular-analysis",
    name: "generic molecular analysis",
    analysisType: "hrms",
    group: "aafc"
  };

export const TEST_GENERIC_MOLECULAR_ANALYSIS_ITEMS: PersistedResource<GenericMolecularAnalysisItem>[] =
  [
    {
      id: "99ecc6fc-7378-4641-8914-1b9104e37b95",
      type: "generic-molecular-analysis-item",
      genericMolecularAnalysis: TEST_MOLECULAR_ANALYSIS,
      materialSample: TEST_MATERIAL_SAMPLE_SUMMARY[0],
      molecularAnalysisRunItem: TEST_MOLECULAR_ANALYSIS_RUN_ITEMS_GENERIC[0],
      storageUnitUsage: {
        id: STORAGE_UNIT_USAGE_1.id ?? "",
        type: "storage-unit-usage"
      }
    },
    {
      id: "923001e4-d0fa-44eb-ac8d-8fc0cad89aa9",
      type: "generic-molecular-analysis-item",
      genericMolecularAnalysis: TEST_MOLECULAR_ANALYSIS,
      materialSample: TEST_MATERIAL_SAMPLE_SUMMARY[1],
      molecularAnalysisRunItem: TEST_MOLECULAR_ANALYSIS_RUN_ITEMS_GENERIC[1],
      storageUnitUsage: {
        id: STORAGE_UNIT_USAGE_2.id ?? "",
        type: "storage-unit-usage"
      }
    },
    {
      id: "9228588a-8c1e-462a-a4d9-4656319dd63c",
      type: "generic-molecular-analysis-item",
      genericMolecularAnalysis: TEST_MOLECULAR_ANALYSIS,
      materialSample: TEST_MATERIAL_SAMPLE_SUMMARY[2],
      molecularAnalysisRunItem: TEST_MOLECULAR_ANALYSIS_RUN_ITEMS_GENERIC[2],
      storageUnitUsage: {
        id: STORAGE_UNIT_USAGE_3.id ?? "",
        type: "storage-unit-usage"
      }
    }
  ];

export const TEST_PCR_BATCH_ITEMS: PcrBatchItem[] = [
  {
    id: "562fa9f6-25d9-48a1-ae1d-7e862ae4aed7",
    type: "pcr-batch-item",
    group: "aafc",
    result: "Good Band",
    materialSample: {
      id: TEST_MATERIAL_SAMPLE_SUMMARY[0].id,
      type: "material-sample"
    },
    storageUnitUsage: {
      id: STORAGE_UNIT_USAGE_1.id ?? "",
      type: "storage-unit-usage"
    }
  },
  {
    id: "6e2c1099-2c27-4f62-94e1-9129d34e6d3a",
    type: "pcr-batch-item",
    group: "aafc",
    result: "Good Band",
    materialSample: {
      id: TEST_MATERIAL_SAMPLE_SUMMARY[1].id,
      type: "material-sample"
    },
    storageUnitUsage: {
      id: STORAGE_UNIT_USAGE_2.id ?? "",
      type: "storage-unit-usage"
    }
  },
  {
    id: "d1388a53-27ec-4df3-945c-abb7058d383a",
    type: "pcr-batch-item",
    group: "aafc",
    result: "Good Band",
    materialSample: {
      id: TEST_MATERIAL_SAMPLE_SUMMARY[2].id,
      type: "material-sample"
    },
    storageUnitUsage: {
      id: STORAGE_UNIT_USAGE_3.id ?? "",
      type: "storage-unit-usage"
    }
  }
];

export const TEST_METAGENOMIC_MOLECULAR_ANALYSIS_ITEMS: PersistedResource<MetagenomicsBatchItem>[] =
  [
    {
      id: "7de1c19c-6016-4e51-973c-f76e21385f72",
      type: "metagenomics-batch-item",
      pcrBatchItem: TEST_PCR_BATCH_ITEMS[0] as any
    },
    {
      id: "120cf8dd-9009-4a1b-b27a-c766095418f9",
      type: "metagenomics-batch-item",
      pcrBatchItem: TEST_PCR_BATCH_ITEMS[1] as any
    },
    {
      id: "f3152f83-4aa9-40d5-a88f-099dad53dd76",
      type: "metagenomics-batch-item",
      pcrBatchItem: TEST_PCR_BATCH_ITEMS[2] as any
    }
  ];

export const TEST_SEQ_REACTION_MOLECULAR_ANALYSIS_ITEMS: PersistedResource<SeqReaction>[] =
  [
    {
      id: "f8a95f23-e004-422d-8a2a-5d1cc8160371",
      type: "seq-reaction",
      molecularAnalysisRunItem:
        TEST_MOLECULAR_ANALYSIS_RUN_ITEMS_SEQ_REACTIONS[0],
      pcrBatchItem: TEST_PCR_BATCH_ITEMS[0] as any,
      storageUnitUsage: STORAGE_UNIT_USAGE_1 as any
    },
    {
      id: "cd73c561-098f-4068-84f8-48b5bc9e5300",
      type: "seq-reaction",
      molecularAnalysisRunItem:
        TEST_MOLECULAR_ANALYSIS_RUN_ITEMS_SEQ_REACTIONS[1],
      pcrBatchItem: TEST_PCR_BATCH_ITEMS[1] as any,
      storageUnitUsage: STORAGE_UNIT_USAGE_2 as any
    },
    {
      id: "e0f49fe6-aa2c-4265-b4f7-88724ed7802f",
      type: "seq-reaction",
      molecularAnalysisRunItem:
        TEST_MOLECULAR_ANALYSIS_RUN_ITEMS_SEQ_REACTIONS[2],
      pcrBatchItem: TEST_PCR_BATCH_ITEMS[2] as any,
      storageUnitUsage: STORAGE_UNIT_USAGE_3 as any
    }
  ];

export const TEST_QUALITY_CONTROL_TYPES: PersistedResource<Vocabulary> = {
  id: "qualityControlType",
  type: "vocabulary",
  vocabularyElements: [
    {
      key: "reserpine_standard",
      name: "reserpine standard",
      multilingualTitle: {
        titles: [{ lang: "en", title: "Reserpine Standard" }]
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
          }
        ]
      }
    }
  ]
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
