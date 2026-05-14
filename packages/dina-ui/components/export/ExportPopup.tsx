import { Overlay, Popover } from "react-bootstrap";
import { IoClose } from "react-icons/io5";
import { FaCheckCircle } from "react-icons/fa";
import { DinaMessage } from "@dina-ui/intl/dina-ui-intl";

interface ExportPopupProps {
  target: HTMLElement | null;
  show: boolean;
  onClose: () => void;
}

export function ExportPopup({ target, show, onClose }: ExportPopupProps) {
  return (
    <Overlay target={target} show={show} placement="right">
      <Popover id="popover-basic">
        <Popover.Header
          as="h3"
          className="m-0 d-flex justify-content-between align-items-center"
        >
          <span>
            <DinaMessage id="exportRequestSubmittedTitle" />
          </span>
          <IoClose
            style={{ cursor: "pointer" }}
            onClick={onClose}
            data-testid="close-button"
          />
        </Popover.Header>
        <Popover.Body className="d-flex flex-column align-items-center text-center gap-2">
          <FaCheckCircle className="text-success fs-1" />
          <span>
            <DinaMessage id="exportRequestSubmittedMessage" />
          </span>
        </Popover.Body>
      </Popover>
    </Overlay>
  );
}
