import { KitsuResource, PersistedResource } from "kitsu";
import { Person } from "../../agent-api/resources/Person";
import { HasDinaMetaInfo } from "../../DinaJsonMetaInfo";
import { Derivative } from "./Derivative";
import { License } from "./License";
import { DcType, ObjectUpload } from "./ObjectUpload";

export interface MetadataAttributes {
  type: "metadata";
  bucket: string;
  fileIdentifier?: string;
  fileExtension?: string;

  /** Refers to the License/LicenseDTO's 'url' field. */
  xmpRightsWebStatement?: string;
  xmpRightsUsageTerms?: string;
  xmpRightsOwner?: string;

  // Client-side only fields, delete before submitting to back-end
  license?: License;

  // optional fields
  group?: string;
  dcRights?: string;
  acSubtype?: string;
  dcType?: DcType;
  acCaption?: string;
  dcFormat?: string;
  createdOn?: string;
  acDigitizationDate?: string | null;
  xmpMetadataDate?: string;
  acTags?: string[];
  originalFilename?: string;
  filename?: string;
  notPubliclyReleasableReason?: string;
  publiclyReleasable?: boolean;
  orientation?: number;

  sourceSet?: string;

  acHashFunction?: string;
  acHashValue?: string;

  resourceExternalURL?: string;
}

export interface MetadataRelationships {
  acMetadataCreator?: Person | KitsuResource;
  dcCreator?: Person | KitsuResource | null;
  managedAttributes?: Record<string, string | null | undefined>;
  derivatives?:
    | PersistedResource<Derivative & { objectUpload: ObjectUpload }>[]
    | PersistedResource<Derivative>[]
    | null;
}

export type Metadata = KitsuResource &
  MetadataAttributes &
  MetadataRelationships &
  HasDinaMetaInfo;
