import { useQuery, withResponse } from "common-ui";
import { useRouter } from "next/router";
import { PersonForm } from "../../components";
import { Person, personParser } from "../../types/agent-api/resources/Person";
import PageLayout from "../../components/page/PageLayout";

export default function PersonEditPage() {
  const router = useRouter();
  const {
    query: { id }
  } = router;

  const title = id ? "editPersonTitle" : "addPersonTitle";

  async function onSubmitSuccess() {
    await router.push(`/person/list`);
  }

  const query = useQuery<Person>(
    {
      path: `agent-api/person/${id}?include=organizations,identifiers`
    },
    {
      parser: personParser,
      disabled: !id
    }
  );

  return (
    <PageLayout titleId={title}>
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
