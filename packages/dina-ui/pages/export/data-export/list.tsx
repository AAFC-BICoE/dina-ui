import {
  useAccount,
  BackButton,
  DataExportListPageLayout
} from "../../../../common-ui/lib";
import PageLayout from "../../../components/page/PageLayout";
import { useRouter } from "next/router";

export default function DataExportListPage() {
  const { username } = useAccount();
  const router = useRouter();
  const entityLink = String(router.query.entityLink);
  const entityId = router.query.entityId?.toString();

  return (
    <PageLayout
      titleId="dataExports"
      buttonBarContent={
        <BackButton entityLink={entityLink} entityId={entityId} />
      }
    >
      <DataExportListPageLayout username={username} />
    </PageLayout>
  );
}
