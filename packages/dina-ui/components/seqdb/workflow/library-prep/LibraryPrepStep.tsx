import { LoadingSpinner, useQuery } from "common-ui";
import Link from "next/link";
import { useState } from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { StepResource } from "../../../../types/seqdb-api";
import { StepRendererProps } from "../StepRenderer";
import { SampleGrid } from "./container-grid/SampleGrid";
import { IndexGrid } from "./index-grid/IndexGrid";
import { LibraryPrepBatchDetails } from "./LibraryPrepBatchDetails";
import { LibraryPrepBatchForm } from "./LibraryPrepBatchForm";
import { LibraryPrepBulkEditor } from "./LibraryPrepBulkEditor";

export function LibraryPrepStep(props: StepRendererProps) {
  const { chain, chainStepTemplates, step } = props;

  const sampleSelectionStep =
    chainStepTemplates[chainStepTemplates.indexOf(step) - 2];

  const [lastSave, setLastSave] = useState(Date.now());
  const [editBatchDetails, setEditBatchDetails] = useState(false);

  const { loading, response } = useQuery<StepResource[]>(
    {
      fields: {
        "index-set": "name",
        product: "name",
        protocol: "name",
        "thermocycler-profile": "name"
      },
      filter: {
        "chain.uuid": chain.id as string,
        "chainStepTemplate.uuid": step.id as string
      },
      include:
        "libraryPrepBatch,libraryPrepBatch.product,libraryPrepBatch.protocol,libraryPrepBatch.containerType,libraryPrepBatch.thermocyclerProfile,libraryPrepBatch.indexSet",
      path: "seqdb-api/step-resource"
    },
    {
      deps: [lastSave]
    }
  );

  if (loading) {
    return <LoadingSpinner loading={true} />;
  }

  const libraryPrepBatch =
    response && response.data[0]
      ? response.data[0].libraryPrepBatch
      : undefined;

  if (
    response &&
    (!response.data.length || (response.data && editBatchDetails))
  ) {
    return (
      <LibraryPrepBatchForm
        chain={chain}
        libraryPrepBatch={libraryPrepBatch}
        step={step}
        onSuccess={() => {
          setEditBatchDetails(false);
          setLastSave(Date.now());
        }}
      />
    );
  }

  if (response && libraryPrepBatch) {
    const stepResource = response.data[0];

    return (
      <>
        <h2>Library Prep Batch</h2>
        <button
          className="btn btn-primary mb-3"
          onClick={() => setEditBatchDetails(true)}
          type="button"
        >
          Edit Batch Details
        </button>
        <div className="mb-3">
          <LibraryPrepBatchDetails libraryPrepBatch={libraryPrepBatch} />
        </div>
        <div className="mb-3 list-inline">
          <Link
            href={`/seqdb/workflow/library-prep-worksheet?stepResourceId=${stepResource.id}&sampleLayout=table`}
          >
            <a className="list-inline-item btn btn-primary" target="_blank">
              Library Prep Worksheet With Table
            </a>
          </Link>
          <Link
            href={`/seqdb/workflow/library-prep-worksheet?stepResourceId=${stepResource.id}&sampleLayout=grid`}
          >
            <a className="list-inline-item btn btn-primary" target="_blank">
              Library Prep Worksheet With Grid
            </a>
          </Link>
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
            <TabPanel>
              <LibraryPrepBulkEditor
                chain={chain}
                editMode="DETAILS"
                libraryPrepBatch={libraryPrepBatch}
                sampleSelectionStep={sampleSelectionStep}
              />
            </TabPanel>
            <TabPanel>
              <SampleGrid
                chain={chain}
                libraryPrepBatch={libraryPrepBatch}
                sampleSelectionStep={sampleSelectionStep}
              />
            </TabPanel>
            <TabPanel>
              <Tabs>
                <TabList>
                  <Tab>Assign by grid</Tab>
                  <Tab>Assign by table</Tab>
                </TabList>
                <TabPanel>
                  <IndexGrid libraryPrepBatch={libraryPrepBatch} />
                </TabPanel>
                <TabPanel>
                  <LibraryPrepBulkEditor
                    chain={chain}
                    editMode="INDEX"
                    libraryPrepBatch={libraryPrepBatch}
                    sampleSelectionStep={sampleSelectionStep}
                  />
                </TabPanel>
              </Tabs>
            </TabPanel>
          </Tabs>
        </div>
      </>
    );
  }

  return null;
}
