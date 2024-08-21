import { BackButton, EditButton, useQuery, withResponse } from "common-ui";
import { useRouter } from "next/router";
import { SplitConfiguration } from "../../../types/collection-api/resources/SplitConfiguration";
import PageLayout from "../../../components/page/PageLayout";
import { SplitConfigurationForm } from "./edit";

export default function DinaUserDetailsPage() {
  const router = useRouter();

  // Get the user ID from the URL, otherwise use the current user:
  const id = router.query.id?.toString();

  const splitConfigurationQuery = useQuery<SplitConfiguration>({
    path: `collection-api/split-configuration/${id}`
  });

  const buttonBar = (
    <>
      <div className="col-md-6 col-sm-12 mt-2">
        <BackButton
          entityLink="/collection/split-configuration"
          className="mt-2"
        />
      </div>
      <div className="col-md-6 col-sm-12 d-flex">
        <EditButton
          className="ms-auto"
          entityId={id as string}
          entityLink="collection/split-configuration"
        />
      </div>
    </>
  );

  return (
    <PageLayout titleId="SplitConfiguration" buttonBarContent={buttonBar}>
      {withResponse(splitConfigurationQuery, ({ data: splitConfiguration }) => (
        <SplitConfigurationForm
          readOnlyMode={true}
          titleId={"SplitConfiguration"}
          router={router}
          splitConfiguration={splitConfiguration}
        />
      ))}
    </PageLayout>
  );
}
