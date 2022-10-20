import {
  DinaMessage,
  useDinaIntl
} from "../../../../dina-ui/intl/dina-ui-intl";
import { Modal, Button, Form, Alert } from "react-bootstrap";
import { useState, useMemo } from "react";

interface SavedSearchModalParams {
  saveSearch: (searchName: string, isDefault: boolean) => void;
  savedSearchNames: string[];
}

export function useSavedSearchModal({
  saveSearch,
  savedSearchNames
}: SavedSearchModalParams) {
  const { formatMessage } = useDinaIntl();

  const [displayModal, setDisplayModal] = useState<boolean>(false);
  const [savedSearchName, setSavedSearchName] = useState<string>("");
  const [isDefault, setIsDefault] = useState<boolean>(false);

  function submit() {
    // A name has to be given.
    if (savedSearchName !== "") {
      setDisplayModal(false);
      saveSearch(savedSearchName, isDefault);
    }
  }

  function openSavedSearchModal() {
    setDisplayModal(true);
    setSavedSearchName("");
    setIsDefault(false);
  }

  function closeSavedSearchModal() {
    setDisplayModal(false);
  }

  const overwriteWarning = useMemo(
    () => savedSearchNames.includes(savedSearchName),
    [savedSearchName]
  );

  const SavedSearchModal = (
    <Modal show={displayModal} centered={true}>
      <Modal.Header closeButton={true} onHide={closeSavedSearchModal}>
        <Modal.Title>
          <DinaMessage id="createSavedSearch" />
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {overwriteWarning && (
          <Alert variant={"warning"}>
            <DinaMessage
              id="savedSearchOverwriteExisting"
              values={{ savedSearchName }}
            />
          </Alert>
        )}

        <Form>
          <Form.Group className="mb-3" controlId="savedSearchName">
            <Form.Label>
              <strong>
                <DinaMessage id="savedSearchName" />:
              </strong>
            </Form.Label>
            <Form.Control
              type="text"
              placeholder={formatMessage("savedSearchName")}
              required={true}
              defaultValue={savedSearchName}
              onChange={(event) => {
                event.preventDefault();
                setSavedSearchName(event?.target.value ?? "");
              }}
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="isDefault">
            <Form.Check
              type="checkbox"
              label={formatMessage("setAsDefault")}
              defaultChecked={isDefault}
              onChange={(event) => {
                setIsDefault(event?.target.checked);
              }}
            />
          </Form.Group>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={closeSavedSearchModal}>
          <DinaMessage id="cancelButtonText" />
        </Button>
        <Button
          variant="primary"
          onClick={submit}
          disabled={savedSearchName === ""}
        >
          <DinaMessage id="create" />
        </Button>
      </Modal.Footer>
    </Modal>
  );

  return { openSavedSearchModal, SavedSearchModal };
}
