import { ButtonBar, BackButton, LoadingSpinner, Query } from "common-ui";
import { useRouter } from "next/router";
import { Footer, Head, Nav, PersonForm } from "../../components";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { Person } from "../../types/agent-api/resources/Person";

export default function PersonEditPage() {
  const router = useRouter();
  const {
    query: { id }
  } = router;

  const { formatMessage } = useDinaIntl();
  const title = id ? "editPersonTitle" : "addPersonTitle"

  async function onSubmitSuccess() {
    await router.push(`/person/list`);
  }

  const buttonBar = (
    <ButtonBar>
      <BackButton
        entityId={id as string}
        entityLink="/person"
        byPassView={true}
      />
    </ButtonBar>
  );

  return (
    <div>
      <Head title={formatMessage(title)}
						lang={formatMessage("languageOfPage")} 
						creator={formatMessage("agricultureCanada")}
						subject={formatMessage("subjectTermsForPage")} />
			<Nav />
      <main className="container-fluid">
        {buttonBar}
        {id ? (
          <div>
            <h1 id="wb-cont">
              <DinaMessage id="editPersonTitle" />
            </h1>
            <Query<Person>
              query={{ path: `agent-api/person/${id}?include=organizations` }}
            >
              {({ loading, response }) => (
                <div>
                  <LoadingSpinner loading={loading} />
                  {response && (
                    <PersonForm
                      person={response.data}
                      onSubmitSuccess={onSubmitSuccess}
                    />
                  )}
                </div>
              )}
            </Query>
          </div>
        ) : (
          <div>
            <h1 id="wb-cont">
              <DinaMessage id="addPersonTitle" />
            </h1>
            <PersonForm onSubmitSuccess={onSubmitSuccess} />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
