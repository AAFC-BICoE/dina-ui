import { useState, useEffect, useCallback } from "react";
import { useQuery } from "../api-client/useQuery";

interface UseBlobLoadProps {
  /**
   * URL to fetch the blob from. If not provided, the hook will be disabled.
   * This is useful for cases where you want to conditionally load a blob based on some other state.
   */
  filePath?: string;

  /**
   * If true, automatically opens the blob URL in a new tab when the fetch succeeds.
   *
   * Auto open will automatically clear the object URL after opening so it can be used again.
   */
  autoOpen?: boolean;

  /**
   * Force-disable the request.
   */
  disabled?: boolean;
}

interface UseBlobLoadResult {
  /** The object URL which can be opened directly using <a> or displayed. */
  objectUrl: string | null;

  /**
   * Imperative helper to open the URL in a new tab.
   * This function will clear the object URL after opening.
   */
  open: () => void;

  /**
   * Is the blob request currently loading?
   */
  isLoading: boolean;

  /**
   * Error object if the request failed.
   */
  error: any;
}

/**
 * Custom React hook to fetch a binary resource as a Blob, create an Object URL,
 * and optionally auto-open it in a new tab.
 */
export function useBlobLoad({
  filePath,
  autoOpen,
  disabled
}: UseBlobLoadProps): UseBlobLoadResult {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  // If `disabledOption` is provided we use that, otherwise we disable
  // when no filePath is passed in.
  const disableRequest = disabled ?? !filePath;

  const { loading: isLoading, error } = useQuery(
    {
      path: filePath ?? "",
      responseType: "blob",
      timeout: 0
    },
    {
      disabled: disableRequest,
      onSuccess: (response) => {
        const url = window?.URL?.createObjectURL(response as any);
        if (autoOpen) {
          window.open(url, "_blank");
          setObjectUrl(null); // Clear the URL after opening
        } else {
          setObjectUrl(url);
        }
      }
    }
  );

  // Cleanup old URLs on unmount or whenever we get a new one
  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  const open = useCallback(() => {
    if (objectUrl) {
      window.open(objectUrl, "_blank");
      setObjectUrl(null); // Clear the URL after opening
    }
  }, [objectUrl]);

  return { objectUrl, open, isLoading, error };
}
