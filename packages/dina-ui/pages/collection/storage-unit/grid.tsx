import { BackButton, withResponse } from "packages/common-ui/lib";
import { Head, storageUnitDisplayName } from "packages/dina-ui/components";
import PageLayout from "packages/dina-ui/components/page/PageLayout";
import { DinaMessage, useDinaIntl } from "packages/dina-ui/intl/dina-ui-intl";
import { useRouter } from "next/router";
import { useStorageUnit } from "./edit";
import { useState } from "react";
import { Tabs, TabList, Tab, TabPanel } from "react-tabs";
import { Button, Spinner } from "react-bootstrap";
import { SeqdbMessage } from "packages/dina-ui/intl/seqdb-intl";
import { StorageUnitSampleSelectionStep } from "packages/dina-ui/components/storage/grid/StorageUnitSampleSelectionStep";
import { StorageUnitSelectCoordinatesStep } from "packages/dina-ui/components/storage/grid/StorageUnitSelectCoordinatesStep";

export const SELECT_MATERIAL_SAMPLES_TAB_INDEX = 0;
export const SELECT_COORDINATES_TAB_INDEX = 1;

export default function StorageUnitGridPage() {
  return <StorageUnitGridForm />;
}

function StorageUnitGridForm() {
  const { formatMessage } = useDinaIntl();
  const router = useRouter();
  const id = router.query.storageUnitId?.toString();
  const storageUnitQuery = useStorageUnit(id);
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

  async function onSaved(nextStep?: number) {
    setPerformSave(false);
    // If a next step is provided, we follow the chain to the next tab
    if (nextStep) {
      setCurrentStep(nextStep);
    } else {
      // No nextStep provided, set editMode to false
      setEditMode(false);
    }
  }

  const buttonBarContent = (
    <>
      <div className="col-md-4">
        <BackButton
          entityLink="/collection/storage-unit"
          entityId={id}
          className="btn btn-primary"
        />
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
  const isDisabled = (stepNumber: number) => {
    // While in edit mode, other steps should be disabled.
    if (editMode && stepNumber !== currentStep) {
      return true;
    }

    // Not disabled.
    return false;
  };

  return (
    <PageLayout
      titleId={formatMessage("storageUnitGridTitle")}
      buttonBarContent={buttonBarContent}
    >
      {withResponse(storageUnitQuery, ({ data }) => (
        <>
          <Head title={storageUnitDisplayName(data)} />
          <Tabs selectedIndex={currentStep} onSelect={setCurrentStep}>
            <TabList>
              <Tab disabled={isDisabled(SELECT_MATERIAL_SAMPLES_TAB_INDEX)}>
                {formatMessage("selectMaterialSamples")}
              </Tab>
              <Tab disabled={isDisabled(SELECT_COORDINATES_TAB_INDEX)}>
                {formatMessage("selectCoordinates")}
              </Tab>
            </TabList>
            <TabPanel>
              <StorageUnitSampleSelectionStep
                onSaved={onSaved}
                performSave={performSave}
                editMode={editMode}
                storageUnit={data}
                currentStep={currentStep}
              />
            </TabPanel>
            <TabPanel>
              <StorageUnitSelectCoordinatesStep
                onSaved={onSaved}
                performSave={performSave}
                editMode={editMode}
                storageUnit={data}
                currentStep={currentStep}
              />
            </TabPanel>
          </Tabs>
        </>
      ))}
    </PageLayout>
  );
}
