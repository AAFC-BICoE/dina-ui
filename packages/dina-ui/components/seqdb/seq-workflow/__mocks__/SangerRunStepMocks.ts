import { KitsuResponse, PersistedResource } from "kitsu";
import { MaterialSampleSummary } from "packages/dina-ui/types/collection-api";
import { StorageUnitUsage } from "packages/dina-ui/types/collection-api/resources/StorageUnitUsage";
import { Metadata } from "packages/dina-ui/types/objectstore-api";
import {
  PcrBatchItem,
  SeqBatch,
  SeqReaction
} from "packages/dina-ui/types/seqdb-api";
import { MolecularAnalysisRun } from "packages/dina-ui/types/seqdb-api/resources/molecular-analysis/MolecularAnalysisRun";
import { MolecularAnalysisRunItemUsageType } from "../../../../types/seqdb-api/resources/molecular-analysis/MolecularAnalysisRunItem";

export const TEST_MOLECULAR_ANALYSIS_RUN_ID =
  "00aca736-67c5-4258-9b7c-b3bb3c1f6b58";

export const TEST_MOLECULAR_ANALYSIS_RUN: PersistedResource<MolecularAnalysisRun> =
  {
    id: TEST_MOLECULAR_ANALYSIS_RUN_ID,
    type: "molecular-analysis-run",
    name: "run-name-1",
    attachments: [
      {
        id: "7f3eccfa-3bc1-412f-9385-bb00e2319ac6",
        type: "metadata"
      }
    ]
  };

export const SEQ_BATCH_ID = "d107d371-79cc-4939-9fcc-990cb7089fa4";
export const SEQ_BATCH_ID_MULTIPLE_RUNS =
  "d8a276bd-48b3-4642-a4f6-a6eb974de1e9";
export const SEQ_BATCH_NO_RUNS = "6a6878d1-a4de-4250-9833-d939dc76bee1";

export const SEQ_BATCH: SeqBatch = {
  isCompleted: false,
  id: SEQ_BATCH_ID,
  name: "Test-Seq-Batch",
  type: "seq-batch",
  sequencingType: "Sanger",
  storageUnit: {
    id: "0192fcdf-4274-742c-ad44-978f08532025",
    type: "storage-unit"
  }
};

