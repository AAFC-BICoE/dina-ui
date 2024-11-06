import { StorageUnitUsage } from "packages/dina-ui/types/collection-api/resources/StorageUnitUsage";
import { MolecularAnalysisRunItem } from "packages/dina-ui/types/seqdb-api/resources/MolecularAnalysisRunItem";

export const SEQ_REACTIONS_MULTIPLE = {
  data: [
    {
      id: "1c32333c-8a81-4416-ba16-f7c9fd598d86",
      type: "seq-reaction",
      attributes: {
        createdBy: "dina-admin",
        createdOn: "2024-11-05T15:43:18.56218Z",
        group: "aafc"
      },
      relationships: {
        molecularAnalysisRunItem: {
          data: {
            id: "d21066cc-c4e3-4263-aeba-8e6bc6badb36",
            type: "molecular-analysis-run-item"
          }
        },
        storageUnitUsage: {
          data: {
            id: "0192fd01-90a6-75a2-a7a3-daf1a4718471",
            type: "storage-unit-usage"
          }
        },
        pcrBatchItem: {
          data: {
            id: "7525c062-4af7-40de-ab16-e643241b215c",
            type: "pcr-batch-item"
          }
        }
      }
    },
    {
      id: "7fe4fca3-78c9-4373-a1db-a950a80f60cd",
      type: "seq-reaction",
      attributes: {
        createdBy: "dina-admin",
        createdOn: "2024-11-05T15:43:18.56218Z",
        group: "aafc"
      },
      relationships: {
        molecularAnalysisRunItem: {
          data: {
            id: "83d21135-51eb-4637-a202-e5b73f7a8ff9",
            type: "molecular-analysis-run-item"
          }
        },
        storageUnitUsage: {
          data: {
            id: "0192fd01-90c2-7e45-95a2-a5614f68052f",
            type: "storage-unit-usage"
          }
        },
        pcrBatchItem: {
          data: {
            id: "1ec0b67d-4810-4422-87ef-b521a1c61ed7",
            type: "pcr-batch-item"
          }
        }
      }
    },
    {
      id: "404c7c59-6210-4f25-8768-87edc3b2b375",
      type: "seq-reaction",
      attributes: {
        createdBy: "dina-admin",
        createdOn: "2024-11-05T15:43:18.56218Z",
        group: "aafc"
      },
      relationships: {
        molecularAnalysisRunItem: {
          data: {
            id: "9a836ab0-f0ae-4d6a-aa48-b386ea6af2cf",
            type: "molecular-analysis-run-item"
          }
        },
        storageUnitUsage: {
          data: {
            id: "0192fd01-9104-72fa-a18f-80d97da0c935",
            type: "storage-unit-usage"
          }
        },
        pcrBatchItem: {
          data: {
            id: "792114ca-86ad-46fe-807e-5a115d1a22d8",
            type: "pcr-batch-item"
          }
        }
      }
    }
  ],
  included: [
    {
      id: "1ec0b67d-4810-4422-87ef-b521a1c61ed7",
      type: "pcr-batch-item",
      attributes: {
        createdBy: "dina-admin",
        createdOn: "2024-11-05T15:29:30.230786Z",
        group: "aafc",
        result: "Good Band"
      }
    },
    {
      id: "7525c062-4af7-40de-ab16-e643241b215c",
      type: "pcr-batch-item",
      attributes: {
        createdBy: "dina-admin",
        createdOn: "2024-11-05T15:29:30.230786Z",
        group: "aafc",
        result: "Good Band"
      }
    },
    {
      id: "792114ca-86ad-46fe-807e-5a115d1a22d8",
      type: "pcr-batch-item",
      attributes: {
        createdBy: "dina-admin",
        createdOn: "2024-11-05T15:29:30.230786Z",
        group: "aafc",
        result: "Good Band"
      }
    },
    {
      id: "0192fd01-90a6-75a2-a7a3-daf1a4718471",
      type: "storage-unit-usage"
    },
    {
      id: "0192fd01-90c2-7e45-95a2-a5614f68052f",
      type: "storage-unit-usage"
    },
    {
      id: "0192fd01-9104-72fa-a18f-80d97da0c935",
      type: "storage-unit-usage"
    },
    {
      id: "d21066cc-c4e3-4263-aeba-8e6bc6badb36",
      type: "molecular-analysis-run-item",
      attributes: {
        createdBy: "dina-admin",
        createdOn: "2024-11-05T15:29:30.230786Z"
      }
    },
    {
      id: "83d21135-51eb-4637-a202-e5b73f7a8ff9",
      type: "molecular-analysis-run-item",
      attributes: {
        createdBy: "dina-admin",
        createdOn: "2024-11-05T15:29:30.230786Z"
      }
    },
    {
      id: "9a836ab0-f0ae-4d6a-aa48-b386ea6af2cf",
      type: "molecular-analysis-run-item",
      attributes: {
        createdBy: "dina-admin",
        createdOn: "2024-11-05T15:29:30.230786Z"
      }
    }
  ]
};

