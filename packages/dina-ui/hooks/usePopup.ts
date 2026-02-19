import { useCallback, useRef } from "react";

export interface PopupOptions {
  url: string;
  name?: string;
  width?: number;
  height?: number;
  features?: string;
}

export function usePopup(defaultOptions?: Partial<PopupOptions>) {
  const popupRef = useRef<Window | null>(null);
  const openPopup = useCallback(
    (options: PopupOptions): Window | null => {
      if (typeof window === "undefined") return null;

      const {
        url,
        name = "popupWindow",
        width = 1000,
        height = 800,
        features = ""
      } = { ...defaultOptions, ...options };
      const left = window.screenX + (window.innerWidth - width) / 2;
      const top = window.screenY + (window.innerHeight - height) / 2;
      const featureString = `
        width=${width},
        height=${height},
        left=${left},
        top=${top},
        resizable=yes,
        scrollbars=yes,
        ${features}
      `.replace(/\s/g, "");

      popupRef.current = window.open(url, name, featureString);

      return popupRef.current;
    },
    [defaultOptions]
  );

  const closePopup = useCallback((): void => {
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
      popupRef.current = null;
    }
  }, []);

  const isOpen = useCallback((): boolean => {
    return !!(popupRef.current && !popupRef.current.closed);
  }, []);

  return {
    openPopup,
    closePopup,
    isOpen
  };
}
