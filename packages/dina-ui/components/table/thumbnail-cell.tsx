import { KitsuResource } from "kitsu";
import Link from "next/link";
import { TableColumn } from "packages/common-ui/lib/list-page/types";
import { FaExternalLinkAlt } from "react-icons/fa";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { FileView } from "../object-store";
import { useMetadataThumbnailPath } from "../object-store/metadata/useMetadataThumbnailPath";

export interface ThumbnailCellProps {
  bucketField: string;
  isJsonApiQuery?: boolean;
}

export function ThumbnailCell<TData extends KitsuResource>({
  bucketField,
  isJsonApiQuery
}: ThumbnailCellProps): TableColumn<TData> {
  return {
    id: "thumbnail",
    cell: ({ row: { original } }) => {
      const {
        resourceExternalURL,
        hasExternalResourceDerivative,
        filePath,
        altImage
      } = useMetadataThumbnailPath<TData>(
        original,
        bucketField,
        isJsonApiQuery
      );
      return resourceExternalURL ? (
        <div className="d-flex h-100">
          {hasExternalResourceDerivative ? (
            <FaExternalLinkAlt className="m-auto me-2 h5" />
          ) : (
            <Link
              href={resourceExternalURL}
              passHref={true}
              target="_blank"
              className="m-auto h5"
            >
              <FaExternalLinkAlt />
            </Link>
          )}
          {hasExternalResourceDerivative && (
            <SmallThumbnail filePath={filePath} altImage={altImage} />
          )}
          <Link
            href={`/object-store/object/external-resource-view?id=${original?.id}`}
            className="m-auto"
          >
            <DinaMessage id="detailsPageLink" />
          </Link>
        </div>
      ) : (
        <SmallThumbnail filePath={filePath} altImage={altImage} />
      );
    },
    enableSorting: false,
    header: () => <DinaMessage id="thumbnail" />,
    // These fields are required in the elastic search response for this cell to work.
    additionalAccessors: [
      "included.attributes.fileIdentifier",
      "included.attributes.derivativeType",
      "data.attributes.resourceExternalURL",
      "data.relationships.derivatives",
      bucketField
    ]
  };
}

export interface SmallThumbnailProps {
  filePath: string;
  altImage?: string;
}

export function SmallThumbnail({ filePath, altImage }: SmallThumbnailProps) {
  const { formatMessage } = useDinaIntl();

  return (
    <div style={{ maxWidth: "250px" }}>
      <FileView
        filePath={filePath}
        fileType="jpg"
        imgAlt={
          altImage ? altImage : formatMessage("thumbnailNotAvailableText")
        }
        imgHeight="5rem"
      />
    </div>
  );
}
