import { BackToListButton, LoadingSpinner } from "common-ui";
import { PersistedResource } from "kitsu";
import { useRouter } from "next/router";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import PageLayout from "../../../components/page/PageLayout";
import { useState, useEffect } from "react";
import { Button, Spinner } from "react-bootstrap";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import React from "react";
import { useMetagenomicsBatchQuery } from "../../../components/seqdb/metagenomics-workflow/useMetagenomicsBatchQuery";
import { MetagenomicsBatch } from "../../../types/seqdb-api/resources/metagenomics/MetagenomicsBatch";
import { MetagenomicsBatchDetailsStep } from "../../../components/seqdb/metagenomics-workflow/MetagenomicsBatchDetailsStep";
import { MetagenomicsIndexAssignmentStep } from "../../../components/seqdb/metagenomics-workflow/MetagenomicsIndexAssignmentStep";
import { MetagenomicsRunStep } from "../../../components/seqdb/metagenomics-workflow/MetagenomicsRunStep";
import { usePcrBatchQuery } from "../pcr-batch/edit";
import { SangerPcrBatchItemGridStep } from "../../../components/seqdb/pcr-workflow/pcr-batch-plating-step/SangerPcrBatchItemGridStep";
import { SangerPcrBatchStep } from "../../../components/seqdb/pcr-workflow/SangerPcrBatchStep";
import { SangerPcrReactionStep } from "../../../components/seqdb/pcr-workflow/SangerPcrReactionStep";
import { SangerSampleSelectionStep } from "../../../components/seqdb/pcr-workflow/SangerSampleSelectionStep";
import { PcrBatch } from "../../../types/seqdb-api";

