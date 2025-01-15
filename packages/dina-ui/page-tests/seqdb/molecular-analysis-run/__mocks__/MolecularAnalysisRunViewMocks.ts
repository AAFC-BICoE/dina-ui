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

export const TEST_MOLECULAR_ANALYSIS_RUN_ID =
  "b4c78082-61a8-4784-a116-8601f76c85d7";

export const TEST_MOLECULAR_ANALYSIS_RUN: PersistedResource<MolecularAnalysisRun> =
  {
    id: TEST_MOLECULAR_ANALYSIS_RUN_ID,
    type: "molecular-analysis-run",
    name: "Run Name 1",
    attachments: [
      {
        id: "7f3eccfa-3bc1-412f-9385-bb00e2319ac6",
        type: "metadata"
      }
    ]
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
