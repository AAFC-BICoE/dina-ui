import { BackToListButton, LoadingSpinner } from "common-ui";
import { PersistedResource } from "kitsu";
import { useRouter } from "next/router";
import PageLayout from "packages/dina-ui/components/page/PageLayout";
import { DinaMessage } from "../../../../dina-ui/intl/dina-ui-intl";
import { SangerSeqReactionStep } from "packages/dina-ui/components/seqdb/pcr-workflow/SangerSeqReactionStep";
import { SeqBatchSelectCoordinatesStep } from "packages/dina-ui/components/seqdb/pcr-workflow/seq-batch-select-coordinats-step/SeqBatchSelectCoordinatesStep";
import { useEffect, useState } from "react";
import { Button, Spinner } from "react-bootstrap";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { SangerSeqBatchStep } from "../../../components/seqdb/pcr-workflow/SangerSeqBatchStep";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import { SeqBatch } from "../../../types/seqdb-api";
import { useSeqBatchQuery } from "../seq-batch/edit";

export default function SangerWorkFlowSequencingRunPage() {
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

  // Loaded SEQ Batch ID.
  const [seqBatchId, setSeqBatchId] = useState<string | undefined>(
    router.query.seqBatchId?.toString()
  );

  // Loaded SEQ Batch.
  const seqBatchQueryState = useSeqBatchQuery(seqBatchId, [
    seqBatchId,
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
    seqBatchSaved?: PersistedResource<SeqBatch>
  ) {
    setCurrentStep(nextStep);
    if (seqBatchSaved) {
      setSeqBatchId(seqBatchSaved.id);
    }
    await router.push({
      pathname: router.pathname,
      query: {
        ...router.query,
        seqBatchId: seqBatchSaved ? seqBatchSaved.id : seqBatchId,
        step: "" + nextStep
      }
    });
  }

  if (seqBatchQueryState.loading) {
    return <LoadingSpinner loading={true} />;
  }

  const buttonBarContent = (
    <>
      <BackToListButton entityLink="/seqdb/sanger-workflow-sequencing" />
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
  const isDisabled = (stepNumber: number, seqBatchRequired: boolean) => {
    // While in edit mode, other steps should be disabled.
    if (editMode && stepNumber !== currentStep) {
      return true;
    }

    // If a SEQ Batch is required, and not provided then this step should be disabled.
    if (seqBatchRequired && !seqBatchId) {
      return true;
    }

    // Not disabled.
    return false;
  };

  return (
    <PageLayout titleId={"sangerWorkflow"} buttonBarContent={buttonBarContent}>
      <Tabs selectedIndex={currentStep} onSelect={setCurrentStep}>
        <TabList>
          <Tab disabled={isDisabled(0, false)}>{formatMessage("seqBatch")}</Tab>
          <Tab disabled={isDisabled(1, false)}>
            {formatMessage("selectPcrBatch")}
          </Tab>
          <Tab disabled={isDisabled(2, true)}>
            {formatMessage("selectCoordinates")}
          </Tab>
        </TabList>
        <TabPanel>
          <SangerSeqBatchStep
            seqBatchId={seqBatchId}
            seqBatch={seqBatchQueryState.response?.data}
            onSaved={onSaved}
            editMode={editMode}
            setEditMode={setEditMode}
            performSave={performSave}
            setPerformSave={setPerformSave}
          />
        </TabPanel>
        <TabPanel>
          {seqBatchId && (
            <SangerSeqReactionStep
              seqBatch={seqBatchQueryState.response?.data}
              editMode={editMode}
              onSaved={onSaved}
              performSave={performSave}
              setPerformSave={setPerformSave}
            />
          )}
        </TabPanel>
        <TabPanel>
          {seqBatchQueryState.response?.data && seqBatchId && (
            <SeqBatchSelectCoordinatesStep
              seqBatchId={seqBatchId}
              seqBatch={seqBatchQueryState.response.data}
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
