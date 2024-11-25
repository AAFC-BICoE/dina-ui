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
import { useMetagenomicsBatchQuery } from "./useMetagenomicsBatchQuery";
import { MetagenomicsBatch } from "../../../types/seqdb-api/resources/metagenomics/MetagenomicsBatch";
import { MetagenomicsBatchDetailsStep } from "../../../components/seqdb/metagenomics-workflow/MetagenomicsBatchDetailsStep";
import { MetagenomicsSelectPCRBatchStep } from "../../../components/seqdb/metagenomics-workflow/MetagenomicsSelectPCRBatchStep";
import { MetagenomicsBatchSelectCoordinatesStep } from "../../../components/seqdb/metagenomics-workflow/MetagenomicsBatchSelectCoordinatesStep";
import { SangerRunStep } from "packages/dina-ui/components/seqdb/seq-workflow/SangerRunStep";
import { IndexAssignmentStep } from "packages/dina-ui/components/seqdb/ngs-workflow/IndexAssignmentStep";
import { MetagenomicsIndexAssignmentStep } from "packages/dina-ui/components/seqdb/metagenomics-workflow/MetagenomicsIndexAssignmentStep";
import { SequencingRunStep } from "packages/dina-ui/components/seqdb/metagenomics-workflow/SequencingRunStep";

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

  // Used to determine if the resource needs to be reloaded.
  const [reloadMetagenomicsBatch, setReloadMetagenomicsBatch] =
    useState<number>(Date.now());

  // Loaded resource id
  const [metagenomicsBatchId, setMetagenomicsBatchId] = useState<
    string | undefined
  >(router.query.metagenomicsBatchId?.toString());

  // Loaded resource
  const metagenomicsBatchQuery = useMetagenomicsBatchQuery(
    metagenomicsBatchId,
    [metagenomicsBatchId, currentStep, reloadMetagenomicsBatch]
  );

  // Update the URL to contain the current step.
  useEffect(() => {
    router.push({
      pathname: router.pathname,
      query: { ...router.query, step: currentStep }
    });
  }, [currentStep]);

  async function onSaved(
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

  if (metagenomicsBatchQuery.loading) {
    return <LoadingSpinner loading={true} />;
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

    // Not disabled.
    return false;
  };

  return (
    <PageLayout
      titleId={"metagenomicsWorkflowTitle"}
      buttonBarContent={buttonBarContent}
    >
      <Tabs selectedIndex={currentStep} onSelect={setCurrentStep}>
        <TabList>
          <Tab disabled={isDisabled(0, false)}>
            {formatMessage("metagenomicsBatch")}
          </Tab>
          <Tab disabled={isDisabled(1, true)}>
            {formatMessage("selectPcrBatch")}
          </Tab>
          <Tab disabled={isDisabled(2, true)}>
            {formatMessage("selectCoordinates")}
          </Tab>
          <Tab disabled={isDisabled(3, true)}>
            {formatMessage("indexAssignmentStep")}
          </Tab>
          <Tab disabled={isDisabled(4, true)}>{formatMessage("runStep")}</Tab>
        </TabList>
        <TabPanel>
          <MetagenomicsBatchDetailsStep
            metagenomicsBatchId={metagenomicsBatchId}
            metagenomicsBatch={metagenomicsBatchQuery.response?.data}
            onSaved={onSaved}
            editMode={editMode}
            setEditMode={setEditMode}
            performSave={performSave}
            setPerformSave={setPerformSave}
          />
        </TabPanel>
        <TabPanel>
          {metagenomicsBatchId && <MetagenomicsSelectPCRBatchStep />}
        </TabPanel>
        <TabPanel>
          {metagenomicsBatchQuery.response?.data && metagenomicsBatchId && (
            <MetagenomicsBatchSelectCoordinatesStep
            // seqBatchId={seqBatchId}
            // seqBatch={seqBatchQueryState.response.data}
            // editMode={editMode}
            // setEditMode={setEditMode}
            // performSave={performSave}
            // setPerformSave={setPerformSave}
            // onSaved={onSaved}
            />
          )}
        </TabPanel>
        <TabPanel>
          {metagenomicsBatchQuery.response?.data && metagenomicsBatchId && (
            <MetagenomicsIndexAssignmentStep
            // batchId={metagenomicsBatchId}
            // batch={metagenomicsBatchQuery.response?.data}
            // onSaved={onSaved}
            // editMode={editMode}
            // setEditMode={setEditMode}
            // performSave={performSave}
            // setPerformSave={setPerformSave}
            />
          )}
        </TabPanel>
        <TabPanel>
          {metagenomicsBatchQuery.response?.data && metagenomicsBatchId && (
            <SequencingRunStep
              batchId={metagenomicsBatchId}
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
