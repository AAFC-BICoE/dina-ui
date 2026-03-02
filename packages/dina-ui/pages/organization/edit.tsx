import { useQuery, withResponse } from "common-ui";
import { useRouter } from "next/router";
import PageLayout from "../../components/page/PageLayout";
import { Organization } from "../../types/agent-api/resources/Organization";
import { OrganizationForm } from "../../components/organization/OrganizationForm";

export type languageCode = "EN" | "FR";

export default function OrganizationEditPage() {
  const router = useRouter();
  const {
    query: { id }
  } = router;
  const title = id ? "editOrganizationTitle" : "addOrganizationTitle";

  const query = useQuery<Organization>({
    path: `agent-api/organization/${id}`
  });

  return (
    <PageLayout titleId={title}>
      {id ? (
        withResponse(query, ({ data }) => (
          <OrganizationForm organization={data} router={router} />
        ))
      ) : (
        <OrganizationForm router={router} />
      )}
    </PageLayout>
  );
}
