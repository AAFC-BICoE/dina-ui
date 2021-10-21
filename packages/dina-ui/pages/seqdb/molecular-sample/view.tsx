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
import { MolecularSample } from "../../../types/seqdb-api";
import { MolecularSampleFields, useMolecularSample } from "./edit";

export function MolecularSampleDetailsPage({ router }: WithRouterProps) {
  const id = String(router.query.id);
  const { formatMessage } = useSeqdbIntl();

  const molecularSampleQuery = useMolecularSample(id);

  return (
    <div>
      <Head title={formatMessage("molecularSampleViewTitle")}
						lang={formatMessage("languageOfPage")} 
						creator={formatMessage("agricultureCanada")}
						subject={formatMessage("subjectTermsForPage")} />
			<Nav />
      <main className="container">
        <ButtonBar>
          <BackButton
            entityId={id}
            entityLink="/seqdb/molecular-sample"
            byPassView={true}
          />
          <EditButton
            className="ms-auto"
            entityId={id}
            entityLink="seqdb/molecular-sample"
          />
          <DeleteButton
            className="ms-5"
            id={id}
            options={{ apiBaseUrl: "/seqdb-api" }}
            postDeleteRedirect="/seqdb/molecular-sample/list"
            type="molecularSample"
          />
        </ButtonBar>
        {withResponse(molecularSampleQuery, ({ data }) => (
          <DinaForm<MolecularSample> initialValues={data} readOnly={true}>
            <MolecularSampleFields />
          </DinaForm>
        ))}
      </main>
    </div>
  );
}

export default withRouter(MolecularSampleDetailsPage);
