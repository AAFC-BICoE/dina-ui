import {
  BackButton,
  ButtonBar,
  DateField,
  DinaForm,
  DinaFormOnSubmit,
  FieldSet,
  ResourceSelectField,
  SelectField,
  SubmitButton,
  TextField,
  withResponse,
  ApiClientContext,
  useAccount,
  safeSubmit,
  LoadingSpinner
} from "common-ui";
import { Field } from "formik";
import { keys } from "lodash";
import { NextRouter, useRouter } from "next/router";
import {
  Footer,
  Head,
  Nav,
  NotPubliclyReleasableWarning,
  PersonSelectField,
  TagsAndRestrictionsSection
} from "../../../components";
import { ManagedAttributesEditor } from "../../../components/object-store/managed-attributes/ManagedAttributesEditor";
import { MetadataFileView } from "../../../components/object-store/metadata/MetadataFileView";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  DefaultValue,
  License,
  Metadata,
  ObjectSubtype,
  ObjectUpload
} from "../../../types/objectstore-api";
import {
  useMetadataEditQuery,
  useMetadataSave
} from "../../../components/object-store/metadata/useMetadata";
import { useLocalStorage } from "@rehooks/local-storage";
import { BULK_ADD_IDS_KEY } from "../upload";
import { PersistedResource } from "kitsu";
import moment from "moment";
import { useContext, useState, useEffect } from "react";

interface SingleMetadataFormProps {
  metadata: Metadata;
  router: NextRouter;
}

export default function MetadataEditPage() {
  const router = useRouter();
  const id = router.query.id?.toString();
  const { formatMessage } = useDinaIntl();
  const query = useMetadataEditQuery(id);
  const { apiClient, bulkGet, save } = useContext(ApiClientContext);
  const { agentId, initialized: accountInitialized } = useAccount();

  const [objectUploadIds] = useLocalStorage<string[]>(BULK_ADD_IDS_KEY);

  const group = router?.query?.group as string;
  const [metadata, setMetadata] = useState<Metadata>();
  useEffect(() => {
    loadData().then(value => {
      setMetadata(value);
    });
  }, []);

  async function loadData() {
    let objectUploads: PersistedResource<ObjectUpload>[] = [];
    if (group && objectUploadIds) {
      objectUploads = await bulkGet<ObjectUpload>(
        objectUploadIds.map(uuid => `/object-upload/${uuid}`),
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

    const newMetadatas = objectUploads.map<Metadata>(objectUpload => ({
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
    return newMetadatas[0];
  }

  return (
    <div>
      <Head title={formatMessage("editMetadataTitle")} />
      <Nav />
      <main className="container">
        <h1 id="wb-cont">
          <DinaMessage id="editMetadataTitle" />
        </h1>
        {id ? (
          <div>
            {withResponse(query, ({ data }) => (
              <SingleMetadataForm metadata={data} router={router} />
            ))}
          </div>
        ) : (
          metadata && <SingleMetadataForm metadata={metadata} router={router} />
        )}
      </main>
      <Footer />
    </div>
  );
}

function SingleMetadataForm({ router, metadata }: SingleMetadataFormProps) {
  const { formatMessage, locale } = useDinaIntl();
  const { id } = router.query;

  const initialValues = {
    ...metadata,
    // Convert the string to an object for the dropdown:
    acSubtype: metadata.acSubtype
      ? {
          id: "id-unavailable",
          type: "object-subtype",
          acSubtype: metadata.acSubtype
        }
      : undefined
  };
  const metadataSaveHook = useMetadataSave(initialValues);
  const { onSubmit } = metadataSaveHook;
  const singleEditOnSubmit = async submittedValues => {
    const submittedMetadata = await onSubmit(submittedValues);
    await router?.push(
      `/object-store/object/view?id=${submittedMetadata[0].id}`
    );
  };

  const buttonBar = (
    <ButtonBar>
      <BackButton entityId={id as string} entityLink="/object-store/object" />
      <SubmitButton className="ms-auto" />
    </ButtonBar>
  );

  return (
    <DinaForm initialValues={initialValues} onSubmit={singleEditOnSubmit}>
      <NotPubliclyReleasableWarning />
      {buttonBar}
      <div className="mb-3">
        {metadata.derivatives && (
          <MetadataFileView metadata={metadata} imgHeight="15rem" />
        )}
      </div>
      <TagsAndRestrictionsSection
        resourcePath="objectstore-api/metadata"
        tagsFieldName="acTags"
        groupSelectorName="bucket"
      />
      <FieldSet legend={<DinaMessage id="metadataMediaDetailsLabel" />}>
        <div className="row">
          <TextField
            className="col-md-6"
            name="originalFilename"
            readOnly={true}
          />
          <DateField
            className="col-md-6"
            name="acDigitizationDate"
            showTime={true}
          />
        </div>
        <div className="row">
          <SelectField
            className="col-md-6"
            name="dcType"
            options={DCTYPE_OPTIONS}
          />
          <Field name="dcType">
            {({ field: { value: dcType } }) => (
              <ResourceSelectField<ObjectSubtype>
                name="acSubtype"
                className="col-md-6"
                filter={input => ({
                  rsql:
                    `acSubtype=='${input}*'` +
                    (dcType ? ` and dcType==${dcType}` : "")
                })}
                model="objectstore-api/object-subtype"
                optionLabel={ost => ost.acSubtype}
              />
            )}
          </Field>
        </div>
        <div className="row">
          <TextField className="col-md-6" name="acCaption" />
        </div>
        <div className="row">
          <PersonSelectField
            className="col-md-6"
            name="dcCreator"
            label={formatMessage("field_dcCreator.displayName")}
          />
          <SelectField
            className="col-md-6"
            name="orientation"
            options={ORIENTATION_OPTIONS}
            tooltipImage="/static/images/orientationDiagram.jpg"
            tooltipImageAlt="field_orientation_tooltipAlt"
          />
        </div>
      </FieldSet>
      <FieldSet legend={<DinaMessage id="metadataRightsDetailsLabel" />}>
        <div className="row">
          <TextField className="col-sm-6" name="dcRights" />
          <ResourceSelectField<License>
            className="col-sm-6"
            name="license"
            filter={() => ({})}
            model="objectstore-api/license"
            optionLabel={license => license.titles[locale] ?? license.url}
            removeDefaultSort={true}
          />
        </div>
      </FieldSet>
      <ManagedAttributesEditor
        valuesPath="managedAttributes"
        values={metadata.managedAttributes}
        managedAttributeApiPath="objectstore-api/managed-attribute"
        fieldSetProps={{
          legend: <DinaMessage id="managedAttributes" />
        }}
      />
      {buttonBar}
    </DinaForm>
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
