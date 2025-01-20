import { KitsuResource } from "kitsu";
import { Person } from "../../objectstore-api";
import { SequencingFacility } from "./SequencingFacility";

export interface SeqSubmissionAttributes {
  type: "seq-submission";
  group: string;
  name: string;
  createdBy?: string;
  createdOn?: string;
}

export interface SeqSubmissionRelationships {
  submittedBy?: Person;
  sequencingFacility?: SequencingFacility;
}

export type SeqSubmission = KitsuResource &
  SeqSubmissionAttributes &
  SeqSubmissionRelationships;
