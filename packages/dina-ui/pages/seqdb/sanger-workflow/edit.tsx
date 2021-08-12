import {
  BackToListButton,
  ButtonBar,
  DinaForm,
  EditButton,
  SubmitButton,
  withResponse
} from "common-ui";
import { PersistedResource } from "kitsu";
import { useRouter } from "next/router";
import { useState } from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { Head, Nav } from "../../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import { PcrBatch } from "../../../types/seqdb-api";
import {
  PcrBatchForm,
  PcrBatchFormFields,
  usePcrBatchQuery
} from "../pcr-batch/edit";

export default function SangerWorkFlowEditPage() {
  const router = useRouter();
  const { formatMessage } = useSeqdbIntl();

  const pcrBatchId = router.query.pcrBatchId?.toString();

  const stepNumber = Number(router.query.step) || 0;

  function goToStep(newIndex: number) {
    router.push({
      pathname: router.pathname,
      query: { ...router.query, step: newIndex }
    });
  }

  function goToNextStep() {
    goToStep(stepNumber + 1);
  }

  async function finishPcrBatchStep(pcrBatch: PersistedResource<PcrBatch>) {
    await router.push({
      pathname: router.pathname,
      query: { ...router.query, pcrBatchId: pcrBatch.id }
    });
  }

  const title = formatMessage("sangerWorkflow");

  return (
    <div>
      <Head title={title} />
      <Nav />
      <main className="container">
        <ButtonBar>
          <BackToListButton entityLink="/seqdb/sanger-workflow" />
        </ButtonBar>
        <h1>{formatMessage("sangerWorkflow")}</h1>
        <Tabs selectedIndex={stepNumber} onSelect={goToStep}>
          <TabList>
            <Tab>{formatMessage("pcrBatch")}</Tab>
          </TabList>
          <TabPanel>
            <PcrBatchStep
              pcrBatchId={pcrBatchId}
              onSaved={finishPcrBatchStep}
            />
          </TabPanel>
        </Tabs>
      </main>
    </div>
  );
}

interface PcrBatchStepProps {
  pcrBatchId?: string;
  onSaved: (resource: PersistedResource<PcrBatch>) => Promise<void>;
}

function PcrBatchStep({ pcrBatchId, onSaved }: PcrBatchStepProps) {
  const [editMode, setEditMode] = useState(!pcrBatchId);

  const pcrBatchQuery = usePcrBatchQuery(pcrBatchId, [editMode]);

  async function onSavedInternal(resource: PersistedResource<PcrBatch>) {
    await onSaved(resource);
    setEditMode(false);
  }

  return pcrBatchId ? (
    withResponse(pcrBatchQuery, ({ data: pcrBatch }) =>
      editMode ? (
        <PcrBatchForm
          pcrBatch={pcrBatch}
          onSaved={onSavedInternal}
          buttonBar={
            <ButtonBar>
              <button
                className="btn btn-dark"
                type="button"
                onClick={() => setEditMode(false)}
                style={{ width: "10rem" }}
              >
                <SeqdbMessage id="cancelButtonText" />
              </button>
              <SubmitButton className="ms-auto" />
            </ButtonBar>
          }
        />
      ) : (
        <DinaForm<PcrBatch> initialValues={pcrBatch} readOnly={true}>
          <ButtonBar>
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => setEditMode(true)}
              style={{ width: "10rem" }}
            >
              <SeqdbMessage id="editButtonText" />
            </button>
          </ButtonBar>
          <PcrBatchFormFields />
        </DinaForm>
      )
    )
  ) : (
    <PcrBatchForm onSaved={onSavedInternal} />
  );
}
