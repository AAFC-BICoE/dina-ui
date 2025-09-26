import { InputResource } from "kitsu";
import { DcType, Metadata } from "packages/dina-ui/types/objectstore-api";

// -- Metadata Mocks --

export const BUCKET: string = "aafc";

export const DC_TYPE: DcType = "IMAGE";

export const DC_RIGHTS: string =
  "© His Majesty The King in Right of Canada, as represented by the Minister of Agriculture and Agri-Food | © Sa Majesté le Roi du chef du Canada, représentée par le ministre de l’Agriculture et de l’Agroalimentaire";

export const LICENSE: any = {
  id: "open-government-licence-canada",
  type: "license",
  titles: {
    en: "Open Government License - Canada",
    fr: "Licence du gouvernement ouvert – Canada"
  },
  url: "https://open.canada.ca/en/open-government-licence-canada"
};

export const XMP_RIGHTS_OWNER: string = "Government of Canada";
export const XMP_RIGHTS_USAGE_TERMS: string = "Government of Canada Usage Term";
export const XMP_RIGHTS_WEB_STATEMENT: string =
  "https://open.canada.ca/en/open-government-licence-canada";

// Metadata without IDs:
export const TEST_NEW_METADATA: InputResource<Metadata>[] = [
  {
    type: "metadata",
    acCaption: "upload1.jpg",
    originalFilename: "upload1.jpg",
    acMetadataCreator: {
      id: "ac-metadata-creator-id",
      type: "person"
    },
    bucket: BUCKET,
    dcRights: DC_RIGHTS,
    dcType: DC_TYPE,
    fileIdentifier: "upload-fileidentifier-1",
    license: LICENSE,
    xmpRightsOwner: XMP_RIGHTS_OWNER,
    xmpRightsUsageTerms: XMP_RIGHTS_USAGE_TERMS,
    xmpRightsWebStatement: XMP_RIGHTS_WEB_STATEMENT
  },
  {
    type: "metadata",
    acCaption: "upload2.jpg",
    originalFilename: "upload2.jpg",
    acMetadataCreator: {
      id: "ac-metadata-creator-id",
      type: "person"
    },
    bucket: BUCKET,
    dcRights: DC_RIGHTS,
    dcType: DC_TYPE,
    fileIdentifier: "upload-fileidentifier-2",
    license: LICENSE,
    xmpRightsOwner: XMP_RIGHTS_OWNER,
    xmpRightsUsageTerms: XMP_RIGHTS_USAGE_TERMS,
    xmpRightsWebStatement: XMP_RIGHTS_WEB_STATEMENT
  },
  {
    type: "metadata",
    acCaption: "upload3.jpg",
    originalFilename: "upload3.jpg",
    acMetadataCreator: {
      id: "ac-metadata-creator-id",
      type: "person"
    },
    bucket: BUCKET,
    dcRights: DC_RIGHTS,
    dcType: DC_TYPE,
    fileIdentifier: "upload-fileidentifier-3",
    license: LICENSE,
    xmpRightsOwner: XMP_RIGHTS_OWNER,
    xmpRightsUsageTerms: XMP_RIGHTS_USAGE_TERMS,
    xmpRightsWebStatement: XMP_RIGHTS_WEB_STATEMENT
  }
];

// -- Object Subtype --
export const TEST_OBJECT_SUBTYPE_DATA: any = {
  id: "object-subtype-1",
  type: "object-subtype",
  attributes: {
    dcType: "IMAGE",
    acSubtype: "TEST_IMAGE_SUBTYPE",
    createdBy: "dina-admin",
    createdOn: "2025-09-26T14:40:56.611684Z"
  }
};
