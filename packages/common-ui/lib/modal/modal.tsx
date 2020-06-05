import { createContext, ReactNode, useContext, useState } from "react";
import ReactModal from "react-modal";

interface ModalContextI {
  openModal: (content: JSX.Element) => void;
  closeModal: () => void;
}

interface ModalProviderProps {
  /**
   * Outer element surrounding the application.
   * This is needed to unfocus the rest of the page.
   */
  appElement: HTMLElement | null;
  children: ReactNode;
}

const ModalContext = createContext<ModalContextI>(
  // Default value is undefined. This won't matter as long as the hook is called inside the context provider.
  undefined as any
);

/**  */
export function ModalProvider({ appElement, children }: ModalProviderProps) {
  const [Component, setComponent] = useState<JSX.Element | null>(null);

  return (
    <ModalContext.Provider
      value={{
        closeModal: () => setComponent(null),
        openModal: setComponent
      }}
    >
      {children}
      <ReactModal
        appElement={appElement ?? undefined}
        isOpen={!!Component}
        className="Modal__Bootstrap modal-dialog"
        // Make sure the modal is in front of the Bootstrap nav bar:
        style={{ overlay: { zIndex: 1040 } }}
      >
        {Component}
      </ReactModal>
    </ModalContext.Provider>
  );
}

export function useModal(): ModalContextI {
  return useContext(ModalContext);
}
