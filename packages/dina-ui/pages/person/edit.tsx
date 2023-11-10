import { BackButton, useQuery, withResponse } from "common-ui";
import { useRouter } from "next/router";
import { PersonForm } from "../../components";
import { Person } from "../../types/agent-api/resources/Person";
import PageLayout from "../../components/page/PageLayout";
import ButtonBarLayout from "../../components/page/ButtonBarLayout";

export default function PersonEditPage() {
  const router = useRouter();
  const {
    query: { id }
  } = router;

  const title = id ? "editPersonTitle" : "addPersonTitle";

  async function onSubmitSuccess() {
    await router.push(`/person/list`);
  }

  const buttonBar = (
    <ButtonBarLayout>
      <BackButton
        entityId={id as string}
        entityLink="/person"
        byPassView={true}
      />
    </ButtonBarLayout>
  );

  const query = useQuery<Person>({
    path: `agent-api/person/${id}?include=organizations,identifiers`
  });

  return (
    <PageLayout titleId={title}>
      {buttonBar}
      {id ? (
        withResponse(query, ({ data }) => (
          <PersonForm person={data} onSubmitSuccess={onSubmitSuccess} />
        ))
      ) : (
        <PersonForm onSubmitSuccess={onSubmitSuccess} />
      )}
    </PageLayout>
  );
}
