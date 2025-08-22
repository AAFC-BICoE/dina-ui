import { LoadingSpinner } from "common-ui";
import { useRouter } from "next/router";
import { useBlobLoad } from "common-ui";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { useState, useCallback, useRef } from "react";

/**
 * ImageViewer component displays an image fetched from the object store with simple zoom toggle.
 *
 * - Retrieves `id`, `type`, and `bucket` from the router query.
 * - Constructs the file URL depending on whether the `type` is "DERIVATIVE".
 * - Uses the `useBlobLoad` hook to fetch the image blob.
 * - Click to zoom in at cursor position, click again to zoom out
 *
 * Zoom position logic is AI assisted.
 *
 * @returns {JSX.Element} The image viewer UI with simple zoom capabilities.
 */
export default function ImageViewer() {
  const router = useRouter();
  const { id, type, bucket } = router.query;

  const [isZoomed, setIsZoomed] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);

  const ZOOM_SCALE = 4;

  const fileUrl =
    type && type == "DERIVATIVE"
      ? `/objectstore-api/file/${bucket}/derivative/${id}`
      : `/objectstore-api/file/${bucket}/${id}`;

  const { objectUrl, error, isLoading } = useBlobLoad({
    filePath: fileUrl,
    autoOpen: false,
    disabled: id === undefined || bucket === undefined
  });

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
      ) : error ? (
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
