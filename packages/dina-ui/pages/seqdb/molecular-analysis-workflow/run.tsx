import {
  BackToListButton,
  DATA_EXPORT_QUERY_KEY,
  DATA_EXPORT_TOTAL_RECORDS_KEY,
  filterBy,
  LoadingSpinner,
  useApiClient
} from "common-ui";
import { PersistedResource } from "kitsu";
import { useRouter } from "next/router";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import PageLayout from "../../../../dina-ui/components/page/PageLayout";
import { useState, useEffect } from "react";
import { Button, Spinner } from "react-bootstrap";
import { DinaMessage } from "../../../../dina-ui/intl/dina-ui-intl";
import React from "react";
import { GenericMolecularAnalysis } from "packages/dina-ui/types/seqdb-api/resources/GenericMolecularAnalysis";
import { useMolecularAnalysisQuery } from "packages/dina-ui/components/seqdb/molecular-analysis-workflow/useMolecularAnalysisQuery";
import { MolecularAnalysisDetailsStep } from "packages/dina-ui/components/seqdb/molecular-analysis-workflow/MolecularAnalysisDetailsStep";
import { MolecularAnalysisSampleSelectionStep } from "packages/dina-ui/components/seqdb/molecular-analysis-workflow/MolecularAnalysisSampleSelectionStep";
import { MolecularAnalysisGridStep } from "packages/dina-ui/components/seqdb/molecular-analysis-workflow/MolecularAnalysisGridStep";
import { MolecularAnalysisRunStep } from "packages/dina-ui/components/seqdb/molecular-analysis-workflow/MolecularAnalysisRunStep";
import { MolecularAnalysisResultsStep } from "packages/dina-ui/components/seqdb/molecular-analysis-workflow/MolecularAnalysisResultsStep";
import { GenericMolecularAnalysisItem } from "packages/dina-ui/types/seqdb-api/resources/GenericMolecularAnalysisItem";
import { uuidQuery } from "packages/common-ui/lib/list-page/query-builder/query-builder-elastic-search/QueryBuilderElasticSearchExport";
import { writeStorage } from "@rehooks/local-storage";
import { FaTimes } from "react-icons/fa";
import { FaFloppyDisk } from "react-icons/fa6";
import { MdEdit } from "react-icons/md";
import { FiDownload } from "react-icons/fi";

export default function MolecularAnalysisWorkflowRunPage() {
  const { apiClient } = useApiClient();
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

  // Used to determine if the molecular analysis needs to be reloaded.
  const [reloadMolecularAnalysis] = useState<number>(Date.now());

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

  async function onExport() {
    if (!molecularAnalysisId) return;

    // First we need to find all the linked material samples...
    await apiClient
      .get<GenericMolecularAnalysisItem[]>(
        "/seqdb-api/generic-molecular-analysis-item",
        {
          filter: filterBy([], {
            extraFilters: [
              {
                selector: "genericMolecularAnalysis.uuid",
                comparison: "==",
                arguments: molecularAnalysisId
              }
            ]
          })(""),
          include: "materialSample",
          page: {
            limit: 1000 // Maximum page size.
          }
        }
      )
      .then((response) => {
        const molecularAnalysisItems: PersistedResource<GenericMolecularAnalysisItem>[] =
          response?.data?.filter(
            (item) => item?.materialSample?.id !== undefined
          );
        const materialSampleIds: string[] =
          molecularAnalysisItems.map(
            (item) => item?.materialSample?.id as string
          ) ?? [];

        // Nothing to export, stay on the page...
        if (materialSampleIds.length === 0) return;

        // Generate a query using the material sample IDs and save it into storage.
        const selectedIdsQuery = uuidQuery(materialSampleIds);
        writeStorage<any>(DATA_EXPORT_QUERY_KEY, selectedIdsQuery);
        sessionStorage.setItem(
          DATA_EXPORT_TOTAL_RECORDS_KEY,
          materialSampleIds.length.toString()
        );

        // Redirect to the molecular analysis export page.
        router.push({
          pathname: "/export/molecular-analysis-export/export",
          query: {
            // Used for the back button to return back to this page.
            entityLink: "/seqdb/molecular-analysis-workflow"
          }
        });
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
      {currentStep > 2 && !editMode && (
        <Button
          variant={"secondary"}
          className="ms-auto"
          onClick={() => onExport()}
          style={{ width: "10rem", marginRight: "8px" }}
        >
          <FiDownload className="me-2" />
          <SeqdbMessage id="exportButtonText" />
        </Button>
      )}
      {editMode ? (
        <>
          <Button
            variant="secondary"
            className="ms-auto"
            onClick={() => setEditMode(false)}
            style={{ width: "10rem" }}
          >
            <FaTimes className="me-2" />
            <DinaMessage id="cancelButtonText" />
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
              <>
                <FaFloppyDisk className="me-2" />
                <DinaMessage id="save" />
              </>
            )}
          </Button>
        </>
      ) : (
        currentStep !== 4 && (
          <>
            <Button
              variant={"primary"}
              className={currentStep < 3 ? "ms-auto" : ""}
              onClick={() => setEditMode(true)}
              style={{ width: "10rem", marginRight: "15px" }}
            >
              <MdEdit size={21} className="me-2" />
              <SeqdbMessage id="editButtonText" />
            </Button>
          </>
        )
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
