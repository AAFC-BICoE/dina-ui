import { useAccount, useApiClient } from "common-ui/lib";
import { UserPreference } from "../../../types/user-api";
import { FilterParam, KitsuResource } from "kitsu";
import { useEffect, useState, useMemo } from "react";
import { SavedExportColumnStructure } from "./types";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import { TableColumn } from "packages/common-ui/lib/list-page/types";

export interface UseSavedExportsProp {
  indexName: string;
}

export function useSavedExports<TData extends KitsuResource>({
  indexName
}: UseSavedExportsProp) {
  const { save, apiClient } = useApiClient();
  const { subject } = useAccount();

  const [userPreferenceID, setUserPreferenceID] = useState<string>();
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
  const handleCloseCreateSavedExportModal = () => {
    if (loadingCreateSavedExport) {
      return;
    }

    setShowCreateSavedExportModal(false);
  };
  const handleShowCreateSavedExportModal = () =>
    setShowCreateSavedExportModal(true);

  function createSavedExport() {
    setLoadingCreateSavedExport(true);
  }

  function updateSavedExport() {
    // Cannot update a saved export if no saved export is selected.
    if (!selectedSavedExport) {
      return;
    }
  }

  function deleteSavedExport() {
    // Cannot delete a saved export if no saved export is selected.
    if (!selectedSavedExport) {
      return;
    }
  }

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

  useEffect(() => {
    retrieveSavedExports();
  }, []);

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
    loadingSavedExports,
    setSelectedSavedExport,
    selectedSavedExport,
    ModalElement,
    handleShowCreateSavedExportModal,
    columnsToExport,
    setColumnsToExport
  };
}
