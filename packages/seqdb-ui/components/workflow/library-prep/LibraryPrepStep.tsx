import { LoadingSpinner, useQuery } from "common-ui";
import Link from "next/link";
import { useState } from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { StepResource } from "../../../types/seqdb-api";
import { StepRendererProps } from "../StepRenderer";
import { SampleGrid } from "./container-grid/SampleGrid";
import { IndexGrid } from "./index-grid/IndexGrid";
import { IndexAssignmentTable } from "./IndexAssignmentTable";
import { LibraryPrepBatchDetails } from "./LibraryPrepBatchDetails";
import { LibraryPrepBatchForm } from "./LibraryPrepBatchForm";
import { LibraryPrepEditTable } from "./LibraryPrepEditTable";

export function LibraryPrepStep(props: StepRendererProps) {
  const { chain, chainStepTemplates, step } = props;

  const sampleSelectionStep =
    chainStepTemplates[chainStepTemplates.indexOf(step) - 2];

  const [lastSave, setLastSave] = useState(Date.now());
  const [editBatchDetails, setEditBatchDetails] = useState(false);

  const { loading, response } = useQuery<StepResource[]>(
    {
      fields: {
        indexSet: "name",
        product: "name",
        protocol: "name",
        thermocyclerprofile: "name"
      },
      filter: {
        "chain.chainId": chain.id,
        "chainStepTemplate.chainStepTemplateId": step.id
      },
      include:
        "libraryPrepBatch,libraryPrepBatch.product,libraryPrepBatch.protocol,libraryPrepBatch.containerType,libraryPrepBatch.thermocyclerProfile,libraryPrepBatch.indexSet",
      path: "stepResource"
    },
    {
      deps: [lastSave]
    }
  );

  if (loading) {
    return <LoadingSpinner loading={true} />;
  }

  if (
    response &&
    (!response.data.length || (response.data && editBatchDetails))
  ) {
    return (
      <LibraryPrepBatchForm
        chain={chain}
        libraryPrepBatch={
          response.data.length ? response.data[0].libraryPrepBatch : undefined
        }
        step={step}
        onSuccess={() => {
          setEditBatchDetails(false);
          setLastSave(Date.now());
        }}
      />
    );
  }

  if (response && response.data.length) {
    const stepResource = response.data[0];
    const { libraryPrepBatch } = stepResource;

    return (
      <>
        <h2>Library Batch Prep</h2>
        <button
          className="btn btn-primary float-right"
          onClick={() => setEditBatchDetails(true)}
          type="button"
        >
          Edit Batch Details
        </button>
        <div className="form-group">
          <LibraryPrepBatchDetails libraryPrepBatch={libraryPrepBatch} />
        </div>
        <div className="form-group">
          <Link
            href={`/workflow/library-prep-worksheet?stepResourceId=${stepResource.id}`}
          >
            <a className="btn btn-primary" target="_blank">
              Library Prep Worksheet
            </a>
          </Link>
        </div>
        <div className="form-group">
          <Tabs>
            <TabList>
              <Tab>Substep 1: Library Prep Details Table</Tab>
              <Tab>Substep 2: Container Grid</Tab>
              <Tab>Substep 3: Index Assignment</Tab>
            </TabList>
            <TabPanel>
              <LibraryPrepEditTable
                chain={chain}
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
                  <IndexAssignmentTable
                    chain={chain}
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
