import { FieldView, LoadingSpinner, Query } from "common-ui";
import { Formik } from "formik";
import { noop } from "lodash";
import { WithRouterProps } from "next/dist/client/with-router";
import Link from "next/link";
import { withRouter } from "next/router";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { Head, Nav } from "../../components";
import { StepRenderer } from "../../components/workflow/StepRenderer";
import { Chain } from "../../types/seqdb-api/resources/workflow/Chain";
import { ChainStepTemplate } from "../../types/seqdb-api/resources/workflow/ChainStepTemplate";

export function WorkflowDetailsPage({ router }: WithRouterProps) {
  const { id } = router.query;

  return (
    <div>
      <Head title="NGS Workflow" />
      <Nav />
      <Query<Chain>
        query={{ include: "group,chainTemplate", path: `chain/${id}` }}
      >
        {({ loading, response }) => (
          <div className="container-fluid">
            <Link href="/workflow/list">
              <a>NGS Workflow list</a>
            </Link>
            <h1>NGS Workflow Details{response && `: ${response.data.name}`}</h1>
            <LoadingSpinner loading={loading} />
            {response && <WorkflowSteps chain={response.data} />}
          </div>
        )}
      </Query>
    </div>
  );
}

function WorkflowSteps({ chain }: { chain: Chain }) {
  return (
    <Query<ChainStepTemplate[]>
      query={{
        filter: { "chainTemplate.id": chain.chainTemplate.id as string },
        include: "stepTemplate",
        path: "chainStepTemplate"
      }}
    >
      {({ loading, response }) => {
        const steps = response ? response.data : [];

        return (
          <>
            <LoadingSpinner loading={loading} />
            <Tabs>
              <TabList>
                <Tab>Details</Tab>
                {steps.map(step => (
                  <Tab key={step.id as string}>
                    Step {step.stepNumber}: {step.stepTemplate.name}
                  </Tab>
                ))}
              </TabList>
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
      }}
    </Query>
  );
}

export default withRouter(WorkflowDetailsPage);
