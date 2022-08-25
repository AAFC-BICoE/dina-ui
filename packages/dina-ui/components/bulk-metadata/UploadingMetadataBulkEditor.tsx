import { ApiClientContext, useAccount } from "common-ui";
import { useRouter } from "next/router";
import { InputResource, PersistedResource } from "kitsu";
import { useState, useEffect, useContext } from "react";
import moment from "moment";
import {
  DefaultValue,
  Metadata,
  ObjectUpload
} from "../../types/objectstore-api";
import { Nav, Footer } from "../button-bar/nav/nav";
import { MetadataBulkEditor } from "./MetadataBulkEditor";
import { Promisable } from "type-fest";

export interface UploadingMetadataBulkEditorProps {
  objectUploadIds: string[];
  onSaved: (
    metadatas: PersistedResource<Metadata>[],
    isExternalResource?: boolean
  ) => Promisable<void>;
  onPreviousClick?: () => void;
}

export function UploadingMetadataBulkEditor({
  objectUploadIds,
  onSaved,
  onPreviousClick
}: UploadingMetadataBulkEditorProps) {
  const router = useRouter();
  const group = router?.query?.group as string;
  const { agentId } = useAccount();
  const { bulkGet, apiClient } = useContext(ApiClientContext);

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
    // Set default values for the new Metadatas:
    const {
      data: { values: defaultValues }
    } = await apiClient.get<{ values: DefaultValue[] }>(
      "objectstore-api/config/default-values",
      {}
    );
    const metadataDefaults: Partial<Metadata> = {
      publiclyReleasable: true
    };
    for (const defaultValue of defaultValues.filter(
      ({ type }) => type === "metadata"
    )) {
      metadataDefaults[defaultValue.attribute as keyof Metadata] =
        defaultValue.value as any;
    }
    const newMetadatas = objectUploads.map<Metadata>((objectUpload) => ({
      ...metadataDefaults,
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

  return (
    <div>
      <main className="container-fluid">
        {uploadMetadata && (
          <MetadataBulkEditor
            metadatas={uploadMetadata as InputResource<Metadata>[]}
            onSaved={onSaved}
            onPreviousClick={onPreviousClick}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}
