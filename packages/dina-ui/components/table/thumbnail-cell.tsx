import { get } from "lodash";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { FileView } from "../object-store";

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

      return <SmallThumbnail filePath={filePath} />;
    },
    sortable: false,
    Header: <DinaMessage id="thumbnail" />
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
