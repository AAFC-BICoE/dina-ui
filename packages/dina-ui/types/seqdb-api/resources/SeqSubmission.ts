import { KitsuResource, PersistedResource } from "kitsu";
import { baseRelationshipParser } from "../../baseRelationshipParser";
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
  submittedBy?: Person | null;
  sequencingFacility?: SequencingFacility | null;
}

export type SeqSubmission = KitsuResource &
  SeqSubmissionAttributes &
  SeqSubmissionRelationships;

// Response types (what comes from API)
export interface SeqSubmissionResponseAttributes {
  type: "seq-submission";
  group: string;
  name: string;
  createdBy?: string;
  createdOn?: string;
}

export interface SeqSubmissionResponseRelationships {
  submittedBy?: {
    data?: PersistedResource<Person>;
  };
  sequencingFacility?: {
    data?: PersistedResource<SequencingFacility>;
  };
}

export type SeqSubmissionResponse = KitsuResource &
  SeqSubmissionResponseAttributes &
  SeqSubmissionResponseRelationships;

/**
 * Parses a `PersistedResource<SeqSubmissionResponse>` object and transforms it into a `PersistedResource<SeqSubmission>`.
 *
 * This function omits specific relationship properties from the input sequencing submission and restructures the relationships
 * to use their `.data` subfields as their values.
 *
 * @param data - The response.data object to parse, of type `PersistedResource<SeqSubmissionResponse>`.
 * @returns The parsed sequencing submission resource, of type `PersistedResource<SeqSubmission>`.
 */
export function seqSubmissionParser(
  data: PersistedResource<SeqSubmissionResponse>
): PersistedResource<SeqSubmission> {
  const parsedSeqSubmission = baseRelationshipParser(
    ["submittedBy", "sequencingFacility"],
    data
  ) as PersistedResource<SeqSubmission>;

  return parsedSeqSubmission;
}
