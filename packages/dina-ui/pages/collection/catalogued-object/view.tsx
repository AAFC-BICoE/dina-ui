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
import { useRouter } from "next/router";
import Link from "next/link";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { Head, Nav } from "../../../components";
import { PhysicalEntity } from "../../../types/collection-api";
import { CataloguedObjectFormLayout } from "./edit";
import { useCollectingEventQuery } from "../../../components/collection/useCollectingEvent";
import { CollectingEventFormLayout } from "../../../components/collection/CollectingEventFormLayout";

export default function PhysicalEntityViewPage() {
  const router = useRouter();
  const { formatMessage } = useDinaIntl();

  const { id } = router.query;

  const physicalEntityQuery = useQuery<PhysicalEntity>({
    path: `collection-api/physical-entity/${id}?include=collectingEvent`
  });

  const colEventQuery = useCollectingEventQuery(
    physicalEntityQuery.response?.data?.collectingEvent?.id
  );

  const collectingEvent = colEventQuery.response?.data;

  const buttonBar = (
    <ButtonBar>
      <BackButton
        entityId={id as string}
        entityLink="/collection/catalogued-object"
        byPassView={true}
      />
      <EditButton
        className="ml-auto"
        entityId={id as string}
        entityLink="collection/catalogued-object"
      />
      <DeleteButton
        className="ml-5"
        id={id as string}
        options={{ apiBaseUrl: "/collection-api" }}
        postDeleteRedirect="/collection/catalogued-object/list"
        type="physical-entity"
      />
    </ButtonBar>
  );

  return (
    <div>
      <Head title={formatMessage("cataloguedObjectViewTitle")} />
      <Nav />
      {withResponse(physicalEntityQuery, ({ data: physicalEntity }) => (
        <main className="container">
          {buttonBar}
          <h1>
            <DinaMessage id="cataloguedObjectViewTitle" />
          </h1>
          <DinaForm<PhysicalEntity>
            initialValues={physicalEntity}
            readOnly={true}
          >
            <CataloguedObjectFormLayout />
            <FieldSet legend={<DinaMessage id="collectingEvent" />}>
              {collectingEvent && (
                <DinaForm initialValues={collectingEvent} readOnly={true}>
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
