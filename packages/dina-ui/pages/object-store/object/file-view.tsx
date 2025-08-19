import { LoadingSpinner } from "common-ui";
import { useRouter } from "next/router";
import { useMetadataViewQuery } from "../../../components/object-store/metadata/useMetadata";
import { useBlobLoad } from "common-ui";
import { DinaMessage } from "../../../intl/dina-ui-intl";
export default function ImageViewer() {
  const router = useRouter();
  const uuid = String(router.query.id);
  const query = useMetadataViewQuery(uuid);

  const fileUrl =
    query && query.response
      ? `/objectstore-api/file/${query.response.data.bucket}/${query.response.data.objectUpload.id}`
      : undefined;
  const { objectUrl, error, isLoading } = useBlobLoad({
    filePath: fileUrl,
    autoOpen: false,
    disabled: !fileUrl
  });

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-dark">
      {isLoading || query.loading ? (
        <LoadingSpinner loading={true} />
      ) : error ? (
        <DinaMessage id="previewNotAvailable" />
      ) : (
        <img
          src={objectUrl || ""}
          alt={
            query.response
              ? (query.response as any).data.objectUpload.originalFilename
              : uuid
          }
        />
      )}
    </div>
  );
}
