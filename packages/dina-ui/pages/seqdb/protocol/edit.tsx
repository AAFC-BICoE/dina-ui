import {
  ButtonBar,
  BackButton,
  DinaForm,
  DinaFormOnSubmit,
  filterBy,
  LoadingSpinner,
  Query,
  ResourceSelectField,
  SelectField,
  SubmitButton,
  TextField
} from "common-ui";
import { WithRouterProps } from "next/dist/client/with-router";
import { NextRouter, withRouter } from "next/router";
import { GroupSelectField, Head, Nav } from "../../../components";
import { SeqdbMessage, useSeqdbIntl } from "../../../intl/seqdb-intl";
import { Product } from "../../../types/seqdb-api/resources/Product";
import {
  Protocol,
  protocolTypeLabels
} from "../../../types/seqdb-api/resources/Protocol";

interface ProtocolFormProps {
  protocol?: Protocol;
  router: NextRouter;
}

export function ProtocolEditPage({ router }: WithRouterProps) {
  const { id } = router.query;
  const { formatMessage } = useSeqdbIntl();
  const title = id ? "editProtocolTitle" : "addProtocolTitle";

  return (
    <div>
      <Head title={formatMessage(title)}
						lang={formatMessage("languageOfPage")} 
						creator={formatMessage("agricultureCanada")}
						subject={formatMessage("subjectTermsForPage")} />
			<Nav />
      <main className="container-fluid">
        {id ? (
          <div>
            <h1 id="wb-cont">
              <SeqdbMessage id="editProtocolTitle" />
            </h1>
            <Query<Protocol>
              query={{ include: "kit", path: `seqdb-api/protocol/${id}` }}
            >
              {({ loading, response }) => (
                <div>
                  <LoadingSpinner loading={loading} />
                  {response && (
                    <ProtocolForm protocol={response.data} router={router} />
                  )}
                </div>
              )}
            </Query>
          </div>
        ) : (
          <div>
            <h1 id="wb-cont">
              <SeqdbMessage id="addProtocolTitle" />
            </h1>
            <ProtocolForm router={router} />
          </div>
        )}
      </main>
    </div>
  );
}

function ProtocolForm({ protocol, router }: ProtocolFormProps) {
  const { id } = router.query;
  const initialValues = protocol || {};

  const onSubmit: DinaFormOnSubmit = async ({
    api: { save },
    submittedValues
  }) => {
    // Override the product type with "product" when kit is available
    if (submittedValues.kit) {
      submittedValues.kit.type = "product";
    }

    const response = await save(
      [
        {
          resource: submittedValues,
          type: "protocol"
        }
      ],
      { apiBaseUrl: "/seqdb-api" }
    );

    const newId = response[0].id;
    await router.push(`/seqdb/protocol/view?id=${newId}`);
  };

  return (
    <DinaForm initialValues={initialValues} onSubmit={onSubmit}>
      <ButtonBar>
        <SubmitButton />
        <BackButton entityId={id as string} entityLink="/seqdb/protocol" />
      </ButtonBar>
      <div>
        <div className="row">
          <GroupSelectField
            className="col-md-2"
            name="group"
            enableStoredDefaultGroup={true}
          />
        </div>
        <div className="row">
          <SelectField
            className="col-md-2"
            name="type"
            label="Protocol Type"
            options={PROTOCOL_TYPE_OPTIONS}
          />
          <TextField className="col-md-2" name="name" />
          <TextField className="col-md-2" name="version" />
          <TextField className="col-md-2" name="description" />
        </div>
        <div className="row">
          <TextField className="col-md-8" name="steps" />
        </div>
        <div className="row">
          <TextField className="col-md-8" name="notes" multiLines={true} />
        </div>
        <div className="row">
          <TextField className="col-md-2" name="reference" />
          <TextField className="col-md-2" name="equipment" />
          <ResourceSelectField<Product>
            className="col-md-4"
            name="kit"
            filter={filterBy(["name"])}
            model="seqdb-api/product"
            optionLabel={product => product.name}
          />
        </div>
      </div>
    </DinaForm>
  );
}

const PROTOCOL_TYPE_OPTIONS = [
  "COLLECTION_EVENT",
  "DNA_EXTRACTION",
  "PCR_REACTION",
  "SEQ_REACTION",
  "SPECIMEN_PREPARATION"
].map(value => ({ value, label: protocolTypeLabels[value] }));

export default withRouter(ProtocolEditPage);
