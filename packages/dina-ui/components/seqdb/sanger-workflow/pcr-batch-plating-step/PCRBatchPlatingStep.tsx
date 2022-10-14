import { ButtonBar, DinaForm, filterBy, SubmitButton, useApiClient, withResponse } from "common-ui";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { useState, useEffect } from "react";
import { PCRBatchItemGrid } from "./PCRBatchItemGrid";
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

    /**
   * When the page is first loaded, check if saved samples has already been chosen and reload them.
   */
     useEffect(() => {setEditMode(true)
    });
  
    return editMode ? (
      <>
      <h2>PCR Batch Item Plating</h2>
      <button
        className="btn btn-primary mb-3"
        onClick={() => (true)}
        type="button"
      >
        Edit PCR Batch Item Grid
      </button>
      <div className="mb-3">
      <p>My First Paragraph</p>
      </div>
          <PCRBatchItemGrid
            pcrBatchId = {pcrBatchId}
          />
        </>
    ) : ( <p>Test</p>);  
}

