import { FieldView, LoadingSpinner, useQuery } from "common-ui";
import { Formik } from "formik";
import { noop } from "lodash";
import Link from "next/link";
import { useRouter } from "next/router";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { Head, Nav } from "../../components";
import { StepRenderer } from "../../components/workflow/StepRenderer";
import { Chain } from "../../types/seqdb-api/resources/workflow/Chain";
import { ChainStepTemplate } from "../../types/seqdb-api/resources/workflow/ChainStepTemplate";

export default function WorkflowDetailsPage() {
  const {
    query: { id }
  } = useRouter();

  const { loading, response } = useQuery<Chain>({
    include: "group,chainTemplate",
    path: `chain/${id}`
  });

  return (
    <>
      <Head
        title={`NGS Workflow${response ? `: ${response.data.name}` : ""}`}
      />
      <Nav />
      <div className="container-fluid">
        <Link href="/workflow/list">
          <a>NGS Workflow list</a>
        </Link>
        <h1>NGS Workflow Details{response && `: ${response.data.name}`}</h1>
        <LoadingSpinner loading={loading} />
        {response && <WorkflowSteps chain={response.data} />}
      </div>
    </>
  );
}

function WorkflowSteps({ chain }: { chain: Chain }) {
  const { loading, response } = useQuery<ChainStepTemplate[]>({
    filter: { "chainTemplate.id": chain.chainTemplate.id as string },
    include: "stepTemplate",
    path: "chainStepTemplate"
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
              <Tab>Details</Tab>
              {steps.map(step => (
                <Tab key={step.id}>
                  Step {step.stepNumber}: {step.stepTemplate.name}
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
              <FieldView label="Template" name="chainTemplate.name" />
              <FieldView label="Group" name="group.groupName" />
              <FieldView name="name" />
              <FieldView name="dateCreated" />
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
