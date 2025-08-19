import { LoadingSpinner } from "common-ui";
import { useRouter } from "next/router";
import { useBlobLoad, useQuery } from "common-ui";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { ObjectUpload } from "packages/dina-ui/types/objectstore-api";
export default function ImageViewer() {
  const router = useRouter();
  const uuid = String(router.query.id);
  const query = useQuery<ObjectUpload>({
    path: `objectstore-api/object-upload/${uuid}`
  });

  const fileUrl =
    query && query.response
      ? query.response.data.isDerivative
        ? `/objectstore-api/file/${query.response.data.bucket}/derivative/${query.response.data.id}`
        : `/objectstore-api/file/${query.response.data.bucket}/${query.response.data.id}`
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
              ? (query.response as any).data.originalFilename
              : uuid
          }
        />
      )}
    </div>
  );
}
