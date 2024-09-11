import { SaveArgs, useAccount, useApiClient } from "common-ui/lib";
import { UserPreference } from "../../../types/user-api";
import { FilterParam, KitsuResource } from "kitsu";
import { useEffect, useState, useMemo } from "react";
import { SavedExportColumnStructure } from "./types";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import Alert from "react-bootstrap/Alert";
import { TableColumn } from "packages/common-ui/lib/list-page/types";
import { isEqual } from "lodash";

export interface UseSavedExportsProp {
  indexName: string;
}

export function useSavedExports<TData extends KitsuResource>({
  indexName
}: UseSavedExportsProp) {
  const { save, apiClient } = useApiClient();
  const { subject } = useAccount();

  const [userPreferenceID, setUserPreferenceID] = useState<string>();
  const [everySavedExport, setEverySavedExport] = useState<
    SavedExportColumnStructure[]
  >([]);
  const [allSavedExports, setAllSavedExports] = useState<
    SavedExportColumnStructure[]
  >([]);
  const [loadingSavedExports, setLoadingSavedExports] = useState<boolean>(true);
  const [selectedSavedExport, setSelectedSavedExport] =
    useState<SavedExportColumnStructure>();
  const [columnsToExport, setColumnsToExport] = useState<TableColumn<TData>[]>(
    []
  );

  // All states related to creating a saved export.
  const [savedExportName, setSavedExportName] = useState<string>("");
  const [showCreateSavedExportModal, setShowCreateSavedExportModal] =
    useState(false);
  const [loadingCreateSavedExport, setLoadingCreateSavedExport] =
    useState<boolean>(false);

  // States for deleting a saved export
  const [loadingDelete, setLoadingDelete] = useState<boolean>(false);

  // States for updating a saved export
  const [loadingUpdate, setLoadingUpdate] = useState<boolean>(false);

  /**
   * Close the create new saved export modal.
   *
   * Will not close if the create operation is loading.
   */
  const handleCloseCreateSavedExportModal = () => {
    if (loadingCreateSavedExport) {
      return;
    }
    setShowCreateSavedExportModal(false);
  };

  /**
   * Display the create new saved export modal.
   */
  const handleShowCreateSavedExportModal = () =>
    setShowCreateSavedExportModal(true);

  /**
   * Create a new saved export.
   */
  async function createSavedExport() {
    setLoadingCreateSavedExport(true);

    const savedExportObject: SavedExportColumnStructure = {
      columns: convertColumnsToPaths(columnsToExport),
      component: indexName,
      name: savedExportName.trim()
    };

    try {
      await performSaveRequest([
        ...everySavedExport.filter(
          (savedExport) =>
            savedExport.name !== savedExportName.trim() &&
            savedExport.component === indexName
        ),
        savedExportObject
      ]);
    } catch (e) {
      // TODO: Add better error handling...
      console.error(e);
      setLoadingCreateSavedExport(false);
      return;
    }

    // Select the newly created saved export...
    setSelectedSavedExport(savedExportObject);

    setLoadingCreateSavedExport(false);
    handleCloseCreateSavedExportModal();
    setSavedExportName("");
  }

  /**
   * Update the currently selected saved export.
   */
  async function updateSavedExport() {
    // Cannot update a saved export if no saved export is selected.
    if (!selectedSavedExport) {
      return;
    }

    setLoadingUpdate(true);

    const savedExportObject: SavedExportColumnStructure = {
      columns: convertColumnsToPaths(columnsToExport),
      component: indexName,
      name: selectedSavedExport.name
    };

    try {
      await performSaveRequest([
        ...everySavedExport.filter(
          (savedExport) =>
            savedExport.name !== selectedSavedExport.name &&
            savedExport.component === indexName
        ),
        savedExportObject
      ]);
    } catch (e) {
      // TODO: Add better error handling...
      console.error(e);
      setLoadingUpdate(false);
      return;
    }

    setLoadingUpdate(false);
  }

  /**
   * Delete the currently selected saved export.
   */
  async function deleteSavedExport() {
    // Cannot delete a saved export if no saved export is selected.
    if (!selectedSavedExport) {
      return;
    }

    setLoadingDelete(true);

    try {
      await performSaveRequest([
        ...everySavedExport.filter(
          (savedExport) =>
            savedExport.name !== selectedSavedExport.name &&
            savedExport.component === indexName
        )
      ]);
    } catch (e) {
      // TODO: Add better error handling...
      console.error(e);
      setLoadingDelete(false);
      return;
    }

    setLoadingDelete(false);
    setSelectedSavedExport(undefined);
  }

  /**
   * Performs the update/create (depends on the id being null). Also preforms a retrieve to
   * update the list.
   *
   * @param toBeSavedExports The savedExportColumnSelection to be added to the user preferences.
   */
  async function performSaveRequest(toBeSavedExports) {
    // Perform saving request.
    const saveArgs: SaveArgs<UserPreference> = {
      resource: {
        id: userPreferenceID ?? null,
        userId: subject,
        savedExportColumnSelection: toBeSavedExports
      } as any,
      type: "user-preference"
    };
    await save([saveArgs], { apiBaseUrl: "/user-api" });

    // After changes are made perform a reload.
    await retrieveSavedExports();
  }

  /**
   * Retrieve the users user-preferences and find the savedExportColumnSelection
   * filtered for this specific indexName.
   */
  async function retrieveSavedExports() {
    setLoadingSavedExports(true);
    await apiClient
      .get<UserPreference[]>("user-api/user-preference", {
        filter: {
          userId: subject as FilterParam
        }
      })
      .then((response) => {
        setLoadingSavedExports(false);
        setUserPreferenceID(response?.data?.[0]?.id ?? undefined);

        if (response?.data?.[0]?.savedExportColumnSelection) {
          setEverySavedExport(response.data[0].savedExportColumnSelection);
          setAllSavedExports(
            response.data[0].savedExportColumnSelection.filter(
              (savedExport) => savedExport.component === indexName
            )
          );
        }
      })
      .catch((userPreferenceError) => {
        console.error(userPreferenceError);
        setLoadingSavedExports(false);
      });
  }

  function convertColumnsToPaths(columns) {
    return columns.map((column) => column?.id ?? "");
  }

  /**
   * First-load setup
   */
  useEffect(() => {
    retrieveSavedExports();
  }, []);

  const changesMade = !isEqual(
    convertColumnsToPaths(columnsToExport),
    selectedSavedExport?.columns ?? []
  );

  const displayOverrideWarning =
    allSavedExports.find(
      (savedExport) => savedExport.name === savedExportName.trim()
    ) !== undefined;

  const disableCreateButton =
    loadingCreateSavedExport || savedExportName.trim() === "";

  const ModalElement = useMemo(
    () => (
      <Modal
        show={showCreateSavedExportModal}
        onHide={handleCloseCreateSavedExportModal}
        centered={true}
        size="lg"
        scrollable={true}
      >
        <Modal.Header closeButton={!loadingCreateSavedExport}>
          <Modal.Title>Create Saved Export Columns</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {displayOverrideWarning && (
            <Alert variant={"warning"}>
              A saved export exists with the name "{savedExportName}". Creating
              this saved export will replace the existing one.
            </Alert>
          )}

          <strong>Saved Export Name:</strong>
          <input
            className="form-control"
            value={savedExportName}
            onChange={(e) => setSavedExportName(e.target.value)}
            disabled={loadingCreateSavedExport}
          />
          <br />

          <strong>Columns to be saved:</strong>
          {columnsToExport.map((column) => (column as any)?.header())}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={handleCloseCreateSavedExportModal}
            disabled={loadingCreateSavedExport}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={createSavedExport}
            disabled={disableCreateButton}
          >
            {loadingCreateSavedExport ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                />
                <span className="visually-hidden">Loading...</span>
              </>
            ) : (
              <>Create</>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    ),
    [
      showCreateSavedExportModal,
      savedExportName,
      columnsToExport,
      loadingCreateSavedExport
    ]
  );

  return {
    updateSavedExport,
    deleteSavedExport,
    allSavedExports,
    changesMade,
    loadingSavedExports,
    loadingDelete,
    loadingUpdate,
    setSelectedSavedExport,
    selectedSavedExport,
    ModalElement,
    handleShowCreateSavedExportModal,
    columnsToExport,
    setColumnsToExport
  };
}
