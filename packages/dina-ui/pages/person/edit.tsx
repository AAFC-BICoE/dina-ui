import { LoadingSpinner, Query, ButtonBar, CancelButton } from "common-ui";
import { useRouter } from "next/router";
import { Person } from "types/objectstore-api/resources/Person";
import { Head, Nav, PersonForm } from "../../components";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";

export default function PersonEditPage() {
  const router = useRouter();
  const {
    query: { id }
  } = router;

  const { formatMessage } = useDinaIntl();

  async function onSubmitSuccess() {
    await router.push(`/person/list`);
  }

  return (
    <div>
      <Head title={formatMessage("editPersonTitle")} />
      <Nav />
      <ButtonBar>
        <CancelButton
          entityId={id as string}
          entityLink="/person"
          byPassView={true}
        />
      </ButtonBar>
      <div className="container-fluid">
        {id ? (
          <div>
            <h1>
              <DinaMessage id="editPersonTitle" />
            </h1>
            <Query<Person> query={{ path: `agent-api/person/${id}` }}>
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
            <h1>
              <DinaMessage id="addPersonTitle" />
            </h1>
            <PersonForm onSubmitSuccess={onSubmitSuccess} />
          </div>
        )}
      </div>
    </div>
  );
}
