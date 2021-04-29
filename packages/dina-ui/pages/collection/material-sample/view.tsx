import {
  BackButton,
  ButtonBar,
  DeleteButton,
  DinaForm,
  EditButton,
  FieldSet,
  useQuery,
  withResponse
} from "common-ui";
import { WithRouterProps } from "next/dist/client/with-router";
import Link from "next/link";
import { withRouter } from "next/router";
import { Head, Nav } from "../../../components";
import { CollectingEventFormLayout } from "../../../components/collection/CollectingEventFormLayout";
import { useCollectingEventQuery } from "../../../components/collection/useCollectingEvent";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { MaterialSample } from "../../../types/collection-api";
import { MaterialSampleFormLayout } from "./edit";

export function MaterialSampleViewPage({ router }: WithRouterProps) {
  const { formatMessage } = useDinaIntl();

  const { id } = router.query;

  const materialSampleQuery = useQuery<MaterialSample>({
    path: `collection-api/material-sample/${id}?include=collectingEvent`
  });

  const colEventQuery = useCollectingEventQuery(
    materialSampleQuery.response?.data?.collectingEvent?.id
  );

  const collectingEvent = colEventQuery.response?.data;

  const buttonBar = (
    <ButtonBar>
      <BackButton
        entityId={id as string}
        entityLink="/collection/material-sample"
        byPassView={true}
      />
      <EditButton
        className="ml-auto"
        entityId={id as string}
        entityLink="collection/material-sample"
      />
      <DeleteButton
        className="ml-5"
        id={id as string}
        options={{ apiBaseUrl: "/collection-api" }}
        postDeleteRedirect="/collection/material-sample/list"
        type="material-sample"
      />
    </ButtonBar>
  );

  return (
    <div>
      <Head title={formatMessage("materialSampleViewTitle")} />
      <Nav />
      {withResponse(materialSampleQuery, ({ data: materialSample }) => (
        <main className="container-fluid">
          {buttonBar}
          <h1>
            <DinaMessage id="materialSampleViewTitle" />
          </h1>
          <DinaForm<MaterialSample>
            initialValues={materialSample}
            readOnly={true}
          >
            <MaterialSampleFormLayout />
            <FieldSet legend={<DinaMessage id="collectingEvent" />}>
              {collectingEvent && (
                <DinaForm initialValues={collectingEvent} readOnly={true}>
                  <div className="form-group d-flex justify-content-end align-items-center">
                    <Link
                      href={`/collection/collecting-event/view?id=${collectingEvent.id}`}
                    >
                      <a target="_blank">
                        <DinaMessage id="collectingEventDetailsPageLink" />
                      </a>
                    </Link>
                  </div>
                  <CollectingEventFormLayout />
                </DinaForm>
              )}
            </FieldSet>
          </DinaForm>
          {buttonBar}
        </main>
      ))}
    </div>
  );
}

export default withRouter(MaterialSampleViewPage);
