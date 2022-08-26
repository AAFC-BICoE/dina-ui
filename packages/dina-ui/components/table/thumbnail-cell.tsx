import { get } from "lodash";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { FileView } from "../object-store";
import { FaExternalLinkAlt } from "react-icons/fa";
import Link from "next/link";

export function thumbnailCell({ fileIdentifierField, bucketField }) {
  return {
    Cell: ({ original }) => {
      const fileIdentifier = get<string | undefined>(
        original?.data?.attributes,
        fileIdentifierField
      );
      const bucket = get<string | undefined>(
        original?.data?.attributes,
        bucketField
      );

      const fileId = `${fileIdentifier}/thumbnail`;
      const filePath = `/api/objectstore-api/file/${bucket}/${fileId}`;
      const resourceExternalURL =
        original?.data?.attributes?.resourceExternalURL;

      return resourceExternalURL ? (
        <div className="d-flex h-100">
          <a href={resourceExternalURL} target="_blank" className="m-auto h5">
            <FaExternalLinkAlt />
          </a>
          <Link
            href={`/object-store/object/external-resource-view?id=${original.id}`}
          >
            <a className="m-auto">
              <DinaMessage id="detailsPageLink" />
            </a>
          </Link>
        </div>
      ) : (
        <SmallThumbnail filePath={filePath} />
      );
    },
    sortable: false,
    Header: <DinaMessage id="thumbnail" />,

    // These fields are required in the elastic search response for this cell to work.
    additionalAccessors: [
      "data.attributes.resourceExternalURL",
      "data.attributes." + fileIdentifierField,
      "data.attributes." + bucketField
    ]
  };
}

function SmallThumbnail({ filePath }) {
  const { formatMessage } = useDinaIntl();

  const height = "5rem";

  return (
    <div style={{ maxHeight: height }}>
      <FileView
        filePath={filePath}
        fileType="jpg"
        imgAlt={formatMessage("thumbnailNotAvailableText")}
        imgHeight={height}
      />
    </div>
  );
}
