import {
  fileExtensionToIcon,
  formatAcceptHint,
  formatBytes
} from "@dina-ui/components/object-store";
import { DinaMessage, useDinaIntl } from "@dina-ui/intl/dina-ui-intl";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FaFileArrowUp, FaTrashCan } from "react-icons/fa6";
import { IFileWithMeta, IMeta } from "./FileTypes";

export interface SubmitButtonProps {
  files: IFileWithMeta[];
  disabled: boolean;
  content?: React.ReactNode;
  onSubmit: (files: IFileWithMeta[]) => void;
}

export interface FileDropzoneProps {
  onSubmit: (files: IFileWithMeta[]) => void;
  onChange?: (files: IFileWithMeta[]) => void;

  /**
   * Number of files that can be uploaded through the file dropzone.
   *
   * By default it's unlimited, but can be set to 1 just for a single file upload.
   */
  maxFiles?: number;

  /**
   * Maximum allowed file size in bytes. Files exceeding this are flagged with an error and
   * excluded from submission.
   */
  maxSizeBytes?: number;

  /**
   * Comma-separated MIME types or extensions passed to the hidden `<input>` and used for
   * client-side filtering (e.g. `"text/csv, .xlsx"`).
   */
  accept?: string;

  /**
   * If true, the file dropzone will automatically submit the files when they are added, without
   * requiring the user to click a submit button.
   *
   * It's recommended that this option is only used when maxFiles is set to 1.
   */
  autoUpload?: boolean;

  inputContent?: React.ReactNode;
  submitButtonContent?: React.ReactNode;
  PreviewComponent?: React.ComponentType<{
    fileWithMeta: InternalFileWithMeta;
  }>;
  SubmitButtonComponent?: React.ComponentType<SubmitButtonProps>;
}

export type InternalFileWithMeta = IFileWithMeta & {
  id: string;
  error?: string;
};

function buildFileWithMeta(
  file: File,
  onRemove: (id: string) => void
): InternalFileWithMeta {
  const id = `${file.name}-${file.lastModified}-${file.size}-${Math.random()}`;
  const meta: IMeta = {
    type: file.type,
    name: file.name,
    size: file.size,
    lastModifiedDate: new Date(file.lastModified).toISOString()
  };
  return {
    id,
    file,
    meta,
    cancel: () => {},
    restart: () => {},
    remove: () => onRemove(id)
  };
}

