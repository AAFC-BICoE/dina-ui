import { ButtonBar, DinaForm, filterBy, SubmitButton, useApiClient, withResponse } from "common-ui";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { useState, useEffect } from "react";
import { SampleGrid } from "../../workflow/library-prep/container-grid/SampleGrid";
import { ContainerGrid } from "./ContainerGrid";
import { DraggableSampleList } from "./DraggablePCRBatchItemList";
import { PcrBatchItem } from "packages/dina-ui/types/seqdb-api";
import { PersistedResource } from "kitsu";

export interface PCRBatchPlatingStepProps {
    pcrBatchId: string;
  }

export function PCRBatchPlatingStep({
    pcrBatchId
}: PCRBatchPlatingStepProps) {

  // State to keep track if in edit mode.
  const [editMode, setEditMode] = useState(false);
  const { apiClient } = useApiClient();
  const [selectedSamples, setSelectedSamples] = useState<PcrBatchItem[]>([]);
  const [movedSamples, setMovedSamples] = useState<PcrBatchItem[]>([]);
  const [availableSamples, setAvailableSamples] = useState<PcrBatchItem[]>([]);
  function onListDrop(sample: PcrBatchItem) {
    return null;
  }
  function onSampleClick(sample, e) {
    return null;
  }
  async function fetchSampledIds() {
    await apiClient
      .get<PcrBatchItem[]>("/seqdb-api/pcr-batch-item", {
        filter: filterBy([], {
          extraFilters: [
            {
              selector: "pcrBatch.uuid",
              comparison: "==",
              arguments: pcrBatchId
            }
          ]
        })(""),
        include: "materialSample"
      })
      .then((response) => {
        const pcrBatchItems: PersistedResource<PcrBatchItem>[] =
          response?.data?.filter(
            (item) => item?.materialSample?.id !== undefined
          );
        const materialSampleIds: string[] =
          pcrBatchItems.map((item) => item?.materialSample?.id as string) ?? [];

        setAvailableSamples(pcrBatchItems);
      });
  }


  /**
   * Taking all of the material sample UUIDs, retrieve the materi
  
    /**
   * When the page is first loaded, check if saved samples has already been chosen and reload them.
   */
     useEffect(() => {setEditMode(true)
    });
  
    return editMode ? (
      <>
      <h2>Library Prep Batch</h2>
      <button
        className="btn btn-primary mb-3"
        onClick={() => (true)}
        type="button"
      >
        Edit Batch Details
      </button>
      <div className="mb-3">
      <p>My First Paragraph</p>
      </div>
      <div className="mb-3 list-inline">
          <a className="list-inline-item btn btn-primary">
            Library Prep Worksheet With Table
          </a>
          <a className="list-inline-item btn btn-primary">
            Library Prep Worksheet With Grid
          </a>
      </div>
      <div className="row">
        <div className="col-2">
          <strong>Selected samples ({availableSamples.length} in list)</strong>
          <DraggableSampleList
            availableItems={availableSamples}
            selectedItems={selectedSamples}
            movedItems={movedSamples}
            onClick={onSampleClick}
            onDrop={onListDrop}
          />
        </div>
        </div>
        </>
    ) : ( <p>My First Paragraph</p>);  
}

