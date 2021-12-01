import {
  DinaForm,
  DinaFormOnSubmit,
  filterBy,
  ResourceSelectField,
  SubmitButton,
  TextField,
  useQuery,
  withResponse
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
  const title = id ? "editWorkflowTitle" : "addWorkflowTitle";

  const query = useQuery<Chain>({
    include: "chainTemplate",
    path: `seqdb-api/chain/${id}`
  });

  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <main className="container-fluid">
        {id ? (
          <div>
            <h1 id="wb-cont">
              <SeqdbMessage id="editWorkflowTitle" />
            </h1>
            {withResponse(query, ({ data }) => (
              <ChainForm chain={data} router={router} />
            ))}
          </div>
        ) : (
          <div>
            <h1 id="wb-cont">
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
  const initialValues = chain || {};

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
              enableStoredDefaultGroup={true}
            />
          </div>
          <div className="row">
            <ResourceSelectField<ChainTemplate>
              className="col-md-2"
              label="Workflow Template"
              name="chainTemplate"
              filter={filterBy(["name"])}
              model="seqdb-api/chain-template"
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