function parseAccept(accept?: string): string[] {
  if (!accept) return [];
  return accept
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function fileMatchesAccept(file: File, acceptList: string[]): boolean {
  if (acceptList.length === 0) return true;
  return acceptList.some((pattern) => {
    if (pattern.endsWith("/*"))
      return file.type.startsWith(pattern.replace("/*", "/"));
    if (pattern.startsWith("."))
      return file.name.toLowerCase().endsWith(pattern.toLowerCase());
    return file.type === pattern;
  });
}

export function DefaultPreview({
  fileWithMeta
}: {
  fileWithMeta: InternalFileWithMeta;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { formatMessage } = useDinaIntl();
  const isImage = fileWithMeta.meta.type.startsWith("image/");
  const hasError = fileWithMeta.error === "size";
  const fileExtension =
    "." + fileWithMeta.meta.name.split(".").pop()?.toLowerCase();

  useEffect(() => {
    if (isImage) {
      const url = URL.createObjectURL(fileWithMeta.file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [fileWithMeta.file, isImage]);

  return (
    <div
      className="d-flex align-items-stretch rounded overflow-hidden"
      style={{
        backgroundColor: hasError ? "rgba(220, 53, 69, 0.05)" : "#f8f9fa",
        border: `1px solid ${hasError ? "rgba(220, 53, 69, 0.3)" : "#e9ecef"}`,
        minHeight: "72px"
      }}
    >
      {/* Icon / thumbnail */}
      {previewUrl ? (
        <img
          src={previewUrl}
          alt={fileWithMeta.meta.name}
          className="dzu-previewImage flex-shrink-0"
          style={{
            width: "96px",
            objectFit: "cover",
            userSelect: "none",
            display: "block"
          }}
          draggable={false}
        />
      ) : (
        <div
          className="d-flex align-items-center justify-content-center flex-shrink-0"
          style={{
            width: "48px",
            margin: "12px 0 12px 12px",
            backgroundColor: "#ffffff",
            border: "1px solid #e9ecef",
            borderRadius: "6px"
          }}
        >
          {fileExtensionToIcon(fileExtension, "text-secondary fs-4")}
        </div>
      )}

      {/* Name + size */}
      <div className="d-flex flex-column flex-grow-1 overflow-hidden justify-content-center gap-1 px-3 py-3">
        <span
          className="fw-medium text-truncate"
          style={{ fontSize: "0.95rem", color: "#212529" }}
          title={fileWithMeta.meta.name}
        >
          {fileWithMeta.meta.name}
        </span>
        <span
          style={{
            fontSize: "0.82rem",
            color: hasError ? "#dc3545" : "#6c757d"
          }}
        >
          {formatBytes(fileWithMeta.meta.size)}
          {hasError && ` · ${formatMessage("fileTooBig")}`}
        </span>
      </div>

      {/* Remove */}
      <div className="d-flex align-items-center px-3 flex-shrink-0">
        <button
          type="button"
          className="btn btn-danger p-2"
          style={{ color: "#ffffff", lineHeight: 1 }}
          onClick={() => fileWithMeta.remove()}
          aria-label={`Remove ${fileWithMeta.meta.name}`}
        >
          <FaTrashCan size={17} />
        </button>
      </div>
    </div>
  );
}

export function DefaultSubmitButton({
  files,
  disabled,
  content,
  onSubmit
}: SubmitButtonProps) {
  const validFiles = files.filter((f) => !(f as InternalFileWithMeta).error);
  return (
    <button
      type="button"
      className="btn btn-success"
      disabled={disabled || validFiles.length === 0}
      onClick={() => onSubmit(validFiles)}
    >
      {content ?? <DinaMessage id="submitBtnText" />}
    </button>
  );
}

export function FileDropzone({
  onSubmit,
  maxFiles,
  maxSizeBytes,
  accept,
  inputContent,
  submitButtonContent,
  PreviewComponent,
  SubmitButtonComponent,
  onChange,
  autoUpload = false
}: FileDropzoneProps) {
  const [files, setFiles] = useState<InternalFileWithMeta[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listBottomRef = useRef<HTMLDivElement>(null);
  const acceptList = parseAccept(accept);
  const multiple = maxFiles === undefined || maxFiles > 1;
  const atMaxFiles = maxFiles !== undefined && files.length >= maxFiles;

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const addFiles = useCallback(
    (incoming: File[]) => {
      const newEntries: InternalFileWithMeta[] = [];

      for (const file of incoming) {
        if (!fileMatchesAccept(file, acceptList)) continue;

        const isDuplicate = files.some(
          (existing) =>
            existing.file.name === file.name &&
            existing.file.size === file.size &&
            existing.file.lastModified === file.lastModified
        );
        if (isDuplicate) continue;

        const entry = buildFileWithMeta(file, removeFile);
        if (maxSizeBytes && file.size > maxSizeBytes) entry.error = "size";
        newEntries.push(entry);
      }

      if (newEntries.length === 0) return;

      setFiles((prev) => {
        const combined = multiple ? [...prev, ...newEntries] : newEntries;
        return maxFiles !== undefined ? combined.slice(-maxFiles) : combined;
      });
    },
    [files, multiple, maxFiles, maxSizeBytes, acceptList.join(","), removeFile]
  );

  // Scroll the newest item into view whenever the file count grows
  useEffect(() => {
    if (files.length > 0) {
      listBottomRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });
    }
  }, [files.length]);

  useEffect(() => {
    onChange?.(files);
  }, [files, onChange]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node))
      setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      addFiles(Array.from(e.dataTransfer.files));
    },
    [addFiles]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      addFiles(Array.from(e.target.files ?? []));
      e.target.value = "";
    },
    [addFiles]
  );

  const hasFiles = files.length > 0;
  const hasErrors = files.some((f) => f.error);

  useEffect(() => {
    if (autoUpload && hasFiles && !hasErrors) {
      onSubmit(files);
    }
  }, [autoUpload, hasFiles, hasErrors, files, onSubmit]);

  const PreviewComp = PreviewComponent ?? DefaultPreview;
  const SubmitComp = SubmitButtonComponent ?? DefaultSubmitButton;

  return (
    <div className="d-flex flex-column gap-3">
      {!atMaxFiles && (
        <>
          <div
            style={{
              border: `3px dashed ${isDragging ? "#0d6efd" : "#cccccc"}`,
              borderRadius: "8px",
              transition: "border-color 0.2s ease, background-color 0.2s ease",
              backgroundColor: isDragging
                ? "rgba(13, 110, 253, 0.05)"
                : "transparent",
              cursor: "pointer"
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => {
              if (document.activeElement?.tagName !== "BUTTON")
                inputRef.current?.click();
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
            }}
            aria-label="File upload drop zone"
          >
            <input
              ref={inputRef}
              type="file"
              multiple={multiple}
              accept={accept}
              style={{ display: "none" }}
              onChange={handleInputChange}
              tabIndex={-1}
            />

            <div
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
            >
              <div
                className="d-flex flex-column align-items-center justify-content-center text-center py-5 px-3"
                style={{ color: "#555555" }}
              >
                <FaFileArrowUp
                  size={48}
                  className="mb-3"
                  style={{
                    color: isDragging ? "#0d6efd" : "#aaaaaa",
                    transition: "color 0.2s ease"
                  }}
                />
                <span style={{ fontSize: "1.1rem" }}>
                  {inputContent ?? <DinaMessage id="uploadFormInstructions" />}
                </span>
              </div>
            </div>
          </div>

          {/* Supported formats / max size hint */}
          {(accept || maxSizeBytes) && (
            <div
              className="d-flex justify-content-between"
              style={{ fontSize: "0.78rem", color: "#adb5bd" }}
            >
              {accept ? (
                <span>
                  <DinaMessage id="supportedFormats" />
                  {": "}
                  {formatAcceptHint(accept)}
                </span>
              ) : (
                <span />
              )}
              {maxSizeBytes && (
                <span>
                  <DinaMessage id="maxFileSize" />
                  {": "}
                  {formatBytes(maxSizeBytes, 0)}
                </span>
              )}
            </div>
          )}
        </>
      )}

      {/* File list */}
      {hasFiles && (
        <div
          className="d-flex flex-column gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {files.map((f) => (
            <PreviewComp key={f.id} fileWithMeta={f} />
          ))}
        </div>
      )}

      {/* Submit button */}
      {hasFiles && !autoUpload && (
        <div
          className="d-flex justify-content-end"
          onClick={(e) => e.stopPropagation()}
        >
          <SubmitComp
            files={files}
            disabled={!hasFiles || hasErrors}
            content={submitButtonContent}
            onSubmit={onSubmit}
          />
        </div>
      )}
      {/* Scroll Anchor so the user can see the item added */}
      <div ref={listBottomRef} />
    </div>
  );
}
