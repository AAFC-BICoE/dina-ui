import {
  ButtonBar,
  BackButton,
  LoadingSpinner,
  useAccount,
  BULK_EDIT_IDS_KEY
} from "common-ui";
import { useLocalStorage } from "@rehooks/local-storage";
import { useRouter } from "next/router";
import { Footer, Head, Nav } from "../../../components";
import { BulkMetadataEditor } from "../../../components/object-store";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { BULK_ADD_IDS_KEY } from "../upload";

export default function EditMetadatasPage() {
  const router = useRouter();
  const { initialized: accountInitialized } = useAccount();
  const { formatMessage } = useDinaIntl();

  const [metadataIds] = useLocalStorage<string[]>(BULK_EDIT_IDS_KEY);
  const [objectUploadIds] = useLocalStorage<string[]>(BULK_ADD_IDS_KEY);
  localStorage.removeItem(BULK_EDIT_IDS_KEY);
  localStorage.removeItem(BULK_ADD_IDS_KEY);

  if ((!metadataIds && !objectUploadIds) || !accountInitialized) {
    return <LoadingSpinner loading={true} />;
  }

  async function afterMetadatasSaved(
    ids: string[],
    isExternalResource?: boolean
  ) {
    if (ids.length === 1) {
      await router.push(
        `/object-store/object/${
          isExternalResource ? "external-resource-view" : "view"
        }?id=${ids[0]}`
      );
    } else {
      await router.push("/object-store/object/list");
    }
  }

  return (
    <div>
      <Head title={formatMessage("metadataBulkEditTitle")} />
      <Nav />
      <main className="container-fluid">
        <ButtonBar>
          <>
            {metadataIds?.length === 1 ? (
              <BackButton
                entityLink="/object-store/object"
                entityId={metadataIds[0]}
                byPassView={false}
              />
            ) : (
              <BackButton entityLink="/object-store/object" />
            )}
          </>
        </ButtonBar>
        <BulkMetadataEditor
          metadataIds={metadataIds ?? []}
          objectUploadIds={objectUploadIds ?? []}
          group={router?.query?.group as string}
          defaultValuesConfig={
            typeof router?.query?.defaultValuesConfig === "string"
              ? Number(router?.query?.defaultValuesConfig)
              : undefined
          }
          afterMetadatasSaved={afterMetadatasSaved}
        />
      </main>
      <Footer />
    </div>
  );
}
