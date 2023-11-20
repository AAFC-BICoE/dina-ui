import { BackToListButton, LoadingSpinner } from "common-ui";
import { PersistedResource } from "kitsu";
import { useRouter } from "next/router";
import { LibraryPrepBatchStep } from "packages/dina-ui/components/seqdb/ngs-workflow/LibraryPrepBatchStep";
import { useEffect, useState } from "react";
import { Button, ButtonGroup, Dropdown, Spinner } from "react-bootstrap";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import PageLayout from "../../../../dina-ui/components/page/PageLayout";
import { DinaMessage } from "../../../../dina-ui/intl/dina-ui-intl";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import { LibraryPrepBatch } from "../../../types/seqdb-api";
import { useLibraryPrepBatchQuery } from "../library-prep-batch/edit";
import { NgsSampleSelectionStep } from "packages/dina-ui/components/seqdb";
import { PreLibraryPrepStep } from "packages/dina-ui/components/seqdb/ngs-workflow/PreLibraryPrepStep";

export default function NgsWorkFlowRunPage() {
  const router = useRouter();
  const { formatMessage } = useSeqdbIntl();

  // Current step being used.
  const [currentStep, setCurrentStep] = useState<number>(
    router.query.step ? Number(router.query.step) : 0
  );

  // Global edit mode state.
  const [editMode, setEditMode] = useState<boolean>(false);

  // Request saving to be performed.
  const [performSave, setPerformSave] = useState<boolean>(false);

  // Request completion to be performed.
  const [performComplete, setPerformComplete] = useState<boolean>(false);

  // Loaded Batch ID.
  const [batchId, setBatchId] = useState<string | undefined>(
    router.query.batchId?.toString()
  );
  // Loaded PCR Batch.
  const libraryPrepBatch = useLibraryPrepBatchQuery(batchId, [
    batchId,
    currentStep
  ]);

  // Update the URL to contain the current step.
  useEffect(() => {
    router.push({
      pathname: router.pathname,
      query: { ...router.query, step: currentStep }
    });
  }, [currentStep]);

  async function onSaved(
    nextStep: number,
    batchSaved?: PersistedResource<LibraryPrepBatch>
  ) {
    setCurrentStep(nextStep);
    if (batchSaved) {
      setBatchId(batchSaved.id);
    }
    await router.push({
      pathname: router.pathname,
      query: {
        ...router.query,
        batchId: batchSaved ? batchSaved.id : batchId,
        step: "" + nextStep
      }
    });
  }

  if (libraryPrepBatch.loading) {
    return <LoadingSpinner loading={true} />;
  }

  const buttonBarContent = (
    <>
      <BackToListButton entityLink="/seqdb/ngs-workflow" />
      {editMode ? (
        <>
          <Button
            variant="secondary"
            className="ms-auto"
            onClick={() => setEditMode(false)}
            style={{ width: "10rem" }}
          >
            Cancel
          </Button>

          {currentStep !== 3 ? (
            <Button
              variant={"primary"}
              className="ms-2"
              onClick={() => setPerformSave(true)}
              style={{ width: "10rem" }}
            >
              {performSave ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                  />
                  <span className="visually-hidden">
                    <DinaMessage id="loading" />
                  </span>
                </>
              ) : (
                <DinaMessage id="save" />
              )}
            </Button>
          ) : (
            <>
              <Dropdown as={ButtonGroup}>
                <Button
                  variant={"primary"}
                  className="ms-2"
                  onClick={() => setPerformSave(true)}
                  style={{ width: "10rem" }}
                >
                  {performSave ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                      />
                      <span className="visually-hidden">
                        <DinaMessage id="loading" />
                      </span>
                    </>
                  ) : (
                    <DinaMessage id="save" />
                  )}
                </Button>
                <Dropdown.Toggle split={true} id="dropdown-split-basic" />
                <Dropdown.Menu>
                  <Dropdown.Item
                    as="button"
                    href="#/action-1"
                    className="ms-2"
                    onClick={() => {
                      setPerformComplete(true);
                      setPerformSave(true);
                    }}
                  >
                    {performComplete ? (
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
                    ) : null}
                    <DinaMessage id="saveAndMarkAsComplete" />
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </>
          )}
        </>
      ) : (
        <Button
          variant={"primary"}
          className="ms-auto"
          onClick={() => setEditMode(true)}
          style={{ width: "10rem" }}
        >
          <SeqdbMessage id="editButtonText" />
        </Button>
      )}
    </>
  );

  // Helper function to determine if a step should be disabled.
  const isDisabled = (stepNumber: number, batchRequired: boolean) => {
    // While in edit mode, other steps should be disabled.
    if (editMode && stepNumber !== currentStep) {
      return true;
    }

    // If a PCR Batch is required, and not provided then this step should be disabled.
    if (batchRequired && !batchId) {
      return true;
    }

    // Not disabled.
    return false;
  };

  return (
    <PageLayout
      titleId={"ngsWorkflowWholeGenomeSeqTitle"}
      buttonBarContent={buttonBarContent}
    >
      <Tabs selectedIndex={currentStep} onSelect={setCurrentStep}>
        <TabList>
          <Tab disabled={isDisabled(0, false)}>
            {formatMessage("libraryPrepBatch")}
          </Tab>
          <Tab disabled={isDisabled(1, true)}>
            {formatMessage("selectMaterialSamples")}
          </Tab>
          <Tab disabled={isDisabled(2, true)}>
            {formatMessage("preLibraryPrep")}
          </Tab>
        </TabList>
        <TabPanel>
          <LibraryPrepBatchStep
            batchId={batchId}
            batch={libraryPrepBatch.response?.data}
            onSaved={onSaved}
            editMode={editMode}
            setEditMode={setEditMode}
            performSave={performSave}
            setPerformSave={setPerformSave}
          />
        </TabPanel>
        <TabPanel>
          {batchId && (
            <NgsSampleSelectionStep
              batchId={batchId}
              onSaved={onSaved}
              editMode={editMode}
              setEditMode={setEditMode}
              performSave={performSave}
              setPerformSave={setPerformSave}
            />
          )}
        </TabPanel>
        <TabPanel>
          {batchId && !!libraryPrepBatch.response?.data && (
            <PreLibraryPrepStep
              batchId={batchId}
              batch={libraryPrepBatch.response?.data}
              onSaved={onSaved}
              editMode={editMode}
              setEditMode={setEditMode}
              performSave={performSave}
              setPerformSave={setPerformSave}
            />
          )}
        </TabPanel>
      </Tabs>
    </PageLayout>
  );
}
