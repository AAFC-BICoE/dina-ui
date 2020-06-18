import { CheckBoxFieldProps, useQuery } from "common-ui";
import { PersistedResource } from "kitsu";
import Link from "next/link";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { Metadata } from "../../types/objectstore-api";
import { FileView } from "../file-view/FileView";

interface StoredObjectGalleryProps {
  /** The GroupedCheckBox component for selecting Metadatas to edit. */
  CheckBoxField: React.ComponentType<CheckBoxFieldProps<Metadata>>;

  /** The displayed Metadatas. */
  metadatas: Array<PersistedResource<Metadata>>;

  /** Called when a Metadata is selected for preview. */
  onSelectPreviewMetadataId: (id: string) => void;

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
  onSelectPreviewMetadataId,
  previewMetadataId
}: StoredObjectGalleryProps) {
  return (
    <div className="stored-object-gallery">
      <style>{GALLERY_STYLE}</style>
      <ul className="m-3 list-inline">
        {metadatas.map(metadata => {
          return (
            <li className="m-1 list-inline-item align-top" key={metadata.id}>
              <GalleryItem
                CheckBoxField={CheckBoxField}
                highlighted={previewMetadataId === metadata.id}
                metadata={metadata}
                onSelectPreviewMetadataId={onSelectPreviewMetadataId}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

interface GalleryItemProps {
  metadata: PersistedResource<Metadata>;
  highlighted?: boolean;
  /** The GroupedCheckBox component for selecting Metadatas to edit. */
  CheckBoxField: React.ComponentType<CheckBoxFieldProps<Metadata>>;
  /** Called when a Metadata is selected for preview. */
  onSelectPreviewMetadataId: (id: string) => void;
}

function GalleryItem({
  highlighted,
  CheckBoxField,
  metadata,
  onSelectPreviewMetadataId
}: GalleryItemProps) {
  const { id, originalFilename } = metadata;

  const { formatMessage } = useDinaIntl();
  const { response: thumbnailResponse } = useQuery<Metadata[]>({
    filter: {
      "acDerivedFrom.id": id
    },
    path: "objectstore-api/metadata"
  });

  const thumbnail = thumbnailResponse?.data?.[0];

  return (
    <div
      className="card card-body"
      style={{
        backgroundColor: highlighted ? HIGHLIGHT_COLOR : undefined,
        maxWidth: "15rem"
      }}
    >
      {thumbnail && (
        <FileView
          filePath={`/api/objectstore-api/file/${thumbnail.bucket}/${thumbnail.fileIdentifier}.thumbnail`}
          fileType="jpg"
          imgAlt={formatMessage("thumbnailNotAvailableText")}
        />
      )}
      <Link href={`/object-store/object/view?id=${id}`}>
        <a
          style={{
            margin: "1rem auto 1rem auto",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            width: "100%"
          }}
          title={originalFilename}
        >
          {originalFilename}
        </a>
      </Link>
      <div className="row">
        <div className="col-9">
          <button
            className="btn btn-info w-100 preview-button"
            onClick={() => onSelectPreviewMetadataId(id)}
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

  return null;
}
