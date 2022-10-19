import { useDinaIntl } from "../../../../dina-ui/intl/dina-ui-intl";
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
        <Modal.Title>Create Saved Search</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {overwriteWarning && (
          <Alert variant={"warning"}>
            There is currently already a saved search named "{savedSearchName}".
            Creating this saved search will overwrite the existing saved search.
          </Alert>
        )}

        <Form>
          <Form.Group className="mb-3" controlId="savedSearchName">
            <Form.Label>
              <strong>Saved Search Name:</strong>
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="Saved Search Name"
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
              label="Set as default"
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
          Close
        </Button>
        <Button
          variant="primary"
          onClick={submit}
          disabled={savedSearchName === ""}
        >
          Create
        </Button>
      </Modal.Footer>
    </Modal>
  );

  return { openSavedSearchModal, SavedSearchModal };
}
