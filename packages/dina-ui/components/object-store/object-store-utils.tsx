import Kitsu from "kitsu";
import { downloadBlobFile } from "common-ui";
import { Dispatch, SetStateAction } from "react";
import _ from "lodash";
import {
  FaFile,
  FaFileAudio,
  FaFileCsv,
  FaFileExcel,
  FaFileImage,
  FaFilePdf,
  FaFilePowerpoint,
  FaFileVideo,
  FaFileWord,
  FaFileZipper
} from "react-icons/fa6";
import { FaFileCode } from "react-icons/fa";
import { MdOutlineRawOn } from "react-icons/md";
import { IconType } from "react-icons/lib";

// Raw file extensions that cannot be viewed directly
export const RAW_EXTS = new Set([
  ".cr2", // Canon
  ".cr3", // Canon (newer)
  ".nef", // Nikon
  ".arw", // Sony
  ".dng", // Adobe Digital Negative (universal)
  ".orf", // Olympus
  ".rw2", // Panasonic
  ".pef", // Pentax
  ".srw", // Samsung
  ".raf", // Fujifilm
  ".raw" // Generic/various
]);

// Common image extensions
export const IMAGE_EXTS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".bmp",
  ".tiff",
  ".svg",
  ".webp"
]);

// Common video extensions
export const VIDEO_EXTS = new Set([
  ".mp4",
  ".mov",
  ".avi",
  ".mkv",
  ".wmv",
  ".flv",
  ".webm"
]);

// Common audio extensions
export const AUDIO_EXTS = new Set([
  ".mp3",
  ".wav",
  ".flac",
  ".aac",
  ".ogg",
  ".m4a"
]);

/**
 * Util function to fetch file object as blob ready to be downloaded
 *
 * @param path The download link.
 * @param apiClient Dina UI's apiClient from useApiClient
 */
export async function fetchObjectBlob(path: string, apiClient: Kitsu) {
  return await apiClient.axios.get(path, {
    responseType: "blob",
    timeout: 0
  });
}

/**
 * When the user clicks a download link, the current token will be appended.
 *
 * @param path The download link.
 * @param apiClient Dina UI's apiClient from useApiClient
 * @param setIsDownloading Callback state setter
 */
export async function handleDownloadLink(
  path: string,
  apiClient: Kitsu,
  setIsDownloading: Dispatch<SetStateAction<boolean>>
) {
  if (path) {
    try {
      setIsDownloading(true);
      const response = await fetchObjectBlob(path, apiClient);
      const content: string = response.headers["content-disposition"];
      const filename = content
        .slice(content.indexOf("filename=") + "filename=".length)
        .replaceAll('"', "");

      downloadBlobFile(response.data, filename);

      setIsDownloading(false);
    } catch (error) {
      setIsDownloading(false);
      return error;
    }
  }
}

const BYTE_UNIT_MULTIPLIERS: Record<string, number> = {
  b: 1,
  kb: 1024,
  mb: 1024 ** 2,
  gb: 1024 ** 3,
  tb: 1024 ** 4,
  pb: 1024 ** 5
};

/**
 * Parses a human-readable file size string into a number of bytes.
 * Units are case-insensitive and use binary multipliers (1 KB = 1024 bytes),
 * e.g. "3GB" -> 3221225472. Inverse of formatBytes.
 *
 * @param value e.g. "3GB", "1.5 MB", or a plain byte count like "1024".
 * @returns The size in bytes, or null when the string cannot be parsed.
 */
export function parseBytes(value: string): number | null {
  const trimmedValue = value.trim();
  const match = /^((-|\+)?(\d+(?:\.\d+)?)) *(b|kb|mb|gb|tb|pb)$/i.exec(trimmedValue);
  // Unit-less strings (e.g. "1024") are treated as a plain byte count.
  const floatValue = match ? parseFloat(match[1]) : parseInt(trimmedValue, 10);
  const unit = match ? match[4].toLowerCase() : "b";
  return isNaN(floatValue)
    ? null
    : Math.floor(BYTE_UNIT_MULTIPLIERS[unit] * floatValue);
}