export const SEQ_REACTIONS_MULTIPLE: KitsuResponse<SeqReaction[], undefined> = {
  data: [
    {
      id: "1c32333c-8a81-4416-ba16-f7c9fd598d86",
      type: "seq-reaction",
      createdBy: "dina-admin",
      createdOn: "2024-11-05T15:43:18.56218Z",
      group: "aafc",
      molecularAnalysisRunItem: {
        id: "d21066cc-c4e3-4263-aeba-8e6bc6badb36",
        type: "molecular-analysis-run-item",
        usageType: MolecularAnalysisRunItemUsageType.SEQ_REACTION,
        createdBy: "dina-admin",
        createdOn: "2024-11-05T15:29:30.230786Z",
        run: {
          type: "molecular-analysis-run",
          id: "ef0963c3-8b6c-4a91-8ce9-1df3b4288425",
          name: "run-name-1"
        }
      },
      storageUnitUsage: {
        id: "0192fd01-90a6-75a2-a7a3-daf1a4718471",
        type: "storage-unit-usage"
      },
      pcrBatchItem: {
        id: "7525c062-4af7-40de-ab16-e643241b215c",
        type: "pcr-batch-item",
        createdBy: "dina-admin",
        createdOn: "2024-11-05T15:29:30.230786Z",
        group: "aafc",
        result: "Good Band"
      },
      seqPrimer: {
        id: "a1a58060-b718-4897-9487-6dbfab49601f",
        type: "PRIMER",
        direction: "R",
        name: "Primer1",
        lotNumber: 1,
        seq: ""
      }
    },
    {
      id: "7fe4fca3-78c9-4373-a1db-a950a80f60cd",
      type: "seq-reaction",
      createdBy: "dina-admin",
      createdOn: "2024-11-05T15:43:18.56218Z",
      group: "aafc",
      molecularAnalysisRunItem: {
        id: "83d21135-51eb-4637-a202-e5b73f7a8ff9",
        type: "molecular-analysis-run-item",
        usageType: MolecularAnalysisRunItemUsageType.SEQ_REACTION,
        createdBy: "dina-admin",
        createdOn: "2024-11-05T15:29:30.230786Z",
        run: {
          type: "molecular-analysis-run",
          id: "a2843cde-d2f3-473c-804d-2a1861f14646",
          name: "run-name-2"
        }
      },
      storageUnitUsage: {
        id: "0192fd01-90c2-7e45-95a2-a5614f68052f",
        type: "storage-unit-usage"
      },
      pcrBatchItem: {
        id: "1ec0b67d-4810-4422-87ef-b521a1c61ed7",
        type: "pcr-batch-item",
        createdBy: "dina-admin",
        createdOn: "2024-11-05T15:29:30.230786Z",
        group: "aafc",
        result: "Good Band"
      },
      seqPrimer: {
        id: "a1a58060-b718-4897-9487-6dbfab49601f",
        type: "PRIMER",
        direction: "R",
        name: "Primer1",
        lotNumber: 1,
        seq: ""
      }
    },
    {
      id: "404c7c59-6210-4f25-8768-87edc3b2b375",
      type: "seq-reaction",
      createdBy: "dina-admin",
      createdOn: "2024-11-05T15:43:18.56218Z",
      group: "aafc",
      molecularAnalysisRunItem: {
        id: "9a836ab0-f0ae-4d6a-aa48-b386ea6af2cf",
        type: "molecular-analysis-run-item",
        usageType: MolecularAnalysisRunItemUsageType.SEQ_REACTION,
        createdBy: "dina-admin",
        createdOn: "2024-11-05T15:29:30.230786Z",
        run: {
          type: "molecular-analysis-run",
          id: "ef0963c3-8b6c-4a91-8ce9-1df3b4288425",
          name: "run-name-1"
        }
      },
      storageUnitUsage: {
        id: "0192fd01-9104-72fa-a18f-80d97da0c935",
        type: "storage-unit-usage"
      },
      pcrBatchItem: {
        id: "792114ca-86ad-46fe-807e-5a115d1a22d8",
        type: "pcr-batch-item",
        createdBy: "dina-admin",
        createdOn: "2024-11-05T15:29:30.230786Z",
        group: "aafc",
        result: "Good Band"
      },
      seqPrimer: {
        id: "a1a58060-b718-4897-9487-6dbfab49601f",
        type: "PRIMER",
        direction: "R",
        name: "Primer1",
        lotNumber: 1,
        seq: ""
      }
    }
  ],
  meta: undefined
};

