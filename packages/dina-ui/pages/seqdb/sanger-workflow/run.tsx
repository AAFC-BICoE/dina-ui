import { BackToListButton } from "common-ui";
import { PersistedResource } from "kitsu";
import { useRouter } from "next/router";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { SangerPcrBatchStep } from "../../../components/seqdb/sanger-workflow/SangerPcrBatchStep";
import { SangerSampleSelectionStep } from "../../../components/seqdb/sanger-workflow/SangerSampleSelectionStep";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import { PcrBatch } from "../../../types/seqdb-api";
import PageLayout from "packages/dina-ui/components/page/PageLayout";
import { useState, useEffect } from "react";
import { Button, Spinner } from "react-bootstrap";
import { PCRBatchItemGrid } from "packages/dina-ui/components/seqdb/sanger-workflow/pcr-batch-plating-step/PCRBatchItemGrid";

export default function SangerWorkFlowRunPage() {
  const router = useRouter();
  const { formatMessage } = useSeqdbIntl();

  const pcrBatchId = router.query.pcrBatchId?.toString();

  // Current step being used.
  const [currentStep, setCurrentStep] = useState<number>(
    router.query.step ? Number(router.query.step) : 0
  );

  // Global edit mode state.
  const [editMode, setEditMode] = useState<boolean>(false);

  // Request saving to be performed.
  const [performSave, setPerformSave] = useState<boolean>(false);

  // Update the URL to contain the current step.
  useEffect(() => {
    router.push({
      pathname: router.pathname,
      query: { ...router.query, step: currentStep }
    });
  }, [currentStep]);

  async function finishPcrBatchStep(pcrBatch: PersistedResource<PcrBatch>) {
    setCurrentStep(1);
    await router.push({
      pathname: router.pathname,
      query: { ...router.query, pcrBatchId: pcrBatch.id, step: "1" }
    });
  }

  const buttonBarContent = (
    <>
      <BackToListButton entityLink="/seqdb/sanger-workflow" />
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
                <span className="visually-hidden">Loading...</span>
              </>
            ) : (
              <>Save</>
            )}
          </Button>
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
  const isDisabled = (stepNumber: number, pcrBatchRequired: boolean) => {
    // While in edit mode, other steps should be disabled.
    if (editMode && stepNumber !== currentStep) {
      return true;
    }

    // If a PCR Batch is required, and not provided then this step should be disabled.
    if (pcrBatchRequired && !pcrBatchId) {
      return true;
    }

    // Not disabled.
    return false;
  };

  return (
    <PageLayout titleId={"sangerWorkflow"} buttonBarContent={buttonBarContent}>
      <Tabs selectedIndex={currentStep} onSelect={setCurrentStep}>
        <TabList>
          <Tab disabled={isDisabled(0, false)}>{formatMessage("pcrBatch")}</Tab>
          <Tab disabled={isDisabled(1, true)}>
            {formatMessage("selectMaterialSamples")}
          </Tab>
          <Tab disabled={isDisabled(2, true)}>
            {formatMessage("selectCoordinates")}
          </Tab>
        </TabList>
        <TabPanel>
          <SangerPcrBatchStep
            pcrBatchId={pcrBatchId}
            onSaved={finishPcrBatchStep}
            editMode={editMode}
            setEditMode={setEditMode}
            performSave={performSave}
            setPerformSave={setPerformSave}
          />
        </TabPanel>
        <TabPanel>
          {pcrBatchId && (
            <SangerSampleSelectionStep
              pcrBatchId={pcrBatchId}
              editMode={editMode}
              setEditMode={setEditMode}
              performSave={performSave}
              setPerformSave={setPerformSave}
            />
          )}
        </TabPanel>
        <TabPanel>
          {pcrBatchId && (
            <PCRBatchItemGrid
              pcrBatchId={pcrBatchId}
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