export default function MetagenomicWorkflowRunPage() {
  const router = useRouter();
  const { formatMessage } = useSeqdbIntl();

  // Current step being used.
  const [currentStep, setCurrentStep] = useState<number>(
    router.query.step ? Number(router.query.step) : 0
  );

  // Global edit mode state.
  const [editMode, setEditMode] = useState<boolean>(
    router.query.editMode === "true"
  );

  // Request saving to be performed.
  const [performSave, setPerformSave] = useState<boolean>(false);

  // Request completion to be performed.
  const [performComplete, setPerformComplete] = useState<boolean>(false);

  const [reloadPcrBatch, setReloadPcrBatch] = useState<number>(Date.now());

  // Loaded PCR Batch ID.
  const [pcrBatchId, setPcrBatchId] = useState<string | undefined>(
    router.query.pcrBatchId?.toString()
  );

  // Loaded PCR Batch.
  const pcrBatchQuery = usePcrBatchQuery(pcrBatchId, [
    pcrBatchId,
    currentStep,
    reloadPcrBatch
  ]);

  // Used to determine if the resource needs to be reloaded.
  const [reloadMetagenomicsBatch] = useState<number>(Date.now());

  // Loaded resource id
  const [metagenomicsBatchId, setMetagenomicsBatchId] = useState<
    string | undefined
  >(router.query.metagenomicsBatchId?.toString());

  // Loaded resource
  const metagenomicsBatchQuery = useMetagenomicsBatchQuery(
    metagenomicsBatchId,
    pcrBatchId,
    setMetagenomicsBatchId,
    [metagenomicsBatchId, currentStep, reloadMetagenomicsBatch]
  );

  // Update the URL to contain the current step.
  useEffect(() => {
    router.push({
      pathname: router.pathname,
      query: { ...router.query, step: currentStep }
    });
  }, [currentStep]);

  async function onSavedMetagenomicsBatch(
    nextStep: number,
    metagenomicsBatchSaved?: PersistedResource<MetagenomicsBatch>
  ) {
    setCurrentStep(nextStep);
    if (metagenomicsBatchSaved) {
      setMetagenomicsBatchId(metagenomicsBatchSaved.id);
    }
    await router.push({
      pathname: router.pathname,
      query: {
        ...router.query,
        metagenomicsBatchId: metagenomicsBatchSaved
          ? metagenomicsBatchSaved.id
          : metagenomicsBatchId,
        step: "" + nextStep
      }
    });
  }

  async function onSavedPcrBatch(
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

  const buttonBarContent = (
    <>
      <div className="col-md-4">
        <BackToListButton entityLink="/seqdb/metagenomics-workflow" />
      </div>
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
            style={{ width: "10rem", marginRight: "15px" }}
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
        </>
      ) : (
        <Button
          variant={"primary"}
          className="ms-auto"
          onClick={() => setEditMode(true)}
          style={{ width: "10rem", marginRight: "15px" }}
        >
          <SeqdbMessage id="editButtonText" />
        </Button>
      )}
    </>
  );

  // Helper function to determine if a step should be disabled.
  const isDisabled = (
    stepNumber: number,
    pcrBatchRequired: boolean,
    metagenomicsBatchRequired: boolean
  ) => {
    // While in edit mode, other steps should be disabled.
    if (editMode && stepNumber !== currentStep) {
      return true;
    }

    // If a metagenomics batch is required, and not provided then this step should be disabled.
    if (metagenomicsBatchRequired && !metagenomicsBatchId) {
      return true;
    }
    // If a PCR Batch is required, and not provided then this step should be disabled.
    if (pcrBatchRequired && !pcrBatchId) {
      return true;
    }
    // Not disabled.
    return false;
  };
  function isLoading() {
    return metagenomicsBatchQuery.loading || pcrBatchQuery.loading;
  }
  return isLoading() ? (
    <LoadingSpinner loading={true} />
  ) : (
    <PageLayout
      titleId={"metagenomicsWorkflowTitle"}
      buttonBarContent={buttonBarContent}
    >
      <Tabs selectedIndex={currentStep} onSelect={setCurrentStep}>
        <TabList>
          <Tab disabled={isDisabled(0, false, false)}>
            {formatMessage("pcrBatch")}
          </Tab>
          <Tab disabled={isDisabled(1, true, false)}>
            {formatMessage("selectMaterialSamples")}
          </Tab>
          <Tab disabled={isDisabled(2, true, false)}>
            {formatMessage("selectCoordinates")}
          </Tab>
          <Tab disabled={isDisabled(3, true, false)}>
            {formatMessage("pcrReaction")}
          </Tab>
          <Tab disabled={isDisabled(4, true, false)}>
            {formatMessage("metagenomicsBatch")}
          </Tab>
          <Tab disabled={isDisabled(5, true, true)}>
            {formatMessage("indexAssignmentStep")}
          </Tab>
          <Tab disabled={isDisabled(6, true, true)}>
            {formatMessage("runStep")}
          </Tab>
        </TabList>
        <TabPanel>
          <SangerPcrBatchStep
            pcrBatchId={pcrBatchId}
            pcrBatch={pcrBatchQuery.response?.data}
            onSaved={onSavedPcrBatch}
            editMode={editMode}
            setEditMode={setEditMode}
            performSave={performSave}
            setPerformSave={setPerformSave}
            isMetagenomicsWorkflow={true}
          />
        </TabPanel>
        <TabPanel>
          {pcrBatchId && (
            <SangerSampleSelectionStep
              pcrBatchId={pcrBatchId}
              metagenomicsBatch={metagenomicsBatchQuery.response?.data}
              onSaved={onSavedPcrBatch}
              editMode={editMode}
              setEditMode={setEditMode}
              performSave={performSave}
              setPerformSave={setPerformSave}
            />
          )}
        </TabPanel>
        <TabPanel>
          {pcrBatchQuery.response?.data && pcrBatchId && (
            <SangerPcrBatchItemGridStep
              pcrBatchId={pcrBatchId}
              pcrBatch={pcrBatchQuery.response.data}
              onSaved={onSavedPcrBatch}
              editMode={editMode}
              setEditMode={setEditMode}
              performSave={performSave}
              setPerformSave={setPerformSave}
            />
          )}
        </TabPanel>
        <TabPanel>
          {pcrBatchQuery.response?.data && pcrBatchId && (
            <SangerPcrReactionStep
              pcrBatchId={pcrBatchId}
              pcrBatch={pcrBatchQuery.response.data}
              editMode={editMode}
              performSave={performSave}
              setPerformSave={setPerformSave}
              performComplete={performComplete}
              setPerformComplete={setPerformComplete}
              setEditMode={setEditMode}
              setReloadPcrBatch={setReloadPcrBatch}
              onSaved={onSavedPcrBatch}
            />
          )}
        </TabPanel>
        <TabPanel>
          {pcrBatchQuery?.response?.data && (
            <MetagenomicsBatchDetailsStep
              metagenomicsBatchId={metagenomicsBatchId}
              metagenomicsBatch={metagenomicsBatchQuery.response?.data}
              onSaved={onSavedMetagenomicsBatch}
              editMode={editMode}
              setEditMode={setEditMode}
              performSave={performSave}
              setPerformSave={setPerformSave}
              pcrBatch={pcrBatchQuery?.response?.data}
            />
          )}
        </TabPanel>
        <TabPanel>
          {metagenomicsBatchQuery.response?.data &&
            metagenomicsBatchId &&
            pcrBatchQuery?.response?.data &&
            pcrBatchId && (
              <MetagenomicsIndexAssignmentStep
                pcrBatchId={pcrBatchId}
                pcrBatch={pcrBatchQuery?.response?.data}
                metagenomicsBatchId={metagenomicsBatchId}
                metagenomicsBatch={metagenomicsBatchQuery.response?.data}
                onSaved={onSavedMetagenomicsBatch}
                editMode={editMode}
                setEditMode={setEditMode}
                performSave={performSave}
                setPerformSave={setPerformSave}
              />
            )}
        </TabPanel>
        <TabPanel>
          {metagenomicsBatchQuery.response?.data && metagenomicsBatchId && (
            <MetagenomicsRunStep
              metagenomicsBatchId={metagenomicsBatchId}
              metagenomicsBatch={metagenomicsBatchQuery.response?.data}
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