export const SEQ_REACTIONS: KitsuResponse<SeqReaction[], undefined> = {
  data: [
    {
      id: "1c32333c-8a81-4416-ba16-f7c9fd598d86",
      type: "seq-reaction",
      createdBy: "dina-admin",
      createdOn: "2024-11-05T15:43:18.56218Z",
      group: "aafc",
      molecularAnalysisRunItem: {
        id: "cd8c4d28-586a-45c0-8f27-63030aba07cf",
        type: "molecular-analysis-run-item",
        name: "Provided run item name",
        usageType: MolecularAnalysisRunItemUsageType.SEQ_REACTION,
        createdBy: "dina-admin",
        createdOn: "2024-11-05T15:29:30.230786Z",
        run: TEST_MOLECULAR_ANALYSIS_RUN
      },
      storageUnitUsage: {
        id: "0192fd01-90a6-75a2-a7a3-daf1a4718471",
        type: "storage-unit-usage"
      },
      pcrBatchItem: {
        id: "7525c062-4af7-40de-ab16-e643241b215c",
        type: "pcr-batch-item",
        createdBy: "dina-admin",
        createdOn: "2024-11-05T15:29:30.230786Z",
        group: "aafc",
        result: "Good Band"
      },
      seqPrimer: {
        id: "a1a58060-b718-4897-9487-6dbfab49601f",
        type: "PRIMER",
        direction: "R",
        name: "Primer1",
        lotNumber: 1,
        seq: ""
      }
    },
    {
      id: "7fe4fca3-78c9-4373-a1db-a950a80f60cd",
      type: "seq-reaction",
      createdBy: "dina-admin",
      createdOn: "2024-11-05T15:43:18.56218Z",
      group: "aafc",
      molecularAnalysisRunItem: {
        id: "ce53527e-7794-4c37-91d8-28efff006a56",
        type: "molecular-analysis-run-item",
        usageType: MolecularAnalysisRunItemUsageType.SEQ_REACTION,
        createdBy: "dina-admin",
        createdOn: "2024-11-05T15:29:30.230786Z",
        run: TEST_MOLECULAR_ANALYSIS_RUN
      },
      storageUnitUsage: {
        id: "0192fd01-90c2-7e45-95a2-a5614f68052f",
        type: "storage-unit-usage"
      },
      pcrBatchItem: {
        id: "1ec0b67d-4810-4422-87ef-b521a1c61ed7",
        type: "pcr-batch-item",
        createdBy: "dina-admin",
        createdOn: "2024-11-05T15:29:30.230786Z",
        group: "aafc",
        result: "Good Band"
      },
      seqPrimer: {
        id: "a1a58060-b718-4897-9487-6dbfab49601f",
        type: "PRIMER",
        direction: "R",
        name: "Primer1",
        lotNumber: 1,
        seq: ""
      }
    },
    {
      id: "404c7c59-6210-4f25-8768-87edc3b2b375",
      type: "seq-reaction",
      createdBy: "dina-admin",
      createdOn: "2024-11-05T15:43:18.56218Z",
      group: "aafc",
      molecularAnalysisRunItem: {
        id: "16cf5f0e-24d4-4080-a476-2c97f0adc18e",
        type: "molecular-analysis-run-item",
        usageType: MolecularAnalysisRunItemUsageType.SEQ_REACTION,
        createdBy: "dina-admin",
        createdOn: "2024-11-05T15:29:30.230786Z",
        run: TEST_MOLECULAR_ANALYSIS_RUN
      },
      storageUnitUsage: {
        id: "0192fd01-9104-72fa-a18f-80d97da0c935",
        type: "storage-unit-usage"
      },
      pcrBatchItem: {
        id: "792114ca-86ad-46fe-807e-5a115d1a22d8",
        type: "pcr-batch-item",
        createdBy: "dina-admin",
        createdOn: "2024-11-05T15:29:30.230786Z",
        group: "aafc",
        result: "Good Band"
      },
      seqPrimer: {
        id: "a1a58060-b718-4897-9487-6dbfab49601f",
        type: "PRIMER",
        direction: "R",
        name: "Primer1",
        lotNumber: 1,
        seq: ""
      }
    }
  ],
  meta: undefined
};

