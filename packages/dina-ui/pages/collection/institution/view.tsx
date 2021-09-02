import {
  BackButton,
  ButtonBar,
  DeleteButton,
  DinaForm,
  EditButton,
  useQuery,
  withResponse
} from "common-ui";
import { WithRouterProps } from "next/dist/client/with-router";
import { withRouter } from "next/router";
import { Head, Nav } from "../../../components";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { Institution } from "../../../types/collection-api";
import { InstitutionFormLayout } from "./edit";
import { fromPairs } from "lodash";

export function InstitutionDetailsPage({ router }: WithRouterProps) {
  const id = String(router.query.id);
  const { formatMessage } = useDinaIntl();

  const institutionQuery = useQuery<Institution>({
    path: `collection-api/institution/${id}`
  });

  return (
    <div>
      <Head title={formatMessage("institution")} />
      <Nav />
      <main className="container">
        <ButtonBar>
          <BackButton
            entityId={id}
            entityLink="/collection/institution"
            byPassView={true}
          />
          <EditButton
            className="ms-auto"
            entityId={id}
            entityLink="collection/institution"
          />
          <DeleteButton
            className="ms-5"
            id={id}
            options={{ apiBaseUrl: "/collection-api" }}
            postDeleteRedirect="/collection/institution/list"
            type="institution"
          />
        </ButtonBar>
        {withResponse(institutionQuery, ({ data: institution }) => (
          <DinaForm<Institution>
            initialValues={{
              ...institution,
              // Convert multilingualDescription to editable Dictionary format:
              multilingualDescription: fromPairs<string | undefined>(
                institution.multilingualDescription?.descriptions?.map(
                  ({ desc, lang }) => [lang ?? "", desc ?? ""]
                )
              )
            }}
            readOnly={true}
          >
            <InstitutionFormLayout />
          </DinaForm>
        ))}
      </main>
    </div>
  );
}

export default withRouter(InstitutionDetailsPage);
