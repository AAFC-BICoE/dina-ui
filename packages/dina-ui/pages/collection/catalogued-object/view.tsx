import {
  BackButton,
  ButtonBar,
  DeleteButton,
  DinaForm,
  EditButton,
  useQuery,
  withResponse
} from "common-ui";
import { useRouter } from "next/router";
import Link from "next/link";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { Head, Nav } from "../../../components";
import { PhysicalEntity } from "../../../types/collection-api";
import { CataloguedObjectFormLayout } from "./edit";

export default function PhysicalEntityViewPage() {
  const router = useRouter();
  const { formatMessage } = useDinaIntl();

  const { id } = router.query;

  const physicalEntityQuery = useQuery<PhysicalEntity>({
    path: `collection-api/physical-entity/${id}`
  });

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
          <div className="form-group">
            <DinaForm<PhysicalEntity>
              initialValues={physicalEntity}
              readOnly={true}
            >
              <CataloguedObjectFormLayout />
            </DinaForm>
          </div>
          {buttonBar}
        </main>
      ))}
    </div>
  );
}
