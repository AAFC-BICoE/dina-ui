import { useAccount, useApiClient } from "common-ui/lib";
import { KitsuResource } from "kitsu";
import { useEffect, useState, useMemo } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import { TableColumn } from "packages/common-ui/lib/list-page/types";
import _ from "lodash";
import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";
import { DataExportTemplate } from "packages/dina-ui/types/dina-export-api/resources/DataExportTemplate";
import {
  ColumnSeparator,
  ExportType
} from "packages/dina-ui/types/dina-export-api";
import Select from "react-select";
import {
  convertColumnsToAliases,
  convertColumnsToPaths,
  getColumnFunctions
} from "packages/common-ui/lib/column-selector/ColumnSelectorUtils";

export const VISIBILITY_OPTIONS: {
  label: JSX.Element;
  value: {
    restrictToCreatedBy: boolean;
    publiclyReleasable: boolean;
  };
}[] = [
  {
    label: <DinaMessage id="visibleToUser" />,
    value: { restrictToCreatedBy: true, publiclyReleasable: false }
  },
  {
    label: <DinaMessage id="visibleToGroup" />,
    value: { restrictToCreatedBy: false, publiclyReleasable: false }
  },
  {
    label: <DinaMessage id="visibleToEveryone" />,
    value: { restrictToCreatedBy: false, publiclyReleasable: true }
  }
];

export interface UseSavedExportsProp {
  exportType: ExportType;
  selectedSeparator: {
    value: ColumnSeparator;
    label: string;
  };
  entityLink?: string;
}

