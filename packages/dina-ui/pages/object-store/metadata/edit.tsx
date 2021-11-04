import { ButtonBar, BackButton, LoadingSpinner, useAccount } from "common-ui";
import { useRouter } from "next/router";
import { Footer, Head, Nav } from "../../../components";
import { BulkMetadataEditor } from "../../../components/object-store";
import { useDinaIntl } from "../../../intl/dina-ui-intl";

export default function EditMetadatasPage() {
  const router = useRouter();
  const { initialized: accountInitialized } = useAccount();
  const { formatMessage } = useDinaIntl();

  const metadataIds = router.query.metadataIds?.toString().split(",");
  const objectUploadIds = router.query.objectUploadIds?.toString().split(",");

  if ((!metadataIds && !objectUploadIds) || !accountInitialized) {
    return <LoadingSpinner loading={true} />;
  }

  async function afterMetadatasSaved(ids: string[]) {
    if (ids.length === 1) {
      await router.push(`/object-store/object/view?id=${ids[0]}`);
    } else {
      await router.push("/object-store/object/list");
    }
  }

  return (
    <div>
      <Head
        title={formatMessage("metadataBulkEditTitle")}
        lang={formatMessage("languageOfPage")}
        creator={formatMessage("agricultureCanada")}
        subject={formatMessage("subjectTermsForPage")}
      />
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
          metadataIds={metadataIds}
          objectUploadIds={objectUploadIds}
          group={router.query.group as string}
          defaultValuesConfig={
            typeof router.query.defaultValuesConfig === "string"
              ? Number(router.query.defaultValuesConfig)
              : undefined
          }
          afterMetadatasSaved={afterMetadatasSaved}
        />
      </main>
      <Footer />
    </div>
  );
}
