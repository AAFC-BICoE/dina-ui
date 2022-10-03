import { BackToListButton, ButtonBar } from "common-ui";
import { PersistedResource } from "kitsu";
import { useRouter } from "next/router";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { Footer, Head, Nav } from "../../../components";
import { SangerPcrBatchStep } from "../../../components/seqdb/sanger-workflow/SangerPcrBatchStep";
import { SangerSampleSelectionStep } from "../../../components/seqdb/sanger-workflow/SangerSampleSelectionStep";
import { PCRBatchPlatingStep } from "../../../components/seqdb/sanger-workflow/pcr-batch-plating-step/PCRBatchPlatingStep";
import { useSeqdbIntl } from "../../../intl/seqdb-intl";
import { PcrBatch } from "../../../types/seqdb-api";

export default function SangerWorkFlowRunPage() {
  const router = useRouter();
  const { formatMessage } = useSeqdbIntl();

  const pcrBatchId = router.query.pcrBatchId?.toString();

  const stepNumber = Number(router.query.step || 0) ?? (pcrBatchId ? 1 : 0);

  function goToStep(newIndex: number) {
    router.push({
      pathname: router.pathname,
      query: { ...router.query, step: newIndex }
    });
  }

  async function finishPcrBatchStep(pcrBatch: PersistedResource<PcrBatch>) {
    await router.push({
      pathname: router.pathname,
      query: { ...router.query, pcrBatchId: pcrBatch.id, step: "1" }
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
        <h1>{title}</h1>
        <Tabs selectedIndex={stepNumber} onSelect={goToStep}>
          <TabList>
            <Tab>{formatMessage("pcrBatch")}</Tab>
            <Tab disabled={!pcrBatchId}>
              {formatMessage("selectMaterialSamples")}
            </Tab>
            <Tab disabled={!pcrBatchId}>
              {formatMessage("selectCoodinates")}
            </Tab>
          </TabList>
          <TabPanel>
            <SangerPcrBatchStep
              pcrBatchId={pcrBatchId}
              onSaved={finishPcrBatchStep}
            />
          </TabPanel>
          <TabPanel>
            {pcrBatchId && (
              <SangerSampleSelectionStep pcrBatchId={pcrBatchId} />
            )}
          </TabPanel>
          <TabPanel>
            {pcrBatchId && (
              <PCRBatchPlatingStep pcrBatchId={pcrBatchId} />
            )}
          </TabPanel>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
