import { LoadingSpinner, useAccount, BULK_EDIT_IDS_KEY } from "common-ui";
import { useLocalStorage } from "@rehooks/local-storage";
import { useRouter } from "next/router";
import { Footer, Head, Nav } from "../../../components";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { ExistingStorageUnitBulkEditor } from "../../../components/storage/ExistingStorageUnitBulkEditor";

export default function MetadataBulkEditPage() {
  const router = useRouter();
  const { initialized: accountInitialized } = useAccount();
  const { formatMessage } = useDinaIntl();

  const [ids] = useLocalStorage<string[]>(BULK_EDIT_IDS_KEY);

  if (!ids || !accountInitialized) {
    return <LoadingSpinner loading={true} />;
  }

  async function onSaved() {
    await router.push("/collection/storage-unit/list");
  }

  const title = "editStorageUnitTitle";

  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <main className="container-fluid">
        <h1 id="wb-cont">{formatMessage(title)}</h1>
        {ids && (
          <ExistingStorageUnitBulkEditor
            ids={ids}
            onSaved={onSaved}
            onPreviousClick={() => router.push("/collection/storage-unit/list")}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}
