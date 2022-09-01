import { CheckBoxFieldProps, useQuery } from "common-ui";
import { PersistedResource } from "kitsu";
import Link from "next/link";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { Metadata } from "../../../types/objectstore-api";
import { FileView } from "../file-view/FileView";

interface StoredObjectGalleryProps {
  /** The GroupedCheckBox component for selecting Metadatas to edit. */
  CheckBoxField: React.ComponentType<CheckBoxFieldProps<Metadata>>;

  /** The displayed Metadatas. */
  metadatas: PersistedResource<Metadata>[];

  /** Called when a Metadata is selected for preview. */
  onSelectPreviewMetadata: (metadata: Metadata) => void;

  /** The ID of the currently previewed Metadata. */
  previewMetadataId: string | null;
}

const GALLERY_STYLE = `
  .stored-object-gallery .file-viewer-wrapper, .stored-object-gallery img {
    overflow-x: hidden !important;
    height: 7rem;
  }
`;

const HIGHLIGHT_COLOR = "rgb(222, 252, 222)";

/**
 * Shows a list of Metadatas as a gallery view with thumbnails.
 */
export function StoredObjectGallery({
  CheckBoxField,
  metadatas,
  onSelectPreviewMetadata,
  previewMetadataId
}: StoredObjectGalleryProps) {
  return (
    <div className="stored-object-gallery">
      <style>{GALLERY_STYLE}</style>
      <ul className="m-3 list-inline">
        {metadatas.map((metadata) => {
          return (
            <li className="m-1 list-inline-item align-top" key={metadata.id}>
              <GalleryItem
                CheckBoxField={CheckBoxField}
                highlighted={previewMetadataId === metadata.id}
                metadata={metadata as any}
                onSelectPreviewMetadata={onSelectPreviewMetadata}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

interface GalleryItemProps {
  metadata: any;
  highlighted?: boolean;
  /** The GroupedCheckBox component for selecting Metadatas to edit. */
  CheckBoxField: React.ComponentType<CheckBoxFieldProps<Metadata>>;
  /** Called when a Metadata is selected for preview. */
  onSelectPreviewMetadata: (metadata: Metadata) => void;
}

function GalleryItem({
  highlighted,
  CheckBoxField,
  metadata,
  onSelectPreviewMetadata
}: GalleryItemProps) {
  const { acCaption, originalFilename, bucket, fileIdentifier } =
    metadata?.data?.attributes;
  const { id } = metadata;

  const fileId = `${fileIdentifier}/thumbnail`;
  const filePath = `/api/objectstore-api/file/${bucket}/${fileId}`;

  const { formatMessage } = useDinaIntl();

  /** The link text to display in the gallery item under the image. */
  const linkText = acCaption || originalFilename || id;

  return (
    <div
      className="card card-body"
      style={{
        backgroundColor: highlighted ? HIGHLIGHT_COLOR : undefined,
        maxWidth: "15rem"
      }}
    >
      <FileView
        filePath={filePath}
        fileType="jpg"
        imgAlt={formatMessage("thumbnailNotAvailableText")}
      />

      <Link href={`/object-store/object/view?id=${id}`}>
        <a
          style={{
            margin: "1rem auto 1rem auto",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            width: "100%"
          }}
          title={linkText}
        >
          {linkText}
        </a>
      </Link>
      <div className="row">
        <div className="col-9">
          <button
            className="btn btn-info w-100 preview-button"
            onClick={() => onSelectPreviewMetadata(metadata)}
            type="button"
          >
            <DinaMessage id="viewPreviewButtonText" />
          </button>
        </div>
        <div className="col-3">
          <CheckBoxField resource={metadata} />
        </div>
      </div>
    </div>
  );
}
