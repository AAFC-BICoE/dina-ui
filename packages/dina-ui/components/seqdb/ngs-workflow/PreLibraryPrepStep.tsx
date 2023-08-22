import { useLocalStorage } from "@rehooks/local-storage";
import {
  DoOperationsError,
  LoadingSpinner,
  QueryPage,
  SaveArgs,
  filterBy,
  useAccount,
  useApiClient
} from "common-ui";
import { KitsuResource, PersistedResource } from "kitsu";
import { compact, concat, difference, pick, uniq } from "lodash";
import { useEffect, useState } from "react";
import { SeqdbMessage } from "../../../intl/seqdb-intl";
import {
  MaterialSample,
  MaterialSampleSummary
} from "../../../types/collection-api";
import {
  LibraryPrep2,
  LibraryPrepBatch2,
  PreLibraryPrep2,
  PreLibraryPrepType
} from "../../../types/seqdb-api";
import { useMaterialSampleRelationshipColumns } from "../../collection/material-sample/useMaterialSampleRelationshipColumns";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";
import { PreLibraryPrepTable } from "./PreLibraryPrepTable";

export interface PreLibraryPrepStepProps {
  batchId: string;
  batch: LibraryPrepBatch2;
  onSaved: (
    nextStep: number,
    batchSaved?: PersistedResource<LibraryPrepBatch2>
  ) => Promise<void>;
  editMode: boolean;
  performSave: boolean;
  setPerformSave: (newValue: boolean) => void;
}

export function PreLibraryPrepStep({
  batchId,
  batch,
  editMode,
  onSaved,
  performSave,
  setPerformSave
}: PreLibraryPrepStepProps) {
  const { apiClient, bulkGet, save } = useApiClient();
  const { username } = useAccount();

  // Check if a save was requested from the top level button bar.
  useEffect(() => {
    async function performSaveInternal() {
      await saveLibraryPrep();
      setPerformSave(false);
      await onSaved(2);
    }

    if (performSave) {
      performSaveInternal();
    }
  }, [performSave]);

  const [shearingPrepLibraryPreps, setShearingPrepLibraryPreps] = useState<
    PreLibraryPrep2[] | undefined
  >(undefined);
  const [sizeSelectionPrepLibraryPreps, setSizeSelectionPrepLibraryPreps] =
    useState<PreLibraryPrep2[] | undefined>(undefined);

  /**
   * When the page is first loaded, check if saved samples has already been chosen and reload them.
   */
  useEffect(() => {
    fetchPreLibraryPreps();
  }, [editMode]);

  async function fetchPreLibraryPreps() {
    // fetch all libraryPrep IDs
    const libraryPreps = (
      await apiClient.get<LibraryPrep2[]>("/seqdb-api/library-prep", {
        filter: filterBy([], {
          extraFilters: [
            {
              selector: "libraryPrepBatch.uuid",
              comparison: "==",
              arguments: batchId
            }
          ]
        })(""),
        include: "materialSample,libraryPrepBatch",
        page: {
          limit: 1000 // Maximum page size.
        }
      })
    ).data;
    const materialSampleIds = libraryPreps.map(
      (item) => item.materialSample?.id
    );
    // Fetch all materialSample names
    const materialSamples = compact(
      await bulkGet<MaterialSample>(
        materialSampleIds.map((id) => `/material-sample/${id}`),
        { apiBaseUrl: "/collection-api" }
      )
    );
    for (const item of libraryPreps) {
      item.materialSample = materialSamples.find(
        (sample) => sample.id === item.materialSample?.id
      );
    }

    // Fetch all previously saved PreLibraryPreps
    const libraryPrepIds = libraryPreps.map((item) => item.id);
    const preLibraryPreps = compact(
      await bulkGet<PreLibraryPrep2>(
        libraryPrepIds.map(
          (id) =>
            `/pre-library-prep?filter[rsql]=libraryPrep.uuid==${id}&include=libraryPrep`
        ),
        { apiBaseUrl: "/seqdb-api" }
      )
    );

    // Find newly added libraryPrep IDs and prepare new PreLibraryPreps to add
    const newPreLibraryIds = libraryPrepIds.filter(
      (id) =>
        preLibraryPreps.filter((item) => item.libraryPrep.id === id).length ===
        0
    );

    const newShearingPrepLibraryPreps: PreLibraryPrep2[] = newPreLibraryIds.map(
      (newId) => ({
        type: "pre-library-prep",
        preLibraryPrepType: "SHEARING",
        createdBy: username,
        group: batch.group,
        libraryPrep: libraryPreps.find(
          (item) => item.id === newId
        ) as LibraryPrep2
      })
    );
    const newSizeSelectionPrepLibraryPreps: PreLibraryPrep2[] =
      newPreLibraryIds.map((newId) => ({
        type: "pre-library-prep",
        preLibraryPrepType: "SIZE_SELECTION",
        createdBy: username,
        group: batch.group,
        libraryPrep: libraryPreps.find(
          (item) => item.id === newId
        ) as LibraryPrep2
      }));

    for (const item of preLibraryPreps) {
      if (item.preLibraryPrepType === "SHEARING") {
        newShearingPrepLibraryPreps.push(item);
      } else {
        newSizeSelectionPrepLibraryPreps.push(item);
      }
    }

    setShearingPrepLibraryPreps(newShearingPrepLibraryPreps);
    setSizeSelectionPrepLibraryPreps(newSizeSelectionPrepLibraryPreps);
  }

  async function saveLibraryPrep() {
    try {
      const { data: libraryPrepBatch } = await apiClient.get<LibraryPrepBatch2>(
        `seqdb-api/library-prep-batch/${batchId}`,
        {}
      );
    } catch (e) {
      if (e.toString() === "Error: Access is denied") {
        throw new DoOperationsError("Access is denied");
      }
    } finally {
      // setEditMode(false);
    }
  }

  // Wait until selected resources are loaded.
  if (!shearingPrepLibraryPreps || !sizeSelectionPrepLibraryPreps) {
    return <LoadingSpinner loading={true} />;
  }
  return (
    <div>
      <>
        <strong>
          <SeqdbMessage id="preLibraryPrep" />
        </strong>
        <Tabs>
          <TabList>
            <Tab>
              <DinaMessage id="shearingDetails" />
            </Tab>
            <Tab>
              <DinaMessage id="sizeSelectionDetails" />
            </Tab>
          </TabList>
          <TabPanel>
            <PreLibraryPrepTable
              readOnly={!editMode}
              data={shearingPrepLibraryPreps}
              setData={setShearingPrepLibraryPreps}
            />
          </TabPanel>
          <TabPanel>
            <PreLibraryPrepTable
              readOnly={!editMode}
              data={sizeSelectionPrepLibraryPreps}
              setData={setSizeSelectionPrepLibraryPreps}
            />
          </TabPanel>
        </Tabs>
      </>
    </div>
  );
}
