import { BackToListButton, LoadingSpinner } from "common-ui";
import { PersistedResource } from "kitsu";
import { useRouter } from "next/router";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { SangerPcrBatchStep } from "../../../components/seqdb/pcr-workflow/SangerPcrBatchStep";
import { SangerSampleSelectionStep } from "../../../components/seqdb/pcr-workflow/SangerSampleSelectionStep";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import { PcrBatch } from "../../../types/seqdb-api";
import PageLayout from "../../../../dina-ui/components/page/PageLayout";
import { useState, useEffect } from "react";
import { Button, Spinner } from "react-bootstrap";
import { PCRBatchItemGrid } from "packages/dina-ui/components/seqdb/pcr-workflow/pcr-batch-plating-step/SangerPcrBatchItemGridStep";
import { usePcrBatchQuery } from "../pcr-batch/edit";
import { DinaMessage } from "../../../../dina-ui/intl/dina-ui-intl";
import { SangerPcrReactionStep } from "packages/dina-ui/components/seqdb/pcr-workflow/SangerPcrReactionStep";

export default function PCRWorkFlowRunPage() {
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

  // Loaded PCR Batch ID.
  const [pcrBatchId, setPcrBatchId] = useState<string | undefined>(
    router.query.pcrBatchId?.toString()
  );

  // Loaded PCR Batch.
  const pcrBatch = usePcrBatchQuery(pcrBatchId, [pcrBatchId, currentStep]);

  // Update the URL to contain the current step.
  useEffect(() => {
    router.push({
      pathname: router.pathname,
      query: { ...router.query, step: currentStep }
    });
  }, [currentStep]);

  async function onSaved(
    nextStep: number,
    pcrBatchSaved?: PersistedResource<PcrBatch>
  ) {
    setCurrentStep(nextStep);
    if (pcrBatchSaved) {
      setPcrBatchId(pcrBatchSaved.id);
    }
    await router.push({
      pathname: router.pathname,
      query: {
        ...router.query,
        pcrBatchId: pcrBatchSaved ? pcrBatchSaved.id : pcrBatchId,
        step: "" + nextStep
      }
    });
  }

  if (pcrBatch.loading) {
    return <LoadingSpinner loading={true} />;
  }

  const buttonBarContent = (
    <>
      <BackToListButton entityLink="/seqdb/pcr-workflow" />
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
              <DinaMessage id="save" />
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
    <PageLayout titleId={"pcrWorkflow"} buttonBarContent={buttonBarContent}>
      <Tabs selectedIndex={currentStep} onSelect={setCurrentStep}>
        <TabList>
          <Tab disabled={isDisabled(0, false)}>{formatMessage("pcrBatch")}</Tab>
          <Tab disabled={isDisabled(1, true)}>
            {formatMessage("selectMaterialSamples")}
          </Tab>
          <Tab disabled={isDisabled(2, true)}>
            {formatMessage("selectCoordinates")}
          </Tab>
          <Tab disabled={isDisabled(3, true)}>
            {formatMessage("pcrReaction")}
          </Tab>
        </TabList>
        <TabPanel>
          <SangerPcrBatchStep
            pcrBatchId={pcrBatchId}
            pcrBatch={pcrBatch.response?.data}
            onSaved={onSaved}
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
              onSaved={onSaved}
              editMode={editMode}
              setEditMode={setEditMode}
              performSave={performSave}
              setPerformSave={setPerformSave}
            />
          )}
        </TabPanel>
        <TabPanel>
          {pcrBatch.response?.data && pcrBatchId && (
            <PCRBatchItemGrid
              pcrBatchId={pcrBatchId}
              pcrBatch={pcrBatch.response.data}
              onSaved={onSaved}
              editMode={editMode}
              setEditMode={setEditMode}
              performSave={performSave}
              setPerformSave={setPerformSave}
            />
          )}
        </TabPanel>
        <TabPanel>
          {pcrBatch.response?.data && pcrBatchId && (
            <SangerPcrReactionStep
              pcrBatchId={pcrBatchId}
              editMode={editMode}
              performSave={performSave}
              setPerformSave={setPerformSave}
            />
          )}
        </TabPanel>
      </Tabs>
    </PageLayout>
  );
}
