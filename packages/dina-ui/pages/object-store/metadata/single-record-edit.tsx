import {
  withResponse,
  ApiClientContext,
  useAccount,
  BackButton,
  ButtonBar,
  SubmitButton
} from "common-ui";
import { useRouter } from "next/router";
import { Footer, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { Metadata, ObjectUpload } from "../../../types/objectstore-api";
import { useMetadataEditQuery } from "../../../components/object-store/metadata/useMetadata";
import { useLocalStorage } from "@rehooks/local-storage";
import { BULK_ADD_IDS_KEY } from "../upload";
import { PersistedResource } from "kitsu";
import moment from "moment";
import { useContext, useState, useEffect } from "react";
import { MetadataForm } from "../../../components/object-store/metadata/MetadataForm";

export default function MetadataEditPage() {
  const router = useRouter();
  const id = router.query.id?.toString();
  const { formatMessage } = useDinaIntl();
  const query = useMetadataEditQuery(id);
  const { apiClient, bulkGet } = useContext(ApiClientContext);
  const { agentId } = useAccount();

  const [objectUploadIds] = useLocalStorage<string[]>(BULK_ADD_IDS_KEY);

  const group = router?.query?.group as string;
  const [uploadMetadata, setMetadata] = useState<Metadata>();
  useEffect(() => {
    loadData().then(value => {
      setMetadata(value);
    });
  }, []);

  async function loadData() {
    let objectUploads: PersistedResource<ObjectUpload>[] = [];
    if (group && objectUploadIds) {
      objectUploads = await bulkGet<ObjectUpload>(
        objectUploadIds.map(metadataId => `/object-upload/${metadataId}`),
        {
          apiBaseUrl: "/objectstore-api"
        }
      );
    }
    // // Set default values for the new Metadatas:
    // const {
    //   data: { values: defaultValues }
    // } = await apiClient.get<{ values: DefaultValue[] }>(
    //   "objectstore-api/config/default-values",
    //   {}
    // );
    // const metadataDefaults: Partial<Metadata> = {
    //   publiclyReleasable: true
    // };
    // for (const defaultValue of defaultValues.filter(
    //   ({ type }) => type === "metadata"
    // )) {
    //   metadataDefaults[defaultValue.attribute as keyof Metadata] =
    //     defaultValue.value as any;
    // }

    const newMetadatas = objectUploads.map<Metadata>(objectUpload => ({
      // ...metadataDefaults,
      acCaption: objectUpload.originalFilename,
      acDigitizationDate: objectUpload.dateTimeDigitized
        ? moment(objectUpload.dateTimeDigitized).format()
        : null,
      acMetadataCreator: agentId
        ? {
            id: agentId,
            type: "person"
          }
        : null,
      bucket: group,
      dcType: objectUpload.dcType,
      fileIdentifier: objectUpload.id,
      originalFilename: objectUpload.originalFilename,
      type: "metadata"
    }));
    return newMetadatas[0];
  }

  const title = id ? "editMetadataTitle" : "addMetadataTitle";
  const buttonBar = (
    <ButtonBar>
      <BackButton entityId={id} entityLink="/object-store/object" />
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
                metadata={editMetadata}
                onSaved={redirectToSingleMetadataPage}
                buttonBar={buttonBar}
              />
            ))}
          </div>
        ) : (
          uploadMetadata && (
            <MetadataForm
              metadata={uploadMetadata}
              onSaved={redirectToSingleMetadataPage}
              buttonBar={buttonBar}
            />
          )
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
