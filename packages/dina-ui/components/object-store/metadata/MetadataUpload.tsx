import { PersistedResource, InputResource } from "kitsu";
import moment from "moment";
import { ApiClientContext, useAccount } from "../../../../common-ui/lib";
import { BULK_ADD_IDS_KEY } from "../../../pages/object-store/upload";
import {
  Metadata,
  ObjectUpload,
  DefaultValue
} from "../../../types/objectstore-api";
import React from "react";
import { MetadataForm } from "./MetadataForm";
import { useRouter } from "next/router";
import { useContext, useState, useEffect } from "react";
import { useLocalStorage } from "@rehooks/local-storage";

interface MetadataUploadProps {
  buttonBar?: JSX.Element;
}

export function MetadataUpload({ buttonBar }: MetadataUploadProps) {
  const router = useRouter();
  const { apiClient, bulkGet } = useContext(ApiClientContext);
  const { agentId } = useAccount();

  const [objectUploadIds] = useLocalStorage<string[]>(BULK_ADD_IDS_KEY);

  const group = router?.query?.group as string;
  const [uploadMetadata, setMetadata] = useState<Metadata>();
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

    const newMetadatas = objectUploads.map<Metadata>((objectUpload) => ({
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

  async function redirectToSingleMetadataPage(metadataId: string) {
    await router?.push(`/object-store/object/view?id=${metadataId}`);
  }
  return uploadMetadata ? (
    <MetadataForm
      metadata={uploadMetadata as InputResource<Metadata>}
      onSaved={redirectToSingleMetadataPage}
      buttonBar={buttonBar}
    />
  ) : null;
}