export function formatBytes(bytes, decimals: number = 2): string {
  if (!+bytes) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function derivativeTypeToLabel(
  derivativeType: string,
  messages: any
): string {
  switch (derivativeType) {
    case "THUMBNAIL_IMAGE":
      return messages?.["THUMBNAIL_IMAGE"] || "Thumbnail";
    case "LARGE_IMAGE":
      return messages?.["LARGE_IMAGE"] || "Large Image";
    case "CROPPED_IMAGE":
      return messages?.["CROPPED_IMAGE"] || "Cropped Image";
    default:
      // Display it as a human-readable string, should be using a translation key though.
      return _.startCase(derivativeType.replace(/_/g, " "));
  }
}

// Specific one‐off mapping (extension → icon)
const SPECIFIC_ICON_MAP: Record<string, IconType> = {
  pdf: FaFilePdf,
  doc: FaFileWord,
  docx: FaFileWord,
  xls: FaFileExcel,
  xlsx: FaFileExcel,
  csv: FaFileCsv,
  html: FaFileCode,
  htm: FaFileCode,
  ppt: FaFilePowerpoint,
  pptx: FaFilePowerpoint,
  zip: FaFileZipper,
  gz: FaFileZipper,
  gzip: FaFileZipper
};

/**
 * Render an appropriate file‐icon based on a “.ext” string.
 *
 * @param fileExtension  The extension, e.g. ".jpg", ".PDF", ".Cr2"
 * @param className      CSS className to pass to the icon
 */
export function fileExtensionToIcon(
  fileExtension: string | undefined,
  className = ""
): React.ReactNode {
  if (!fileExtension) return null;

  // strip leading dot and lowercase
  const ext = fileExtension.replace(/^\./, "").toLowerCase();

  if (RAW_EXTS.has(ext)) {
    return <MdOutlineRawOn className={className} />;
  }
  if (IMAGE_EXTS.has(ext)) {
    return <FaFileImage className={className} />;
  }
  if (VIDEO_EXTS.has(ext)) {
    return <FaFileVideo className={className} />;
  }
  if (AUDIO_EXTS.has(ext)) {
    return <FaFileAudio className={className} />;
  }
  if (SPECIFIC_ICON_MAP[ext]) {
    const Icon = SPECIFIC_ICON_MAP[ext];
    return <Icon className={className} />;
  }

  // Default to generic file icon
  return <FaFile className={className} />;
}

/**
 * Converts an HTML `accept` attribute string into a human-readable list of file format labels.
 *
 * @param accept  A comma-separated accept string as passed to `<input type="file">`,
 *                e.g. `"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/csv"`
 * @returns       A comma-separated, human-readable format string, e.g. `"XLSX, CSV"`
 *
 * @example formatAcceptHint("text/csv, .xlsx, image/*") → "CSV, XLSX, IMAGE"
 */
export function formatAcceptHint(accept: string): string {
  const MIME_TO_EXT: Record<string, string> = {
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
    "application/vnd.ms-excel": "XLS",
    "application/msword": "DOC",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "DOCX",
    "application/vnd.ms-powerpoint": "PPT",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      "PPTX",
    "application/pdf": "PDF",
    "application/zip": "ZIP",
    "image/jpeg": "JPG",
    "image/png": "PNG",
    "image/gif": "GIF",
    "image/webp": "WEBP",
    "image/tiff": "TIFF",
    "video/mp4": "MP4",
    "video/quicktime": "MOV",
    "audio/mpeg": "MP3",
    "audio/wav": "WAV",
    "text/csv": "CSV",
    "text/plain": "TXT",
    "text/html": "HTML"
  };

  return accept
    .split(",")
    .map((s) => {
      const trimmed = s.trim();
      if (MIME_TO_EXT[trimmed]) return MIME_TO_EXT[trimmed];
      // Extension already, e.g. ".xlsx" → "XLSX"
      if (trimmed.startsWith("."))
        return trimmed.replace(/^\./, "").toUpperCase();
      // Wildcard MIME, e.g. "image/*" → "IMAGE"
      if (trimmed.endsWith("/*"))
        return trimmed.replace("/*", "").toUpperCase();
      // Unknown MIME — take the subtype part
      return trimmed.split("/").pop()?.toUpperCase() ?? trimmed.toUpperCase();
    })
    .join(", ");
}
