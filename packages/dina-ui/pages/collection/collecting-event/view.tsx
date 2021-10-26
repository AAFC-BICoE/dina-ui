import {
  BackButton,
  ButtonBar,
  DeleteButton,
  DinaForm,
  EditButton,
  withResponse
} from "common-ui";
import { WithRouterProps } from "next/dist/client/with-router";
import Link from "next/link";
import { withRouter } from "next/router";
import { Footer, Head, Nav } from "../../../components";
import { useCollectingEventQuery } from "../../../components/collection";
import { CollectingEventFormLayout } from "../../../components/collection/collecting-event/CollectingEventFormLayout";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { CollectingEvent } from "../../../types/collection-api/resources/CollectingEvent";

export function CollectingEventDetailsPage({ router }: WithRouterProps) {
  const { id } = router.query;
  const { formatMessage } = useDinaIntl();

  const collectingEventQuery = useCollectingEventQuery(id?.toString());

  const buttonBar = (
    <ButtonBar>
      <BackButton
        entityId={id as string}
        entityLink="/collection/collecting-event"
        byPassView={true}
      />
      <EditButton
        className="ms-auto"
        entityId={id as string}
        entityLink="collection/collecting-event"
      />
      <Link href={`/collection/collecting-event/revisions?id=${id}`}>
        <a className="btn btn-info">
          <DinaMessage id="revisionsButtonText" />
        </a>
      </Link>
      <DeleteButton
        className="ms-5"
        id={id as string}
        options={{ apiBaseUrl: "/collection-api" }}
        postDeleteRedirect="/collection/collecting-event/list"
        type="collecting-event"
      />
    </ButtonBar>
  );

  return (
    <div>
      <Head
        title={formatMessage("collectingEventViewTitle")}
        lang={formatMessage("languageOfPage")}
        creator={formatMessage("agricultureCanada")}
        subject={formatMessage("subjectTermsForPage")}
      />
      <Nav />
      {withResponse(collectingEventQuery, ({ data: colEvent }) => {
        return (
          <main className="container-fluid">
            <h1 id="wb-cont">
              <DinaMessage id="collectingEventViewTitle" />
            </h1>
            {buttonBar}
            <div className="mb-3">
              <DinaForm<CollectingEvent>
                initialValues={colEvent}
                readOnly={true}
              >
                <CollectingEventFormLayout />
              </DinaForm>
            </div>
            {buttonBar}
          </main>
        );
      })}
      <Footer />
    </div>
  );
}

export default withRouter(CollectingEventDetailsPage);
