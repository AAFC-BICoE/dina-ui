import { LoadingSpinner, useAccount, BULK_EDIT_IDS_KEY } from "common-ui";
import { useLocalStorage } from "@rehooks/local-storage";
import { useRouter } from "next/router";
import { Footer, Head, Nav } from "../../../components";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { ExistingMetadataBulkEditor } from "../../../components/bulk-metadata/ExistingMetadataBulkEditor";

export default function MetadataBulkEditPage() {
  const router = useRouter();
  const { initialized: accountInitialized } = useAccount();
  const { formatMessage } = useDinaIntl();

  const [ids] = useLocalStorage<string[]>(BULK_EDIT_IDS_KEY);

  if (!ids || !accountInitialized) {
    return <LoadingSpinner loading={true} />;
  }

  async function onSaved(storageUnitIds: string[]) {
    if (storageUnitIds.length === 1) {
      await router.push(`/collection/storage-unit/?id=${storageUnitIds[0]}`);
    } else {
      await router.push("/collection/storage-unit/list");
    }
  }

  const title = ids ? "editMetadataTitle" : "addMetadataTitle";

  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <main className="container-fluid">
        <h1 id="wb-cont">{formatMessage(title)}</h1>
        {ids && (
          <ExistingMetadataBulkEditor
            ids={ids}
            onSaved={onSaved}
            onPreviousClick={() => router.push("/object-store/object/list")}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}
