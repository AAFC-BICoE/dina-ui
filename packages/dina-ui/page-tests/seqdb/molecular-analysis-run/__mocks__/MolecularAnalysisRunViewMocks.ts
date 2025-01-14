import { PersistedResource } from "kitsu";
import { MolecularAnalysisRun } from "../../../../types/seqdb-api/resources/molecular-analysis/MolecularAnalysisRun";
import { Metadata } from "../../../../types/objectstore-api";

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
