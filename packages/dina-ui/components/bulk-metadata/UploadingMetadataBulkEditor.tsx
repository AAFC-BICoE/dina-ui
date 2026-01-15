import { ApiClientContext, useAccount } from "common-ui";
import { useRouter } from "next/router";
import { InputResource, PersistedResource } from "kitsu";
import { useState, useEffect, useContext, forwardRef } from "react";
import moment from "moment";
import {
  DefaultValue,
  License,
  Metadata,
  ObjectUpload
} from "../../types/objectstore-api";
import {
  MetadataBulkEditor,
  MetadataBulkEditorHandle
} from "./MetadataBulkEditor";

export interface UploadingMetadataBulkEditorProps {
  objectUploadIds: string[];
  onSaved: (metadataIds: string[]) => void | Promise<void>;
  onPreviousClick?: () => void;
  inputGroup?: string;
  insideModal?: boolean;
}

export const UploadingMetadataBulkEditor = forwardRef<
  MetadataBulkEditorHandle,
  UploadingMetadataBulkEditorProps
>(
  (
    {
      objectUploadIds,
      onSaved,
      onPreviousClick,
      inputGroup,
      insideModal = false
    },
    ref
  ) => {
    const router = useRouter();
    const group = inputGroup ? inputGroup : (router?.query?.group as string);
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
          objectUploadIds.map((metadataId) => `object-upload/${metadataId}`),
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
      const metadataDefaults: Partial<Metadata> = {};

      for (const defaultValue of defaultValues?.filter(
        ({ type }) => type === "metadata"
      )) {
        metadataDefaults[defaultValue.attribute as keyof Metadata] =
          defaultValue.value as any;
      }

      const selectedLicense = await apiClient.get<License>(
        `objectstore-api/license?filter[url]=${metadataDefaults.xmpRightsWebStatement}`,
        {}
      );

      metadataDefaults.license = selectedLicense?.data;

      const newMetadatas = objectUploads?.map<Metadata>((objectUpload) => ({
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
          : undefined,
        bucket: group,
        dcType: objectUpload.dcType,
        fileIdentifier: objectUpload.id,
        originalFilename: objectUpload.originalFilename,
        type: "metadata"
      }));
      return newMetadatas;
    }

    // Define the content once to prevent duplication
    const editorContent = uploadMetadata && (
      <MetadataBulkEditor
        ref={ref}
        metadatas={uploadMetadata as InputResource<Metadata>[]}
        onSaved={onSaved}
        onPreviousClick={onPreviousClick}
        insideModal={insideModal}
      />
    );

    return (
      <>
        {insideModal ? (
          editorContent
        ) : (
          <main className="container-fluid">{editorContent}</main>
        )}
      </>
    );
  }
);
