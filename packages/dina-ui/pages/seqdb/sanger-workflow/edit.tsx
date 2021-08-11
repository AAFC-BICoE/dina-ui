import { BackToListButton, ButtonBar, withResponse } from "common-ui";
import { PersistedResource } from "kitsu";
import { useRouter } from "next/router";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { Head, Nav } from "../../../components";
import { useSeqdbIntl } from "../../../intl/seqdb-intl";
import { PcrBatch } from "../../../types/seqdb-api";
import { PcrBatchForm, usePcrBatchQuery } from "../pcr-batch/edit";

export default function SangerWorkFlowEditPage() {
  const router = useRouter();
  const { formatMessage } = useSeqdbIntl();

  const pcrBatchId = router.query.pcrBatchId?.toString();

  const pcrBatchQuery = usePcrBatchQuery(pcrBatchId);

  const stepNumber = Number(router.query.step) || 0;

  function goToStep(newIndex: number) {
    router.push({
      pathname: router.pathname,
      query: { ...router.query, step: newIndex }
    });
  }

  async function goToNextStep() {
    await goToStep(stepNumber + 1);
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
          <BackToListButton entityLink="/seqdb/workflow" />
        </ButtonBar>
        <h1>{formatMessage("sangerWorkflow")}</h1>
        <Tabs selectedIndex={stepNumber} onSelect={goToStep}>
          <TabList>
            <Tab>{formatMessage("pcrBatch")}</Tab>
          </TabList>
          <TabPanel>
            {pcrBatchId ? (
              withResponse(pcrBatchQuery, ({ data: pcrBatch }) => (
                <PcrBatchForm
                  pcrBatch={pcrBatch}
                  onSaved={finishPcrBatchStep}
                />
              ))
            ) : (
              <PcrBatchForm onSaved={finishPcrBatchStep} />
            )}
          </TabPanel>
        </Tabs>
      </main>
    </div>
  );
}