export const SEQ_REACTIONS_NO_RUNS: KitsuResponse<SeqReaction[], undefined> = {
  data: [
    {
      id: "1dae4ea0-e705-4d49-95c0-0a51dd047796",
      type: "seq-reaction",
      createdBy: "dina-admin",
      createdOn: "2024-11-05T15:43:18.56218Z",
      group: "aafc",
      storageUnitUsage: {
        id: "0192fd01-90a6-75a2-a7a3-daf1a4718471",
        type: "storage-unit-usage"
      },
      pcrBatchItem: {
        id: "7525c062-4af7-40de-ab16-e643241b215c",
        type: "pcr-batch-item"
      }
    },
    {
      id: "55f2cee7-ebb9-44ac-9a2e-e7c8588567f9",
      type: "seq-reaction",
      createdBy: "dina-admin",
      createdOn: "2024-11-05T15:43:18.56218Z",
      group: "aafc",
      storageUnitUsage: {
        id: "0192fd01-90c2-7e45-95a2-a5614f68052f",
        type: "storage-unit-usage"
      },
      pcrBatchItem: {
        id: "1ec0b67d-4810-4422-87ef-b521a1c61ed7",
        type: "pcr-batch-item"
      },
      seqPrimer: {
        id: "a1a58060-b718-4897-9487-6dbfab49601f",
        type: "PRIMER",
        direction: "R",
        name: "Primer1",
        lotNumber: 1,
        seq: ""
      }
    },
    {
      id: "b5588dd1-ac88-4fd2-a484-2f467d9a6df5",
      type: "seq-reaction",
      createdBy: "dina-admin",
      createdOn: "2024-11-05T15:43:18.56218Z",
      group: "aafc",
      storageUnitUsage: {
        id: "0192fd01-9104-72fa-a18f-80d97da0c935",
        type: "storage-unit-usage"
      },
      pcrBatchItem: {
        id: "792114ca-86ad-46fe-807e-5a115d1a22d8",
        type: "pcr-batch-item",
        createdBy: "dina-admin",
        createdOn: "2024-11-05T15:29:30.230786Z",
        group: "aafc",
        result: "Good Band"
      },
      seqPrimer: {
        id: "a1a58060-b718-4897-9487-6dbfab49601f",
        type: "PRIMER",
        direction: "R",
        name: "Primer1",
        lotNumber: 1,
        seq: ""
      }
    }
  ],
  meta: undefined
};

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

export const PCR_BATCH_ITEM_1: PcrBatchItem = {
  id: "7525c062-4af7-40de-ab16-e643241b215c",
  type: "pcr-batch-item",
  createdBy: "dina-admin",
  createdOn: "2024-11-05T15:29:30.230786Z",
  group: "aafc",
  result: "Good Band",
  materialSample: {
    type: "material-sample",
    id: "f1275d16-10d2-415b-91b8-3cd9c44a77a5"
  }
};

export const PCR_BATCH_ITEM_2: PcrBatchItem = {
  id: "1ec0b67d-4810-4422-87ef-b521a1c61ed7",
  type: "pcr-batch-item",
  createdBy: "dina-admin",
  createdOn: "2024-11-05T15:29:30.230786Z",
  group: "aafc",
  result: "Good Band",
  materialSample: {
    type: "material-sample",
    id: "ddf3c366-55e9-4c2e-8e5f-ea2ed5831cbf"
  }
};

export const PCR_BATCH_ITEM_3: PcrBatchItem = {
  id: "792114ca-86ad-46fe-807e-5a115d1a22d8",
  type: "pcr-batch-item",
  createdBy: "dina-admin",
  createdOn: "2024-11-05T15:29:30.230786Z",
  group: "aafc",
  result: "Good Band",
  materialSample: {
    type: "material-sample",
    id: "2308d337-756d-4714-90bb-57698b6f5819"
  }
};

export const MATERIAL_SAMPLE_SUMMARY_1: MaterialSampleSummary = {
  id: "f1275d16-10d2-415b-91b8-3cd9c44a77a5",
  type: "material-sample-summary",
  materialSampleName: "Sample1"
};

export const MATERIAL_SAMPLE_SUMMARY_2: MaterialSampleSummary = {
  id: "ddf3c366-55e9-4c2e-8e5f-ea2ed5831cbf",
  type: "material-sample-summary",
  materialSampleName: "Sample2"
};

export const MATERIAL_SAMPLE_SUMMARY_3: MaterialSampleSummary = {
  id: "2308d337-756d-4714-90bb-57698b6f5819",
  type: "material-sample-summary",
  materialSampleName: "Sample3"
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
  filename: "japan.jpg",
  publiclyReleasable: true,
  group: "aafc"
};
