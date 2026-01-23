import {
  LoadingSpinner,
  useBlobLoad,
  useQuery,
  SimpleSearchFilterBuilder
} from "common-ui";
import { useRouter } from "next/router";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { useRef } from "react";
import { ObjectUpload, Derivative } from "../../../types/objectstore-api";
import { Head } from "../../../components/head";
import { useDinaIntl } from "../../../../dina-ui/intl/dina-ui-intl";
import {
  TransformWrapper,
  TransformComponent,
  MiniMap
} from "react-zoom-pan-pinch";
import { Button, ButtonGroup } from "react-bootstrap";
import { useState } from "react";

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
  const { formatMessage } = useDinaIntl();

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

  const imageRef = useRef<HTMLImageElement>(null);

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

  const [minimapShowing, setMinimapShowing] = useState(true);

  const displayedImage = (
    <img
      ref={imageRef}
      src={objectUrl || ""}
      alt={id as string}
      style={{
        maxHeight: "100dvh",
        maxWidth: "100dvw"
      }}
    />
  );
  return (
    <>
      <Head title={formatMessage("imagePreview")} />
      <div
        className="d-flex justify-content-center align-items-center vh-100 bg-dark text-white position-relative"
        style={{ overflow: "hidden" }}
      >
        {isLoading ? (
          <LoadingSpinner loading={true} />
        ) : hasError ? (
          <DinaMessage id="previewNotAvailable" />
        ) : (
          <TransformWrapper
            panning={{ velocityDisabled: true }}
            disablePadding={true}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                <div
                  style={{
                    position: "fixed",
                    zIndex: 5,
                    top: "50px",
                    right: "50px"
                  }}
                >
                  <MiniMap width={200} hidden={!minimapShowing}>
                    {displayedImage}
                  </MiniMap>
                </div>
                <ButtonGroup
                  className="position-absolute top-0 start-50 translate-middle-x mt-3"
                  style={{ zIndex: 10 }}
                >
                  <Button
                    variant="primary"
                    aria-label="Zoom In"
                    onClick={() => zoomIn()}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      className="bi bi-zoom-in"
                      viewBox="0 0 16 16"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11M13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0"
                      />
                      <path d="M10.344 11.742q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1 6.5 6.5 0 0 1-1.398 1.4z" />
                      <path
                        fill-rule="evenodd"
                        d="M6.5 3a.5.5 0 0 1 .5.5V6h2.5a.5.5 0 0 1 0 1H7v2.5a.5.5 0 0 1-1 0V7H3.5a.5.5 0 0 1 0-1H6V3.5a.5.5 0 0 1 .5-.5"
                      />
                    </svg>
                  </Button>
                  <Button
                    variant="primary"
                    aria-label="Zoom Out"
                    onClick={() => zoomOut()}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      className="bi bi-zoom-out"
                      viewBox="0 0 16 16"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11M13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0"
                      />
                      <path d="M10.344 11.742q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1 6.5 6.5 0 0 1-1.398 1.4z" />
                      <path
                        fill-rule="evenodd"
                        d="M3 6.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5"
                      />
                    </svg>
                  </Button>
                  <Button
                    variant="primary"
                    aria-label="Reset"
                    onClick={() => resetTransform()}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      className="bi bi-x-circle"
                      viewBox="0 0 16 16"
                    >
                      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                      <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
                    </svg>
                  </Button>
                  <Button
                    variant="primary"
                    aria-label="Toggle Minimap"
                    onClick={() => setMinimapShowing(!minimapShowing)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      className="bi bi-images"
                      viewBox="0 0 16 16"
                    >
                      <path d="M4.502 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3" />
                      <path d="M14.002 13a2 2 0 0 1-2 2h-10a2 2 0 0 1-2-2V5A2 2 0 0 1 2 3a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-1.998 2M14 2H4a1 1 0 0 0-1 1h9.002a2 2 0 0 1 2 2v7A1 1 0 0 0 15 11V3a1 1 0 0 0-1-1M2.002 4a1 1 0 0 0-1 1v8l2.646-2.354a.5.5 0 0 1 .63-.062l2.66 1.773 3.71-3.71a.5.5 0 0 1 .577-.094l1.777 1.947V5a1 1 0 0 0-1-1z" />
                    </svg>
                  </Button>
                </ButtonGroup>

                <TransformComponent
                  wrapperStyle={{
                    width: "100%",
                    height: "100%"
                  }}
                >
                  {displayedImage}
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        )}
      </div>
    </>
  );
}
