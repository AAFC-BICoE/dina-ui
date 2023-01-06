import { LoadingSpinner, useAccount, BULK_EDIT_IDS_KEY } from "common-ui";
import { useLocalStorage } from "@rehooks/local-storage";
import { useRouter } from "next/router";
import { Footer, Head, Nav } from "../../../components";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { BULK_ADD_IDS_KEY } from "../upload";
import { ExistingMetadataBulkEditor } from "../../../components/bulk-metadata/ExistingMetadataBulkEditor";
import { UploadingMetadataBulkEditor } from "../../../components/bulk-metadata/UploadingMetadataBulkEditor";

export default function MetadataBulkEditPage() {
  const router = useRouter();
  const { initialized: accountInitialized, agentId } = useAccount();
  const { formatMessage } = useDinaIntl();

  const [metadataIds] = useLocalStorage<string[]>(BULK_EDIT_IDS_KEY);
  const [objectUploadIds] = useLocalStorage<string[]>(BULK_ADD_IDS_KEY);

  if ((!metadataIds && !objectUploadIds) || !accountInitialized) {
    return <LoadingSpinner loading={true} />;
  }

  async function onSaved(ids: string[], isExternalResource?: boolean) {
    if (ids.length === 1) {
      await router.push(
        `/object-store/object/${
          isExternalResource ? "external-resource-view" : "view"
        }?id=${ids[0]}`
      );
    } else {
      await router.push("/object-store/object/list?reloadLastSearch");
    }
  }

  const title = metadataIds ? "editMetadataTitle" : "addMetadataTitle";

  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <main className="container-fluid">
        <h1 id="wb-cont">{formatMessage(title)}</h1>
        {metadataIds ? (
          <ExistingMetadataBulkEditor
            ids={metadataIds}
            onSaved={onSaved}
            onPreviousClick={() => router.push("/object-store/object/list")}
          />
        ) : (
          objectUploadIds && (
            <UploadingMetadataBulkEditor
              objectUploadIds={objectUploadIds}
              onSaved={onSaved}
              onPreviousClick={() => router.push("/object-store/object/list")}
            />
          )
        )}
      </main>
      <Footer />
    </div>
  );
}
