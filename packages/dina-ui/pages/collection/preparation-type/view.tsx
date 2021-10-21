import {
  BackButton,
  ButtonBar,
  DeleteButton,
  DinaForm,
  EditButton,
  useQuery,
  withResponse
} from "common-ui";
import { fromPairs } from "lodash";
import { WithRouterProps } from "next/dist/client/with-router";
import { withRouter } from "next/router";
import { PreparationType } from "packages/dina-ui/types/collection-api/resources/PreparationType";
import { Footer, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { PreparationTypeFormLayout } from "./edit";

export function PreparationTypeDetailsPage({ router }: WithRouterProps) {
  const { id } = router.query;
  const { formatMessage } = useDinaIntl();

  const prepTypeQuery = useQuery<PreparationType>({
    path: `collection-api/preparation-type/${id}`
  });

  return (
    <div>
      <Head title={formatMessage("preparationTypeViewTitle")}
						lang={formatMessage("languageOfPage")} 
						creator={formatMessage("agricultureCanada")}
						subject={formatMessage("subjectTermsForPage")} />
			<Nav />
      <main className="container">
        <h1 id="wb-cont">
          <DinaMessage id="preparationTypeViewTitle" />
        </h1>
        <ButtonBar>
          <BackButton
            entityId={id as string}
            entityLink="/collection/preparation-type"
            byPassView={true}
          />
          <EditButton
            className="ms-auto"
            entityId={id as string}
            entityLink="collection/preparation-type"
          />
          <DeleteButton
            className="ms-5"
            id={id as string}
            options={{ apiBaseUrl: "/collection-api" }}
            postDeleteRedirect="/collection/preparation-type/list"
            type="preparation-type"
          />
        </ButtonBar>
        {withResponse(prepTypeQuery, ({ data: preparationType }) => (
          <DinaForm<PreparationType>
            initialValues={{
              ...preparationType,
              // Convert multilingualDescription to editable Dictionary format:
              multilingualDescription: fromPairs<string | undefined>(
                preparationType.multilingualDescription?.descriptions?.map(
                  ({ desc, lang }) => [lang ?? "", desc ?? ""]
                )
              )
            }}
            readOnly={true}
          >
            <PreparationTypeFormLayout />
          </DinaForm>
        ))}
      </main>
      <Footer />
    </div>
  );
}

export default withRouter(PreparationTypeDetailsPage);
