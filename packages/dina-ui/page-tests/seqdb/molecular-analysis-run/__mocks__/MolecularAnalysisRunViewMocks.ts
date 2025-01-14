import { PersistedResource } from "kitsu";
import { MolecularAnalysisRun } from "../../../../types/seqdb-api/resources/molecular-analysis/MolecularAnalysisRun";
import { Metadata } from "../../../../types/objectstore-api";
import { Vocabulary } from "../../../../types/collection-api";
import {
  MolecularAnalysisRunItem,
  MolecularAnalysisRunItemUsageType
} from "../../../../types/seqdb-api/resources/molecular-analysis/MolecularAnalysisRunItem";

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
      id: "c578c258-761e-4d36-b2d4-e895cbb7d6b0",
      type: "molecular-analysis-run-item",
      createdBy: "dina-admin",
      createdOn: "2024-12-11T20:52:48.43824Z",
      name: "Run Item 3",
      usageType:
        MolecularAnalysisRunItemUsageType.GENERIC_MOLECULAR_ANALYSIS_ITEM
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
