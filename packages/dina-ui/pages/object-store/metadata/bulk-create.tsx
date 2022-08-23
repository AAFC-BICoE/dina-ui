import {
  ButtonBar,
  BackButton,
  LoadingSpinner,
  useAccount,
  ApiClientContext
} from "common-ui";
import { useLocalStorage } from "@rehooks/local-storage";
import { useRouter } from "next/router";
import { Footer, Head, Nav } from "../../../components";
import { useDinaIntl } from "../../../intl/dina-ui-intl";
import { BULK_ADD_IDS_KEY } from "../upload";
import { Metadata, ObjectUpload } from "../../../types/objectstore-api";
import { InputResource, PersistedResource } from "kitsu";
import { MetadataBulkEditor } from "../../../components/bulk-metadata/MetadataBulkEditor";
import { useState, useEffect, useContext } from "react";
import moment from "moment";

export default function MetadataBulkCreatePage() {
  const router = useRouter();
  const group = router?.query?.group as string;
  const { initialized: accountInitialized, agentId } = useAccount();
  const { formatMessage } = useDinaIntl();
  const [objectUploadIds] = useLocalStorage<string[]>(BULK_ADD_IDS_KEY);
  const { apiClient, bulkGet } = useContext(ApiClientContext);

  if (!objectUploadIds || !accountInitialized) {
    return <LoadingSpinner loading={true} />;
  }
  const [uploadMetadata, setMetadata] = useState<Metadata[]>();
  useEffect(() => {
    loadData().then((value) => {
      setMetadata(value);
    });
  }, []);

  async function loadData() {
    let objectUploads: PersistedResource<ObjectUpload>[] = [];
    if (group && objectUploadIds) {
      objectUploads = await bulkGet<ObjectUpload>(
        objectUploadIds.map((metadataId) => `/object-upload/${metadataId}`),
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

    const newMetadatas = objectUploads.map<Metadata>((objectUpload) => ({
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
    return newMetadatas;
  }

  async function onSaved(
    ids: PersistedResource<Metadata>[],
    isExternalResource?: boolean
  ) {
    if (ids.length === 1) {
      await router.push(
        `/object-store/object/${
          isExternalResource ? "external-resource-view" : "view"
        }?id=${ids[0].id}`
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
          <>{<BackButton entityLink="/object-store/object" />}</>
        </ButtonBar>
        {objectUploadIds ?? (
          <MetadataBulkEditor
            metadatas={uploadMetadata as InputResource<Metadata>[]}
            onSaved={onSaved}
            onPreviousClick={() => router.push("/object-store/object/list")}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}
