import {
  BackToListButton,
  ButtonBar,
  EditButton,
  FieldView,
  LoadingSpinner,
  useQuery
} from "common-ui";
import { Formik } from "formik";
import { PersistedResource } from "kitsu";
import { noop } from "lodash";
import Link from "next/link";
import { useRouter } from "next/router";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { Head, Nav } from "../../../components";
import { StepRenderer } from "../../../components/seqdb/workflow/StepRenderer";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import { Chain, ChainStepTemplate } from "../../../types/seqdb-api";

export default function WorkflowViewPage() {
  const {
    query: { id }
  } = useRouter();
  const { formatMessage } = useSeqdbIntl();

  const { loading, response } = useQuery<Chain>({
    include: "chainTemplate",
    path: `seqdb-api/chain/${id}`
  });

  return (
    <>
      <Head
        title={`${formatMessage("workflowViewTitle")}${
          response ? `: ${response.data.name}` : ""
        }`}
      />
      <Nav />
      <ButtonBar>
        <EditButton entityId={id as string} entityLink="seqdb/workflow" />
        <BackToListButton entityLink="/seqdb/workflow" />
      </ButtonBar>
      <div className="container-fluid">
        <Link href="/seqdb/workflow/list">
          <a>NGS Workflow list</a>
        </Link>
        <h1>
          {formatMessage("workflowViewTitle")}
          {response && `: ${response.data.name}`}
        </h1>
        <LoadingSpinner loading={loading} />
        {response && <WorkflowSteps chain={response.data} />}
      </div>
    </>
  );
}

function WorkflowSteps({ chain }: { chain: PersistedResource<Chain> }) {
  const { loading, response } = useQuery<ChainStepTemplate[]>({
    filter: { "chainTemplate.uuid": chain.chainTemplate.id as string },
    include: "stepTemplate",
    path: "seqdb-api/chainStepTemplate"
  });

  const router = useRouter();
  const stepNumber = router.query.step ? Number(router.query.step) : 0;

  function goToStep(newIndex: number) {
    router.push({
      pathname: router.pathname,
      query: { ...router.query, step: newIndex }
    });
  }

  function goToNextStep() {
    goToStep(stepNumber + 1);
  }

  const steps = response ? response.data : [];

  return (
    <>
      <LoadingSpinner loading={loading} />
      <Tabs selectedIndex={stepNumber} onSelect={goToStep}>
        <div className="list-inline">
          <div className="list-inline-item">
            <TabList>
              <Tab>
                <SeqdbMessage id="workflowDetailsTab" />
              </Tab>
              {steps.map(step => (
                <Tab key={step.id}>
                  <SeqdbMessage
                    id="workflowStepTab"
                    values={{
                      name: step.stepTemplate.name,
                      number: step.stepNumber
                    }}
                  />
                </Tab>
              ))}
            </TabList>
          </div>
          <div className="list-inline-item">
            {stepNumber < steps.length && (
              <button className="btn btn-primary" onClick={goToNextStep}>
                Next Step
              </button>
            )}
          </div>
        </div>
        <TabPanel>
          <Formik initialValues={chain} onSubmit={noop}>
            <div className="col-md-3">
              <FieldView name="group" />
              <FieldView label="Template" name="chainTemplate.name" />
              <FieldView name="name" />
            </div>
          </Formik>
        </TabPanel>
        {steps.map(step => (
          <TabPanel key={step.id as string}>
            <StepRenderer
              chainStepTemplates={steps}
              chain={chain}
              step={step}
            />
          </TabPanel>
        ))}
      </Tabs>
    </>
  );
}