export const SEQ_REACTIONS = {
  data: [
    {
      id: "1c32333c-8a81-4416-ba16-f7c9fd598d86",
      type: "seq-reaction",
      attributes: {
        createdBy: "dina-admin",
        createdOn: "2024-11-05T15:43:18.56218Z",
        group: "aafc"
      },
      relationships: {
        molecularAnalysisRunItem: {
          data: {
            id: "cd8c4d28-586a-45c0-8f27-63030aba07cf",
            type: "molecular-analysis-run-item"
          }
        },
        storageUnitUsage: {
          data: {
            id: "0192fd01-90a6-75a2-a7a3-daf1a4718471",
            type: "storage-unit-usage"
          }
        },
        pcrBatchItem: {
          data: {
            id: "7525c062-4af7-40de-ab16-e643241b215c",
            type: "pcr-batch-item"
          }
        }
      }
    },
    {
      id: "7fe4fca3-78c9-4373-a1db-a950a80f60cd",
      type: "seq-reaction",
      attributes: {
        createdBy: "dina-admin",
        createdOn: "2024-11-05T15:43:18.56218Z",
        group: "aafc"
      },
      relationships: {
        molecularAnalysisRunItem: {
          data: {
            id: "ce53527e-7794-4c37-91d8-28efff006a56",
            type: "molecular-analysis-run-item"
          }
        },
        storageUnitUsage: {
          data: {
            id: "0192fd01-90c2-7e45-95a2-a5614f68052f",
            type: "storage-unit-usage"
          }
        },
        pcrBatchItem: {
          data: {
            id: "1ec0b67d-4810-4422-87ef-b521a1c61ed7",
            type: "pcr-batch-item"
          }
        }
      }
    },
    {
      id: "404c7c59-6210-4f25-8768-87edc3b2b375",
      type: "seq-reaction",
      attributes: {
        createdBy: "dina-admin",
        createdOn: "2024-11-05T15:43:18.56218Z",
        group: "aafc"
      },
      relationships: {
        molecularAnalysisRunItem: {
          data: {
            id: "16cf5f0e-24d4-4080-a476-2c97f0adc18e",
            type: "molecular-analysis-run-item"
          }
        },
        storageUnitUsage: {
          data: {
            id: "0192fd01-9104-72fa-a18f-80d97da0c935",
            type: "storage-unit-usage"
          }
        },
        pcrBatchItem: {
          data: {
            id: "792114ca-86ad-46fe-807e-5a115d1a22d8",
            type: "pcr-batch-item"
          }
        }
      }
    }
  ],
  included: [
    {
      id: "1ec0b67d-4810-4422-87ef-b521a1c61ed7",
      type: "pcr-batch-item",
      attributes: {
        createdBy: "dina-admin",
        createdOn: "2024-11-05T15:29:30.230786Z",
        group: "aafc",
        result: "Good Band"
      }
    },
    {
      id: "7525c062-4af7-40de-ab16-e643241b215c",
      type: "pcr-batch-item",
      attributes: {
        createdBy: "dina-admin",
        createdOn: "2024-11-05T15:29:30.230786Z",
        group: "aafc",
        result: "Good Band"
      }
    },
    {
      id: "792114ca-86ad-46fe-807e-5a115d1a22d8",
      type: "pcr-batch-item",
      attributes: {
        createdBy: "dina-admin",
        createdOn: "2024-11-05T15:29:30.230786Z",
        group: "aafc",
        result: "Good Band"
      }
    },
    {
      id: "0192fd01-90a6-75a2-a7a3-daf1a4718471",
      type: "storage-unit-usage"
    },
    {
      id: "0192fd01-90c2-7e45-95a2-a5614f68052f",
      type: "storage-unit-usage"
    },
    {
      id: "0192fd01-9104-72fa-a18f-80d97da0c935",
      type: "storage-unit-usage"
    },
    {
      id: "cd8c4d28-586a-45c0-8f27-63030aba07cf",
      type: "molecular-analysis-run-item",
      attributes: {
        createdBy: "dina-admin",
        createdOn: "2024-11-05T15:29:30.230786Z"
      }
    },
    {
      id: "ce53527e-7794-4c37-91d8-28efff006a56",
      type: "molecular-analysis-run-item",
      attributes: {
        createdBy: "dina-admin",
        createdOn: "2024-11-05T15:29:30.230786Z"
      }
    },
    {
      id: "16cf5f0e-24d4-4080-a476-2c97f0adc18e",
      type: "molecular-analysis-run-item",
      attributes: {
        createdBy: "dina-admin",
        createdOn: "2024-11-05T15:29:30.230786Z"
      }
    }
  ]
};

