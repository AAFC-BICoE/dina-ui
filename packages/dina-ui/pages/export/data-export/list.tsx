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

  return (
    <PageLayout
      titleId="dataExports"
      buttonBarContent={<BackButton entityLink={entityLink} />}
    >
      <DataExportListPageLayout username={username} />
    </PageLayout>
  );
}
