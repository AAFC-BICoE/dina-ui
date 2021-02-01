import {
  DinaForm,
  DinaFormOnSubmit,
  filterBy,
  LoadingSpinner,
  Query,
  ResourceSelectField,
  SubmitButton,
  TextField,
  useAccount
} from "common-ui";
import { WithRouterProps } from "next/dist/client/with-router";
import { NextRouter, withRouter } from "next/router";
import { GroupSelectField, Head, Nav } from "../../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import { Chain, ChainTemplate } from "../../../types/seqdb-api";

interface ChainFormProps {
  chain?: any;
  router: NextRouter;
}

export function ChainEditPage({ router }: WithRouterProps) {
  const { id } = router.query;
  const { formatMessage } = useSeqdbIntl();

  return (
    <div>
      <Head title={formatMessage("editWorkflowTitle")} />
      <Nav />
      <main className="container-fluid">
        {id ? (
          <div>
            <h1>
              <SeqdbMessage id="editWorkflowTitle" />
            </h1>
            <Query<Chain>
              query={{
                include: "chainTemplate",
                path: `seqdb-api/chain/${id}`
              }}
            >
              {({ loading, response }) => (
                <div>
                  <LoadingSpinner loading={loading} />
                  {response && (
                    <ChainForm chain={response.data} router={router} />
                  )}
                </div>
              )}
            </Query>
          </div>
        ) : (
          <div>
            <h1>
              <SeqdbMessage id="addWorkflowTitle" />
            </h1>
            <ChainForm router={router} />
          </div>
        )}
      </main>
    </div>
  );
}

function ChainForm({ chain, router }: ChainFormProps) {
  const { groupNames } = useAccount();

  const initialValues = chain || { group: groupNames?.[0] };

  const onSubmit: DinaFormOnSubmit = async ({
    api: { save },
    submittedValues
  }) => {
    const response = await save(
      [
        {
          resource: submittedValues,
          type: "chain"
        }
      ],
      { apiBaseUrl: "/seqdb-api" }
    );

    const newId = response[0].id;
    await router.push(`/seqdb/workflow/view?id=${newId}`);
  };

  return (
    <div>
      <div className="container-fluid">
        <DinaForm initialValues={initialValues} onSubmit={onSubmit}>
          <div className="row">
            <GroupSelectField
              className="col-md-3"
              name="group"
              groupName={initialValues.group}
            />
          </div>
          <div className="row">
            <ResourceSelectField<ChainTemplate>
              className="col-md-2"
              label="Workflow Template"
              name="chainTemplate"
              filter={filterBy(["name"])}
              model="seqdb-api/chainTemplate"
              optionLabel={template => template.name}
            />
          </div>
          <div className="row">
            <TextField className="col-md-2" name="name" />
          </div>
          <SubmitButton />
        </DinaForm>
      </div>
    </div>
  );
}

export default withRouter(ChainEditPage);
