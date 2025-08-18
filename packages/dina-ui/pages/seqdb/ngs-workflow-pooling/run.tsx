import { BackToListButton, LoadingSpinner, useQuery } from "common-ui";
import { PersistedResource } from "kitsu";
import { useRouter } from "next/router";
import {
  LibraryPoolStep,
  LibraryPoolContentStep
} from "packages/dina-ui/components/seqdb";
import { useEffect, useState } from "react";
import { Button, ButtonGroup, Dropdown, Spinner } from "react-bootstrap";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import PageLayout from "../../../../dina-ui/components/page/PageLayout";
import { DinaMessage } from "../../../../dina-ui/intl/dina-ui-intl";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import { LibraryPool, libraryPoolParser } from "../../../types/seqdb-api";

export function useLibraryPoolQuery(id?: string, deps?: any[]) {
  return useQuery<LibraryPool>(
    {
      path: `seqdb-api/library-pool/${id}`,
      include:
        "product,protocol,thermocyclerProfile,storageUnit,storageUnitType"
    },
    { disabled: !id, deps, parser: libraryPoolParser }
  );
}

export default function NgsWorkFlowPoolingRunPage() {
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

  // Loaded Library Pool ID.
  const [libraryPoolId, setLibraryPoolId] = useState<string | undefined>(
    router.query.id?.toString()
  );
  // Loaded Library Pools.
  const libraryPoolQueryState = useLibraryPoolQuery(libraryPoolId, [
    libraryPoolId,
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
    libraryPoolSaved?: PersistedResource<LibraryPool>
  ) {
    setCurrentStep(nextStep);
    if (libraryPoolSaved) {
      setLibraryPoolId(libraryPoolSaved.id);
    }
    await router.push({
      pathname: router.pathname,
      query: {
        ...router.query,
        libraryPoolId: libraryPoolSaved ? libraryPoolSaved.id : libraryPoolId,
        step: "" + nextStep
      }
    });
  }

  if (libraryPoolQueryState.loading) {
    return <LoadingSpinner loading={true} />;
  }

  const buttonBarContent = (
    <>
      <div className="col-md-4">
        <BackToListButton entityLink="/seqdb/ngs-workflow-pooling" />
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

          {currentStep !== 3 ? (
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
          ) : (
            <>
              <Dropdown as={ButtonGroup} style={{ width: "12rem" }}>
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
          style={{ width: "10rem", marginRight: "15px" }}
        >
          <SeqdbMessage id="editButtonText" />
        </Button>
      )}
    </>
  );

  // Helper function to determine if a step should be disabled.
  const isDisabled = (stepNumber: number, libraryPoolRequired: boolean) => {
    // While in edit mode, other steps should be disabled.
    if (editMode && stepNumber !== currentStep) {
      return true;
    }

    // If a PCR Batch is required, and not provided then this step should be disabled.
    if (libraryPoolRequired && !libraryPoolId) {
      return true;
    }

    // Not disabled.
    return false;
  };

  return (
    <PageLayout
      titleId={"ngsWorkflowWholeGenomeSeqPoolingTitle"}
      buttonBarContent={buttonBarContent}
    >
      <Tabs selectedIndex={currentStep} onSelect={setCurrentStep}>
        <TabList>
          <Tab disabled={isDisabled(0, false)}>
            {formatMessage("libraryPool")}
          </Tab>
          <Tab disabled={isDisabled(1, true)}>
            {formatMessage("libraryPoolContent")}
          </Tab>
        </TabList>
        <TabPanel>
          <LibraryPoolStep
            libraryPoolId={libraryPoolId}
            libraryPool={libraryPoolQueryState.response?.data}
            onSaved={onSaved}
            editMode={editMode}
            setEditMode={setEditMode}
            performSave={performSave}
            setPerformSave={setPerformSave}
          />
        </TabPanel>
        <TabPanel>
          {libraryPoolId && libraryPoolQueryState.response?.data && (
            <LibraryPoolContentStep
              libraryPoolId={libraryPoolId}
              libraryPool={libraryPoolQueryState.response?.data}
              onSaved={onSaved}
              editMode={editMode}
              performSave={performSave}
              setEditMode={setEditMode}
              setPerformSave={setPerformSave}
            />
          )}
        </TabPanel>
      </Tabs>
    </PageLayout>
  );
}
