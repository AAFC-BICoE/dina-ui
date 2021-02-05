import {
  createContext,
  Fragment,
  ReactNode,
  useContext,
  useRef,
  useState
} from "react";
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

/** Allows opening modals using the "useModal" hook: */
export function ModalProvider({ appElement, children }: ModalProviderProps) {
  const [modals, setModals] = useState<JSX.Element[]>([]);

  function openModal(newModal: JSX.Element) {
    // Add the new modal at the end of the array:
    setModals([...modals, newModal]);
  }

  function closeModal() {
    // Remove the outer-most modal:
    setModals(current => current.slice(0, -1));
  }

  return (
    <ModalContext.Provider value={{ closeModal, openModal }}>
      {children}
      <style>{`.modal-content { margin: auto }`}</style>
      <ReactModal
        appElement={appElement ?? undefined}
        isOpen={!!modals.length}
        className="Modal__Bootstrap modal-dialog"
        // Make sure the modal is in front of the Bootstrap nav bar:
        style={{ overlay: { zIndex: 1040 } }}
      >
        {modals.map((modal, index) => (
          <div
            className="dina-modal-wrapper"
            key={index}
            style={{
              display: index === modals.length - 1 ? undefined : "none"
            }}
          >
            <style>{`.modal-dialog { max-width: 500px }`}</style>
            {modal}
          </div>
        ))}
      </ReactModal>
    </ModalContext.Provider>
  );
}

export function useModal(): ModalContextI {
  return useContext(ModalContext);
}