export default function useSavedExports<TData extends KitsuResource>({
  exportType,
  selectedSeparator,
  entityLink
}: UseSavedExportsProp) {
  const { apiClient } = useApiClient();
  const { groupNames } = useAccount();

  const [allSavedExports, setAllSavedExports] = useState<DataExportTemplate[]>(
    []
  );

  const [loadingSavedExports, setLoadingSavedExports] = useState<boolean>(true);

  // Currently selected states...
  const [selectedSavedExport, setSelectedSavedExport] =
    useState<DataExportTemplate>();

  const [columnsToExport, setColumnsToExport] = useState<TableColumn<TData>[]>(
    []
  );

  const [restrictToCreatedBy, setRestrictToCreatedBy] = useState<boolean>(true);

  const [publiclyReleasable, setPubliclyReleaseable] = useState<boolean>(false);

  // Selected paths to be loaded in as columnToExport.
  const [columnPathsToExport, setColumnPathsToExport] =
    useState<DataExportTemplate>();

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
    // Do not create if we are displaying the override warning.
    if (displayOverrideWarning) {
      return;
    }

    setLoadingCreateSavedExport(true);

    try {
      const createdDataExport = await performCreateSavedExport();
      // Select the newly created saved export...
      setSelectedSavedExport(createdDataExport);
    } catch (e) {
      console.error(e);
      setLoadingCreateSavedExport(false);
      return;
    }

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

    try {
      const updatedSavedExport = await performUpdateSavedExport();
      // Select the newly updated saved export...
      setSelectedSavedExport(updatedSavedExport);
    } catch (e) {
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
    setSelectedSavedExport(undefined);
    try {
      await performDeleteSavedExport();
    } catch (e) {
      console.error(e);
      setLoadingDelete(false);
      return;
    }

    setLoadingDelete(false);
  }

  /**
   * Patch selected savedExport and retrieves updated exports from back end
   *
   * @param savedExport The savedExportColumnSelection to be added to the user preferences.
   */
  async function performUpdateSavedExport(): Promise<DataExportTemplate> {
    const columnFunctions = getColumnFunctions(columnsToExport);
    const entityKey = entityLink
      ? entityLink.split("/").pop()
      : Object.keys(selectedSavedExport?.schema ?? {})[0];

    if (!entityKey) {
      throw new Error(
        "Cannot determine entity key for export update. No entityLink or schema provided."
      );
    }

    const updatedSavedExportResp = await apiClient.axios.patch(
      `/dina-export-api/data-export-template/${selectedSavedExport?.id}`,
      {
        data: {
          id: selectedSavedExport?.id,
          type: selectedSavedExport?.type,
          attributes: {
            schema: {
              [entityKey]: {
                columns: convertColumnsToPaths(columnsToExport),
                aliases: convertColumnsToAliases(columnsToExport)
              }
            },
            name: selectedSavedExport?.name,
            restrictToCreatedBy: restrictToCreatedBy,
            publiclyReleasable: publiclyReleasable,
            exportType: exportType,
            exportOptions: { columnSeparator: selectedSeparator.value },
            functions:
              Object.keys(columnFunctions ?? {}).length === 0
                ? undefined
                : columnFunctions
          }
        }
      },
      {
        headers: {
          "Content-Type": "application/vnd.api+json"
        }
      }
    );

    // After changes are made perform a reload.
    await retrieveSavedExports();

    return {
      id: updatedSavedExportResp.data.data.id,
      type: updatedSavedExportResp.data.data.type,
      ...updatedSavedExportResp.data.data.attributes
    };
  }

  /**
   * Deletes savedExport and retrieves updated exports from back end
   *
   * @param savedExport The savedExportColumnSelection to be added to the user preferences.
   */
  async function performDeleteSavedExport() {
    await apiClient.axios.delete(
      `/dina-export-api/data-export-template/${selectedSavedExport?.id}`
    );

    // After changes are made perform a reload.
    await retrieveSavedExports();
  }

  /**
   * Creates savedExport and retrieves updated exports from back end
   *
   * @param savedExport The savedExportColumnSelection to be added to the user preferences.
   */
  async function performCreateSavedExport(): Promise<DataExportTemplate> {
    const columnFunctions = getColumnFunctions(columnsToExport);
    const entityKey = entityLink
      ? entityLink.split("/").pop()
      : Object.keys(selectedSavedExport?.schema ?? {})[0];

    if (!entityKey) {
      throw new Error(
        "Cannot determine entity key for export creation. No entityLink or schema provided."
      );
    }

    const createdSavedExportResp = await apiClient.axios.post(
      `/dina-export-api/data-export-template`,
      {
        data: {
          type: "data-export-template",
          attributes: {
            schema: {
              [entityKey]: {
                columns: convertColumnsToPaths(columnsToExport),
                aliases: convertColumnsToAliases(columnsToExport)
              }
            },
            name: savedExportName.trim(),
            restrictToCreatedBy: restrictToCreatedBy,
            publiclyReleasable: publiclyReleasable,
            exportType: exportType,
            exportOptions: { columnSeparator: selectedSeparator.value },
            group: groupNames?.[0],
            functions:
              Object.keys(columnFunctions ?? {}).length === 0
                ? undefined
                : columnFunctions
          }
        }
      },
      {
        headers: {
          "Content-Type": "application/vnd.api+json"
        }
      }
    );

    // After changes are made perform a reload.
    await retrieveSavedExports();
    return {
      id: createdSavedExportResp.data.data.id,
      type: createdSavedExportResp.data.data.type,
      ...createdSavedExportResp.data.data.attributes
    };
  }

  /**
   * MIGRATION: For legacy records with columnFunctions, convert them to the new
   * "functions" format and clear the old "columnFunctions" on the backend.
   *
   * This sends a minimal PATCH: only "functions" and "columnFunctions".
   */
  async function performSavedExportMigration(
    migratedExport: DataExportTemplate
  ): Promise<void> {
    await apiClient.axios.patch(
      `/dina-export-api/data-export-template/${migratedExport.id}`,
      {
        data: {
          id: migratedExport.id,
          type: migratedExport.type,
          attributes: {
            // New functions state to persist:
            functions: (migratedExport as any).functions,
            // Clear legacy field on the backend:
            columnFunctions: {}
          }
        }
      },
      {
        headers: {
          "Content-Type": "application/vnd.api+json"
        }
      }
    );

    // Reload so local state is in sync with the backend:
    await retrieveSavedExports();
  }

  /**
   * Retrieve the users user-preferences and find the savedExportColumnSelection
   * filtered for this specific indexName.
   */
  async function retrieveSavedExports() {
    setLoadingSavedExports(true);
    await apiClient
      .get<DataExportTemplate[]>("dina-export-api/data-export-template", {
        filter: {
          group: groupNames?.[0] ?? ""
        }
      })
      .then((response) => {
        setLoadingSavedExports(false);
        setAllSavedExports(response.data);
      })
      .catch((error) => {
        console.error(error);
        setLoadingSavedExports(false);
      });
  }

  /**
   * First-load setup
   */
  useEffect(() => {
    retrieveSavedExports();
  }, []);

  /**
   * When the user selects a saved export, load the columns in...
   */
  useEffect(() => {
    if (selectedSavedExport) {
      // MIGRATION CODE: Handle legacy saved exports with column functions.
      const legacyColumnFunctions = (selectedSavedExport as any)
        .columnFunctions;

      if (legacyColumnFunctions && Object.keys(legacyColumnFunctions).length) {
        // Build a new "functions" object from legacyColumnFunctions:
        const newFunctions: Record<string, any> = {
          ...(selectedSavedExport as any).functions
        };

        Object.entries(legacyColumnFunctions).forEach(
          ([functionKey, legacyDef]: [string, any]) => {
            const { functionName, params } = legacyDef;

            const newFunc: any = {
              functionDef: functionName,
              params: {}
            };

            if (functionName === "CONCAT") {
              newFunc.params.items = params;
            } else if (functionName === "CONVERT_COORDINATES_DD") {
              newFunc.params = { column: "collectingEvent.eventGeom" };
            }

            newFunctions[functionKey] = newFunc;
          }
        );

        const migratedExport: any = {
          ...selectedSavedExport,
          // Clear legacy field and set new one:
          columnFunctions: {} as any,
          functions: newFunctions as any
        };

        // Sync all related state with the migrated export
        setSelectedSavedExport(migratedExport);
        setColumnPathsToExport(migratedExport);
        setRestrictToCreatedBy(
          migratedExport.restrictToCreatedBy ?? restrictToCreatedBy
        );
        setPubliclyReleaseable(
          migratedExport.publiclyReleasable ?? publiclyReleasable
        );

        // Now persist the migrated object to the backend
        performSavedExportMigration(migratedExport);
      } else {
        // No migration needed, just load the saved export:
        setColumnPathsToExport(selectedSavedExport);
      }
    }
  }, [selectedSavedExport]);

  const [changesMade, setChangesMade] = useState<boolean>(false);

  useEffect(() => {
    const columnsToExportPaths = convertColumnsToPaths(columnsToExport);
    const columnsToExportAliases = convertColumnsToAliases(columnsToExport);

    // Extract columns and aliases from the schema (first entity key)
    const entityKey = entityLink
      ? entityLink.split("/").pop()
      : Object.keys(selectedSavedExport?.schema ?? {})[0];

    setChangesMade(
      !_.isEqual(
        columnsToExportPaths,
        selectedSavedExport?.schema?.[entityKey ?? ""]?.columns ?? []
      ) ||
        !_.isEqual(
          columnsToExportAliases,
          selectedSavedExport?.schema?.[entityKey ?? ""]?.aliases ?? []
        )
    );
  }, [columnsToExport]);

  const displayOverrideWarning =
    allSavedExports.find(
      (savedExport) => savedExport.name === savedExportName.trim()
    ) !== undefined;

  const disableCreateButton =
    loadingCreateSavedExport ||
    savedExportName.trim() === "" ||
    displayOverrideWarning;

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
          <Modal.Title>
            <DinaMessage id="savedExport_createTitle" />
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <strong>
            <DinaMessage id="savedExport_createName" />
          </strong>
          <input
            className={`form-control${
              displayOverrideWarning ? " is-invalid" : ""
            }`}
            value={savedExportName}
            onChange={(e) => setSavedExportName(e.target.value)}
            disabled={loadingCreateSavedExport}
          />
          {displayOverrideWarning && (
            <div className="invalid-feedback" style={{ display: "block" }}>
              <DinaMessage
                id="savedExport_overrideWarning"
                values={{ savedExportName }}
              />
            </div>
          )}
          <br />
          <strong>
            <DinaMessage id="visibility" />
          </strong>
          <Select<{
            label: JSX.Element;
            value: {
              restrictToCreatedBy: boolean;
              publiclyReleasable: boolean;
            };
          }>
            className="mt-2 mb-3"
            name="visibility"
            options={VISIBILITY_OPTIONS}
            onChange={(selected) => {
              setRestrictToCreatedBy(selected!.value.restrictToCreatedBy);
              setPubliclyReleaseable(selected!.value.publiclyReleasable);
            }}
            defaultValue={VISIBILITY_OPTIONS[0]}
          />

          <strong>
            <DinaMessage id="savedExport_columnsToBeSaved" />
          </strong>
          {columnsToExport.map((column) => (
            <div key={column?.id ?? ""}>{(column as any)?.header()}</div>
          ))}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={handleCloseCreateSavedExportModal}
            disabled={loadingCreateSavedExport}
          >
            <DinaMessage id="cancelButtonText" />
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
                <span className="visually-hidden">
                  <DinaMessage id="loadingSpinner" />
                </span>
              </>
            ) : (
              <DinaMessage id="create" />
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    ),
    [
      showCreateSavedExportModal,
      savedExportName,
      columnsToExport,
      loadingCreateSavedExport,
      publiclyReleasable,
      restrictToCreatedBy
    ]
  );

  return {
    updateSavedExport,
    deleteSavedExport,
    allSavedExports,
    changesMade,
    setChangesMade,
    loadingSavedExports,
    loadingDelete,
    loadingUpdate,
    setSelectedSavedExport,
    selectedSavedExport,
    ModalElement,
    handleShowCreateSavedExportModal,
    columnsToExport,
    setColumnsToExport,
    columnPathsToExport,
    setColumnPathsToExport,
    setRestrictToCreatedBy,
    setPubliclyReleaseable
  };
}
