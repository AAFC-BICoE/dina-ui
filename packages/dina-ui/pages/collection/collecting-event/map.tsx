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
import { CollectingEventFormLayout } from "../../../components/collection/CollectingEventFormLayout";
import { useCollectingEventQuery } from "../../../components/collection/useCollectingEvent";
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
      <Head title={formatMessage("collectingEventViewTitle")} 
      />
      <Nav />
        <div>
          <iframe id="ifranecbdd6677-bc8d-4901-9ae7-a1eb2f9d44c0"
            sandbox="allow-scripts"
            scrolling="no" 
            width="100%"
            height="500"
            src="https://www-dev.agr.gc.ca/atlas/samples/liz/aef/nosurround.html?AGRIAPP=3&APPID=a5fc89c63b4647908e968e41a4f4dcba&dontchangetitle=true&top_app_iframe=ifranecbdd6677-bc8d-4901-9ae7-a1eb2f9d44c0">
          </iframe>
        </div>
      <Footer />
    </div>
  );
}

export default withRouter(CollectingEventDetailsPage);
