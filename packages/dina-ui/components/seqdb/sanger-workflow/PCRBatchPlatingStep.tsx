import { ButtonBar, DinaForm, SubmitButton, withResponse } from "common-ui";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { useState, useEffect } from "react";

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
      <div
        className="mb-3"
        // Give this section enough min height so you don't lose your scroll position when changing tabs:
        style={{ minHeight: "70rem" }}
      >
        <Tabs>
          <TabList>
            <Tab>Substep 1: Library Prep Details Table</Tab>
            <Tab>Substep 2: Container Grid</Tab>
            <Tab>Substep 3: Index Assignment</Tab>
          </TabList>
          {/* <TabPanel>
            <LibraryPrepBulkEditor
              chain={chain}
              editMode="DETAILS"
              libraryPrepBatch={libraryPrepBatch}
              sampleSelectionStep={sampleSelectionStep}
            />
          </TabPanel> */}
          <TabPanel>
          <p>My First Paragraph</p>
            {/* <SampleGrid
              chain={chain}
              libraryPrepBatch={libraryPrepBatch}
              sampleSelectionStep={sampleSelectionStep}
            /> */}
          </TabPanel>
          <TabPanel>
            <Tabs>
              <TabList>
                <Tab>Assign by grid</Tab>
                <Tab>Assign by table</Tab>
              </TabList>
              <TabPanel>
                <p>My First Paragraph</p>
              </TabPanel>
              {/* <TabPanel>
                <LibraryPrepBulkEditor
                  chain={chain}
                  editMode="INDEX"
                  libraryPrepBatch={libraryPrepBatch}
                  sampleSelectionStep={sampleSelectionStep}
                />
              </TabPanel> */}
            </Tabs>
          </TabPanel>
        </Tabs>
      </div>
    </>
    ) : ( <p>My First Paragraph</p>);

    
}

