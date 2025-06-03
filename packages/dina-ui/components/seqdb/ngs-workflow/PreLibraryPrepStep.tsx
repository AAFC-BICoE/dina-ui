import {
  DoOperationsError,
  LoadingSpinner,
  filterBy,
  useAccount,
  useApiClient
} from "common-ui";
import { PersistedResource } from "kitsu";
import _ from "lodash";
import { useEffect, useState, Dispatch, SetStateAction } from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { SeqdbMessage } from "../../../intl/seqdb-intl";
import { MaterialSample } from "../../../types/collection-api";
import {
  LibraryPrep,
  LibraryPrepBatch,
  PreLibraryPrep
} from "../../../types/seqdb-api";
import { PreLibraryPrepTable } from "./PreLibraryPrepTable";

export interface PreLibraryPrepStepProps {
  batchId: string;
  batch: LibraryPrepBatch;
  onSaved: (
    nextStep: number,
    batchSaved?: PersistedResource<LibraryPrepBatch>
  ) => Promise<void>;
  editMode: boolean;
  setEditMode: Dispatch<SetStateAction<boolean>>;
  performSave: boolean;
  setPerformSave: (newValue: boolean) => void;
}

export function PreLibraryPrepStep({
  batchId,
  batch,
  editMode,
  setEditMode,
  onSaved,
  performSave,
  setPerformSave
}: PreLibraryPrepStepProps) {
  const { apiClient, bulkGet, save } = useApiClient();
  const { username } = useAccount();

  // Check if a save was requested from the top level button bar.
  useEffect(() => {
    async function performSaveInternal() {
      await savePreLibraryPreps();
      setPerformSave(false);
      await onSaved(4);
    }

    if (performSave) {
      performSaveInternal();
    }
  }, [performSave]);

  const [shearingPrepLibraryPreps, setShearingPrepLibraryPreps] = useState<
    PreLibraryPrep[] | undefined
  >(undefined);
  const [sizeSelectionPrepLibraryPreps, setSizeSelectionPrepLibraryPreps] =
    useState<PreLibraryPrep[] | undefined>(undefined);

  /**
   * When the page is first loaded, check if saved samples has already been chosen and reload them.
   */
  useEffect(() => {
    fetchPreLibraryPreps();
  }, [editMode]);

  async function fetchPreLibraryPreps() {
    // fetch all libraryPrep IDs
    const libraryPreps = (
      await apiClient.get<LibraryPrep[]>("/seqdb-api/library-prep", {
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
    const materialSamples = _.compact(
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
    const savedPreLibraryPreps = await apiClient.get<PreLibraryPrep[]>(
      "seqdb-api/pre-library-prep",
      {
        filter: {
          rsql: libraryPrepIds.length
            ? `libraryPrep.uuid=in=(${libraryPrepIds})`
            : ""
        },
        include: "libraryPrep,product,protocol",
        page: { limit: 1000 }
      }
    );

    // Find newly added libraryPrep IDs and prepare new PreLibraryPreps to add
    const newPreLibraryIds = libraryPrepIds.filter(
      (id) =>
        savedPreLibraryPreps.data.filter((item) => item.libraryPrep.id === id)
          .length === 0
    );

    const newShearingPrepLibraryPreps: PreLibraryPrep[] = newPreLibraryIds.map(
      (newId) => ({
        type: "pre-library-prep",
        preLibraryPrepType: "SHEARING",
        createdBy: username,
        group: batch.group,
        libraryPrep: libraryPreps.find(
          (item) => item.id === newId
        ) as LibraryPrep
      })
    );
    const newSizeSelectionPrepLibraryPreps: PreLibraryPrep[] =
      newPreLibraryIds.map((newId) => ({
        type: "pre-library-prep",
        preLibraryPrepType: "SIZE_SELECTION",
        createdBy: username,
        group: batch.group,
        libraryPrep: libraryPreps.find(
          (item) => item.id === newId
        ) as LibraryPrep
      }));

    for (const item of savedPreLibraryPreps.data) {
      const libraryPrep = libraryPreps.find(
        (lp) => lp.id === item.libraryPrep.id
      );
      if (libraryPrep) {
        item.libraryPrep = libraryPrep;
      }
      if (item.preLibraryPrepType === "SHEARING") {
        newShearingPrepLibraryPreps.push(item);
      } else {
        newSizeSelectionPrepLibraryPreps.push(item);
      }
    }

    setShearingPrepLibraryPreps(newShearingPrepLibraryPreps);
    setSizeSelectionPrepLibraryPreps(newSizeSelectionPrepLibraryPreps);
  }

  async function savePreLibraryPreps() {
    try {
      const resources = [
        ...(shearingPrepLibraryPreps ?? []),
        ...(sizeSelectionPrepLibraryPreps ?? [])
      ].map((item) => {
        (item as any).relationships = {};
        if (item.libraryPrep) {
          (item as any).relationships.libraryPrep = {
            data: {
              id: item.libraryPrep.id,
              type: "library-prep"
            }
          };
          delete (item as any).libraryPrep;
        }

        if (item.product) {
          (item as any).relationships.product = {
            data: {
              id: item.product.id,
              type: "product"
            }
          };
          delete item.product;
        }
        if (item.protocol) {
          (item as any).relationships.protocol = {
            data: {
              id: item.protocol.id,
              type: "protocol"
            }
          };
          delete item.protocol;
        }
        if (!item.id) {
          item.createdBy = username;
        }
        return { resource: item, type: item.type };
      });

      await save(resources, { apiBaseUrl: "seqdb-api/pre-library-prep" });
      setEditMode(false);
    } catch (e) {
      if (e.toString() === "Error: Access is denied") {
        throw new DoOperationsError("Access is denied");
      }
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
