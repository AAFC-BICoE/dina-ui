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
import { SourceAdministrativeLevel } from "packages/dina-ui/types/collection-api/resources/GeographicPlaceNameSourceDetail";
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
        className="ml-auto"
        entityId={id as string}
        entityLink="collection/collecting-event"
      />
      <Link href={`/collection/collecting-event/revisions?id=${id}`}>
        <a className="btn btn-info">
          <DinaMessage id="revisionsButtonText" />
        </a>
      </Link>
      <DeleteButton
        className="ml-5"
        id={id as string}
        options={{ apiBaseUrl: "/collection-api" }}
        postDeleteRedirect="/collection/collecting-event/list"
        type="collecting-event"
      />
    </ButtonBar>
  );

  let srcAdminLevels: SourceAdministrativeLevel[] = [];

  return (
    <div>
      <Head title={formatMessage("collectingEventViewTitle")} />
      <Nav />
      {buttonBar}
      {withResponse(collectingEventQuery, ({ data: colEvent }) => {
        // can either have one of customGeographicPlace or selectedGeographicPlace
        if (colEvent?.geographicPlaceNameSourceDetail?.customGeographicPlace) {
          const customPlaceNameAsInSrcAdmnLevel: SourceAdministrativeLevel = {};
          customPlaceNameAsInSrcAdmnLevel.name =
            colEvent.geographicPlaceNameSourceDetail.customGeographicPlace;
          srcAdminLevels.push(customPlaceNameAsInSrcAdmnLevel);
        }
        if (colEvent.geographicPlaceNameSourceDetail?.selectedGeographicPlace)
          srcAdminLevels.push(
            colEvent.geographicPlaceNameSourceDetail?.selectedGeographicPlace
          );
        if (colEvent.geographicPlaceNameSourceDetail?.higherGeographicPlaces)
          srcAdminLevels = srcAdminLevels.concat(
            colEvent.geographicPlaceNameSourceDetail?.higherGeographicPlaces
          );

        srcAdminLevels?.map(
          admn =>
            (admn.name += admn.placeType ? " [ " + admn.placeType + " ] " : "")
        );
        colEvent.srcAdminLevels = srcAdminLevels;

        return (
          <main className="container-fluid">
            <h1>
              <DinaMessage id="collectingEventViewTitle" />
            </h1>
            <div className="form-group">
              <DinaForm<CollectingEvent>
                initialValues={colEvent}
                readOnly={true}
              >
                <CollectingEventFormLayout />
              </DinaForm>
            </div>
          </main>
        );
      })}
      {buttonBar}
      <Footer />
    </div>
  );
}

export default withRouter(CollectingEventDetailsPage);
