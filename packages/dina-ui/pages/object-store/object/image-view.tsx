import {
  LoadingSpinner,
  useBlobLoad,
  useQuery,
  SimpleSearchFilterBuilder
} from "common-ui";
import { useRouter } from "next/router";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { useState, useCallback, useRef } from "react";
import { ObjectUpload, Derivative } from "../../../types/objectstore-api";

/**
 * ImageViewer component displays an image fetched from the object store with simple zoom toggle.
 *
 * - Retrieves `id` from the router query.
 * - Fetches object upload data to get isDerivative and bucket information.
 * - If object upload fails, tries to fetch derivative data as fallback. This is mainly for
 *   System Generated thumbnails since they would not contain an object-upload entity.
 * - Constructs the file URL depending on available data.
 * - Uses the `useBlobLoad` hook to fetch the image blob.
 * - Click to zoom in at cursor position, click again to zoom out
 *
 * Zoom position logic is AI assisted.
 *
 * @returns {JSX.Element} The image viewer UI with simple zoom capabilities.
 */
export default function ImageViewer() {
  const router = useRouter();
  const { id } = router.query;

  const {
    loading: objectUploadLoading,
    response: objectUpload,
    error: objectError
  } = useQuery<ObjectUpload>({
    path: `objectstore-api/object-upload/${id}`,
    fields: {
      "object-upload": "isDerivative,bucket"
    }
  });

  // Fallback query for derivative - only enabled if object-upload fails
  const {
    loading: derivativeLoading,
    response: derivative,
    error: derivativeError
  } = useQuery<Derivative>(
    {
      path: `objectstore-api/derivative`,
      filter: SimpleSearchFilterBuilder.create<Derivative>()
        .where("fileIdentifier", "EQ", id ?? "")
        .build(),
      page: { limit: 1 }
    },
    {
      disabled: !objectError || id === undefined
    }
  );

  const [isZoomed, setIsZoomed] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);

  const ZOOM_SCALE = 4;

  // Determine file URL based on available data
  const fileUrl = (() => {
    if (objectUpload?.data) {
      // Use object-upload data
      return objectUpload.data.isDerivative
        ? `/objectstore-api/file/${objectUpload.data.bucket}/derivative/${id}`
        : `/objectstore-api/file/${objectUpload.data.bucket}/${id}`;
    } else if (derivative?.data?.[0]) {
      // Use derivative data as fallback
      return `/objectstore-api/file/${derivative.data[0].bucket}/derivative/${id}`;
    }
    return "";
  })();

  const {
    objectUrl,
    error: blobError,
    isLoading: blobLoading
  } = useBlobLoad({
    filePath: fileUrl,
    autoOpen: false,
    disabled:
      id === undefined ||
      objectUploadLoading ||
      (objectError && derivativeLoading) ||
      !fileUrl
  });

  const isLoading =
    objectUploadLoading || (objectError && derivativeLoading) || blobLoading;
  const hasError = (objectError && derivativeError) || blobError;

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLImageElement>) => {
      e.preventDefault();
      const image = imageRef.current;
      if (!image) return;

      if (!isZoomed) {
        const rect = image.getBoundingClientRect();

        // Click position relative to image's top-left corner
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // Center of the image
        const imageCenterX = rect.width / 2;
        const imageCenterY = rect.height / 2;

        // Calculate the translation needed to keep the clicked point stationary.
        const translateX = (imageCenterX - clickX) * (ZOOM_SCALE - 1);
        const translateY = (imageCenterY - clickY) * (ZOOM_SCALE - 1);

        setPosition({
          x: translateX,
          y: translateY
        });
        setIsZoomed(true);
      } else {
        // Zoom out to fit screen
        setIsZoomed(false);
        setPosition({ x: 0, y: 0 });
      }
    },
    [isZoomed]
  );

  return (
    <div
      className="d-flex justify-content-center align-items-center vh-100 bg-dark text-white position-relative"
      style={{ overflow: "hidden" }}
    >
      {isLoading ? (
        <LoadingSpinner loading={true} />
      ) : hasError ? (
        <DinaMessage id="previewNotAvailable" />
      ) : (
        <img
          ref={imageRef}
          src={objectUrl || ""}
          alt={id as string}
          style={{
            maxHeight: "100dvh",
            maxWidth: "100dvw",
            transform: `translate(${position.x}px, ${position.y}px) scale(${
              isZoomed ? ZOOM_SCALE : 1
            })`,
            cursor: isZoomed ? "zoom-out" : "zoom-in",
            userSelect: "none",
            transition: "transform 0.4s ease-out"
          }}
          onClick={handleClick}
          draggable={false}
        />
      )}
    </div>
  );
}
