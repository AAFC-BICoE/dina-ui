import {
  BackButton,
  ButtonBar,
  DeleteButton,
  DinaForm,
  EditButton,
  withResponse
} from "common-ui";
import { WithRouterProps } from "next/dist/client/with-router";
import { withRouter } from "next/router";
import { Head, Nav } from "../../../components";
import { useSeqdbIntl } from "../../../intl/seqdb-intl";
import { PcrBatch } from "../../../types/seqdb-api";
import { PcrBatchFormFields, usePcrBatchQuery } from "./edit";

export function PcrBatchDetailsPage({ router }: WithRouterProps) {
  const id = router.query.id?.toString();
  const { formatMessage } = useSeqdbIntl();

  const resourceQuery = usePcrBatchQuery(id);

  return (
    <div>
      <Head
        title={formatMessage("pcrBatchViewTitle")}
        lang={formatMessage("languageOfPage")}
        creator={formatMessage("agricultureCanada")}
        subject={formatMessage("subjectTermsForPage")}
      />
      <Nav />
      <main className="container">
        {withResponse(resourceQuery, ({ data }) => (
          <DinaForm<PcrBatch> initialValues={data} readOnly={true}>
            <ButtonBar>
              <BackButton
                entityId={data.id}
                entityLink="/seqdb/pcr-batch"
                byPassView={true}
              />
              <EditButton
                className="ms-auto"
                entityId={data.id}
                entityLink="seqdb/pcr-batch"
              />
              <DeleteButton
                className="ms-5"
                id={data.id}
                options={{ apiBaseUrl: "/seqdb-api" }}
                postDeleteRedirect="/seqdb/pcr-batch/list"
                type="pcr-batch"
              />
            </ButtonBar>
            <PcrBatchFormFields />
          </DinaForm>
        ))}
      </main>
    </div>
  );
}

export default withRouter(PcrBatchDetailsPage);
