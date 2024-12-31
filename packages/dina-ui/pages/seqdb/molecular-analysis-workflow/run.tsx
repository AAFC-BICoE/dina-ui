import { BackToListButton, LoadingSpinner } from "common-ui";
import { PersistedResource } from "kitsu";
import { useRouter } from "next/router";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import PageLayout from "../../../../dina-ui/components/page/PageLayout";
import { useState, useEffect } from "react";
import { Button, Spinner, Dropdown, ButtonGroup } from "react-bootstrap";
import { DinaMessage } from "../../../../dina-ui/intl/dina-ui-intl";
import React from "react";
import { GenericMolecularAnalysis } from "packages/dina-ui/types/seqdb-api/resources/GenericMolecularAnalysis";
import { useMolecularAnalysisQuery } from "packages/dina-ui/components/seqdb/molecular-analysis-workflow/useMolecularAnalysisQuery";
import { MolecularAnalysisDetailsStep } from "packages/dina-ui/components/seqdb/molecular-analysis-workflow/MolecularAnalysisDetailsStep";
import { MolecularAnalysisSampleSelectionStep } from "packages/dina-ui/components/seqdb/molecular-analysis-workflow/MolecularAnalysisSampleSelectionStep";
import { MolecularAnalysisGridStep } from "packages/dina-ui/components/seqdb/molecular-analysis-workflow/MolecularAnalysisGridStep";
import { MolecularAnalysisRunStep } from "packages/dina-ui/components/seqdb/molecular-analysis-workflow/MolecularAnalysisRunStep";
import { MolecularAnalysisResultsStep } from "packages/dina-ui/components/seqdb/molecular-analysis-workflow/MolecularAnalysisResultsStep";

export default function MolecularAnalysisWorkflowRunPage() {
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

  // Used to determine if the molecular analysis needs to be reloaded.
  const [reloadMolecularAnalysis, setReloadMolecularAnalysis] =
    useState<number>(Date.now());

  // Loaded Molecular Analysis ID.
  const [molecularAnalysisId, setMolecularAnalysisId] = useState<
    string | undefined
  >(router.query.genericMolecularAnalysisId?.toString());

  // Loaded Molecular Analysis.
  const molecularAnalysis = useMolecularAnalysisQuery(molecularAnalysisId, [
    molecularAnalysisId,
    currentStep,
    reloadMolecularAnalysis
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
    molecularAnalysisSaved?: PersistedResource<GenericMolecularAnalysis>
  ) {
    setCurrentStep(nextStep);
    if (molecularAnalysisSaved) {
      setMolecularAnalysisId(molecularAnalysisSaved.id);
    }
    await router.push({
      pathname: router.pathname,
      query: {
        ...router.query,
        genericMolecularAnalysisId: molecularAnalysisSaved
          ? molecularAnalysisSaved.id
          : molecularAnalysisId,
        step: "" + nextStep
      }
    });
  }

  if (molecularAnalysis.loading) {
    return <LoadingSpinner loading={true} />;
  }

  const buttonBarContent = (
    <>
      <div className="col-md-4">
        <BackToListButton entityLink="/seqdb/molecular-analysis-workflow" />
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
    molecularAnalysisRequired: boolean
  ) => {
    // While in edit mode, other steps should be disabled.
    if (editMode && stepNumber !== currentStep) {
      return true;
    }

    // If a Molecular Analysis is required, and not provided then this step should be disabled.
    if (molecularAnalysisRequired && !molecularAnalysisId) {
      return true;
    }

    // Not disabled.
    return false;
  };

  return (
    <PageLayout
      titleId={"molecularAnalysisWorkflowTitle"}
      buttonBarContent={buttonBarContent}
    >
      <Tabs selectedIndex={currentStep} onSelect={setCurrentStep}>
        <TabList>
          <Tab disabled={isDisabled(0, false)}>
            {formatMessage("molecularAnalysis")}
          </Tab>
          <Tab disabled={isDisabled(1, true)}>
            {formatMessage("selectMaterialSamples")}
          </Tab>
          <Tab disabled={isDisabled(2, true)}>
            {formatMessage("selectCoordinates")}
          </Tab>
          <Tab disabled={isDisabled(3, true)}>{formatMessage("runStep")}</Tab>
          <Tab disabled={isDisabled(4, true)}>
            {formatMessage("resultsStep")}
          </Tab>
        </TabList>
        <TabPanel>
          <MolecularAnalysisDetailsStep
            genericMolecularAnalysisId={molecularAnalysisId}
            genericMolecularAnalysis={molecularAnalysis.response?.data}
            onSaved={onSaved}
            editMode={editMode}
            setEditMode={setEditMode}
            performSave={performSave}
            setPerformSave={setPerformSave}
          />
        </TabPanel>
        <TabPanel>
          {molecularAnalysisId && molecularAnalysis.response?.data && (
            <MolecularAnalysisSampleSelectionStep
              molecularAnalysisId={molecularAnalysisId}
              onSaved={onSaved}
              editMode={editMode}
              setEditMode={setEditMode}
              performSave={performSave}
              setPerformSave={setPerformSave}
            />
          )}
        </TabPanel>
        <TabPanel>
          {molecularAnalysisId && molecularAnalysis.response?.data && (
            <MolecularAnalysisGridStep
              molecularAnalysisId={molecularAnalysisId}
              molecularAnalysis={molecularAnalysis.response.data}
              onSaved={onSaved}
              editMode={editMode}
              setEditMode={setEditMode}
              performSave={performSave}
              setPerformSave={setPerformSave}
            />
          )}
        </TabPanel>
        <TabPanel>
          {molecularAnalysisId && molecularAnalysis.response?.data && (
            <MolecularAnalysisRunStep
              molecularAnalysisId={molecularAnalysisId}
              molecularAnalysis={molecularAnalysis.response.data}
              editMode={editMode}
              setEditMode={setEditMode}
              performSave={performSave}
              setPerformSave={setPerformSave}
              onSaved={onSaved}
            />
          )}
        </TabPanel>
        <TabPanel>
          {molecularAnalysisId && molecularAnalysis.response?.data && (
            <MolecularAnalysisResultsStep
              molecularAnalysisId={molecularAnalysisId}
              molecularAnalysis={molecularAnalysis.response.data}
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
