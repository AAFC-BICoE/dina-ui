import { withResponse, BackButton, ButtonBar, SubmitButton } from "common-ui";
import { useRouter } from "next/router";
import { Footer, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { Metadata } from "../../../types/objectstore-api";
import { useMetadataEditQuery } from "../../../components/object-store/metadata/useMetadata";
import { InputResource } from "kitsu";
import { MetadataForm } from "../../../components/object-store/metadata/MetadataForm";
import { MetadataUpload } from "../../../components/object-store/metadata/MetadataUpload";

export interface MetadataEditPageProps {
  reloadLastSearch?: boolean;
}

export default function MetadataEditPage({
  reloadLastSearch
}: MetadataEditPageProps) {
  const router = useRouter();
  const id = router.query.id?.toString();
  const { formatMessage } = useDinaIntl();
  const query = useMetadataEditQuery(id);
  const title = id ? "editMetadataTitle" : "addMetadataTitle";
  const buttonBar = (
    <ButtonBar>
      <BackButton
        entityId={id}
        entityLink="/object-store/object"
        reloadLastSearch={reloadLastSearch ?? true}
      />
      <SubmitButton className="ms-auto" />
    </ButtonBar>
  );

  async function redirectToSingleMetadataPage(metadataId: string) {
    await router?.push(`/object-store/object/view?id=${metadataId}`);
  }
  return (
    <div>
      <Head title={formatMessage(title)} />
      <Nav />
      <main className="container">
        <h1 id="wb-cont">
          <DinaMessage id={title} />
        </h1>
        {id ? (
          <div>
            {withResponse(query, ({ data: editMetadata }) => (
              <MetadataForm
                metadata={editMetadata as InputResource<Metadata>}
                onSaved={redirectToSingleMetadataPage}
                buttonBar={buttonBar}
              />
            ))}
          </div>
        ) : (
          <MetadataUpload buttonBar={buttonBar} />
        )}
      </main>
      <Footer />
    </div>
  );
}

export const DCTYPE_OPTIONS = [
  { label: "Image", value: "IMAGE" },
  { label: "Moving Image", value: "MOVING_IMAGE" },
  { label: "Sound", value: "SOUND" },
  { label: "Text", value: "TEXT" },
  { label: "Dataset", value: "DATASET" },
  { label: "Undetermined", value: "UNDETERMINED" }
];

export const ORIENTATION_OPTIONS = [
  { label: "1 - Normal", value: 1 },
  { label: "3 - Rotated 180 degrees", value: 3 },
  { label: "6 - Rotated 90 degrees CW", value: 6 },
  { label: "8 - Rotated 90 degrees CCW", value: 8 },
  { label: "2 - Flipped", value: 2 },
  { label: "4 - Rotated 180 degrees + Flipped", value: 4 },
  { label: "5 - Rotated 90 degrees CW + Flipped", value: 5 },
  { label: "7 - Rotated 90 degrees CCW + Flipped", value: 7 },
  { label: "Undetermined", value: null }
];
