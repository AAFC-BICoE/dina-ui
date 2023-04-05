import { KitsuResource } from "kitsu";
import { Person } from "../../objectstore-api";
import { PcrBatch } from "./PcrBatch";

export interface SeqSubmissionAttributes {
  type: "seq-submission";
  group: string;
  name: string;
  createdBy?: string;
  createdOn?: string;
}

export interface SeqSubmissionRelationships {
  pcrBatch?: PcrBatch;
  submittedBy?: Person;
}

export type SeqSubmission = KitsuResource &
  SeqSubmissionAttributes &
  SeqSubmissionRelationships;
