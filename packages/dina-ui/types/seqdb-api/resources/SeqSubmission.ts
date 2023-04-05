import { KitsuResource } from "kitsu";
import { Person } from "../../objectstore-api";
import { SeqBatch } from "./SeqBatch";

export interface SeqSubmissionAttributes {
  type: "seq-submission";
  group: string;
  name: string;
  createdBy?: string;
  createdOn?: string;
}

export interface SeqSubmissionRelationships {
  seqBatch?: SeqBatch;
  submittedBy?: Person;
}

export type SeqSubmission = KitsuResource &
  SeqSubmissionAttributes &
  SeqSubmissionRelationships;