export const MOLECULAR_ANALYIS_RUN_ITEM_MULTIPLE_1: MolecularAnalysisRunItem = {
  id: "d21066cc-c4e3-4263-aeba-8e6bc6badb36",
  type: "molecular-analysis-run-item",
  run: {
    type: "molecular-analysis-run",
    id: "ef0963c3-8b6c-4a91-8ce9-1df3b4288425",
    name: "run-name-1"
  }
};

export const MOLECULAR_ANALYIS_RUN_ITEM_MULTIPLE_2: MolecularAnalysisRunItem = {
  id: "83d21135-51eb-4637-a202-e5b73f7a8ff9",
  type: "molecular-analysis-run-item",
  run: {
    type: "molecular-analysis-run",
    id: "a2843cde-d2f3-473c-804d-2a1861f14646",
    name: "run-name-2"
  }
};

export const MOLECULAR_ANALYIS_RUN_ITEM_MULTIPLE_3: MolecularAnalysisRunItem = {
  id: "9a836ab0-f0ae-4d6a-aa48-b386ea6af2cf",
  type: "molecular-analysis-run-item",
  run: {
    type: "molecular-analysis-run",
    id: "ef0963c3-8b6c-4a91-8ce9-1df3b4288425",
    name: "run-name-1"
  }
};

export const MOLECULAR_ANALYIS_RUN_ITEM_1: MolecularAnalysisRunItem = {
  id: "cd8c4d28-586a-45c0-8f27-63030aba07cf",
  type: "molecular-analysis-run-item",
  run: {
    type: "molecular-analysis-run",
    id: "00aca736-67c5-4258-9b7c-b3bb3c1f6b58",
    name: "run-name-1"
  }
};

export const MOLECULAR_ANALYIS_RUN_ITEM_2: MolecularAnalysisRunItem = {
  id: "ce53527e-7794-4c37-91d8-28efff006a56",
  type: "molecular-analysis-run-item",
  run: {
    type: "molecular-analysis-run",
    id: "00aca736-67c5-4258-9b7c-b3bb3c1f6b58",
    name: "run-name-1"
  }
};

export const MOLECULAR_ANALYIS_RUN_ITEM_3: MolecularAnalysisRunItem = {
  id: "16cf5f0e-24d4-4080-a476-2c97f0adc18e",
  type: "molecular-analysis-run-item",
  run: {
    type: "molecular-analysis-run",
    id: "00aca736-67c5-4258-9b7c-b3bb3c1f6b58",
    name: "run-name-1"
  }
};

export const STORAGE_UNIT_USAGE_1: StorageUnitUsage = {
  id: "0192fd01-90a6-75a2-a7a3-daf1a4718471",
  type: "storage-unit-usage",
  cellNumber: 0,
  wellColumn: 1,
  wellRow: "A"
};

export const STORAGE_UNIT_USAGE_2: StorageUnitUsage = {
  id: "0192fd01-90c2-7e45-95a2-a5614f68052f",
  type: "storage-unit-usage",
  cellNumber: 1,
  wellColumn: 2,
  wellRow: "A"
};

export const STORAGE_UNIT_USAGE_3: StorageUnitUsage = {
  id: "0192fd01-9104-72fa-a18f-80d97da0c935",
  type: "storage-unit-usage",
  cellNumber: 2,
  wellColumn: 3,
  wellRow: "A"
};
