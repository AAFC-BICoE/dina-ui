import { LoadingSpinner } from "common-ui";
import { useRouter } from "next/router";
import { useBlobLoad } from "common-ui";
import { DinaMessage } from "../../../intl/dina-ui-intl";
/**
 * ImageViewer component displays an image fetched from the object store based on the route parameters.
 *
 * - Retrieves `id`, `type`, and `bucket` from the router query.
 * - Constructs the file URL depending on whether the `type` is "DERIVATIVE".
 * - Uses the `useBlobLoad` hook to fetch the image blob.
 * - Shows a loading spinner while loading, an error message if loading fails, or the image if successful.
 *
 * @returns {JSX.Element} The image viewer UI.
 */
export default function ImageViewer() {
  const router = useRouter();
  const { id, type, bucket } = router.query;

  const fileUrl =
    type && type == "DERIVATIVE"
      ? `/objectstore-api/file/${bucket}/derivative/${id}`
      : `/objectstore-api/file/${bucket}/${id}`;

  const { objectUrl, error, isLoading } = useBlobLoad({
    filePath: fileUrl,
    autoOpen: false,
    disabled: id === undefined || bucket === undefined
  });

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-dark text-white">
      {isLoading || isLoading ? (
        <LoadingSpinner loading={true} />
      ) : error ? (
        <DinaMessage id="previewNotAvailable" />
      ) : (
        <img
          src={objectUrl || ""}
          alt={id as string}
          style={{ maxHeight: "100dvh" }}
        />
      )}
    </div>
  );
}
