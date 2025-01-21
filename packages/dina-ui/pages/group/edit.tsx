import { useQuery, withResponse } from "common-ui";
import { useRouter } from "next/router";
import { GroupForm } from "../../../dina-ui/components/group/GroupForm";
import { Group } from "../../../dina-ui/types/user-api";
import PageLayout from "../../components/page/PageLayout";

export default function PersonEditPage() {
  const router = useRouter();

  const {
    query: { id }
  } = router;

  const title = id ? "editGroupTitle" : "addGroupTitle";

  const query = useQuery<Group>({
    path: `user-api/group/${id}`
  });

  return (
    <PageLayout titleId={title}>
      {id ? (
        withResponse(query, ({ data }) => (
          <GroupForm group={data} router={router} />
        ))
      ) : (
        <GroupForm router={router} />
      )}
    </PageLayout>
  );
}
