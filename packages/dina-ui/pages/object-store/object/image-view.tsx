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
import { FaMagnifyingGlassPlus, FaMagnifyingGlassMinus } from "react-icons/fa6";
import { TbZoomReset, TbPictureInPictureTop } from "react-icons/tb";

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
                    <FaMagnifyingGlassPlus />
                  </Button>
                  <Button
                    variant="primary"
                    aria-label="Zoom Out"
                    onClick={() => zoomOut()}
                  >
                    <FaMagnifyingGlassMinus />
                  </Button>
                  <Button
                    variant="primary"
                    aria-label="Reset"
                    onClick={() => resetTransform()}
                  >
                    <TbZoomReset />
                  </Button>
                  <Button
                    variant="primary"
                    aria-label="Toggle Minimap"
                    onClick={() => setMinimapShowing(!minimapShowing)}
                  >
                    <TbPictureInPictureTop />
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
