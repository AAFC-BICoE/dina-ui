import {
  ButtonBar,
  CancelButton,
  DateField,
  DeleteButton,
  DinaForm,
  DinaFormOnSubmit,
  FieldWrapper,
  filterBy,
  NumberField,
  Query,
  ResourceSelect,
  ResourceSelectField,
  SelectField,
  SubmitButton,
  TextField,
  useApiClient,
  withResponse
} from "common-ui";
import { useFormikContext } from "formik";
import { NextRouter, useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Head, Nav } from "../../../components";
import {
  FileView,
  getManagedAttributesInUse
} from "../../../components/object-store";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  License,
  ManagedAttribute,
  Metadata,
  Person
} from "../../../types/objectstore-api";

interface SingleMetadataFormProps {
  /** Existing Metadata is required, no new ones are added with this form. */
  metadata: Metadata;
  router: NextRouter;
}

export default function MetadataEditPage() {
  const router = useRouter();
  const { formatMessage } = useDinaIntl();
  const { apiClient } = useApiClient();

  const {
    query: { id }
  } = router;

  return (
    <div>
      <Head title={formatMessage("editMetadataTitle")} />
      <Nav />
      <main className="container-fluid">
        {id && (
          <div>
            <h1>
              <DinaMessage id="editMetadataTitle" />
            </h1>
            <Query<Metadata>
              query={{
                path: `objectstore-api/metadata/${id}`,
                include: "managedAttributeMap,dcCreator"
              }}
              options={{
                joinSpecs: [
                  // Join to persons api:
                  {
                    apiBaseUrl: "/agent-api",
                    idField: "dcCreator",
                    joinField: "dcCreator",
                    path: metadata => `person/${metadata.dcCreator.id}`
                  }
                ],
                onSuccess: async ({ data: metadata }) => {
                  // Get the License resource based on the Metadata's xmpRightsWebStatement field:
                  if (metadata.xmpRightsWebStatement) {
                    const url = metadata.xmpRightsWebStatement;
                    (metadata as any).license = (
                      await apiClient.get<License[]>(
                        "objectstore-api/license",
                        { filter: { url } }
                      )
                    ).data[0];
                  }
                }
              }}
            >
              {metadataQuery =>
                withResponse(metadataQuery, ({ data }) => (
                  <SingleMetadataForm metadata={data} router={router} />
                ))
              }
            </Query>
          </div>
        )}
      </main>
    </div>
  );
}

function SingleMetadataForm({ router, metadata }: SingleMetadataFormProps) {
  const { formatMessage, locale } = useDinaIntl();
  const { id } = router.query;

  // Convert acTags array to a comma-separated string:
  const initialValues = {
    ...metadata,
    acTags: metadata.acTags?.join(", ") ?? ""
  };

  const onSubmit: DinaFormOnSubmit = async ({
    submittedValues,
    api: { apiClient, save }
  }) => {
    const {
      acTags,
      license,
      managedAttributeMap,
      ...metadataValues
    } = submittedValues;
    delete managedAttributeMap.id;

    if (license) {
      const selectedLicense = license?.id
        ? (
            await apiClient.get<License>(
              `objectstore-api/license/${license.id}`,
              {}
            )
          ).data
        : null;
      // The Metadata's xmpRightsWebStatement field stores the license's url.
      metadataValues.xmpRightsWebStatement = selectedLicense?.url ?? "";
      // No need to store this ; The url should be enough.
      metadataValues.xmpRightsUsageTerms = "";
    }

    const metadataEdit = {
      ...metadataValues,
      acTags: acTags.split(",").map(tag => tag.trim())
    };

    await save(
      [
        {
          resource: metadataEdit,
          type: "metadata"
        },
        {
          resource: { ...managedAttributeMap, metadata },
          type: "managed-attribute-map"
        }
      ],
      { apiBaseUrl: "/objectstore-api" }
    );

    await router.push(`/object-store/object/view?id=${id}`);
  };

  const filePath = `/api/objectstore-api/file/${metadata.bucket}/${metadata.fileIdentifier}`;
  // fileExtension should always be available when getting the Metadata from the back-end:
  const fileType = (metadata.fileExtension as string)
    .replace(/\./, "")
    .toLowerCase();

  return (
    <DinaForm initialValues={initialValues} onSubmit={onSubmit}>
      <ButtonBar>
        <SubmitButton />
        <CancelButton
          entityId={id as string}
          entityLink="/object-store/object"
        />
        <DeleteButton
          className="ml-5"
          id={id as string}
          options={{ apiBaseUrl: "/objectstore-api" }}
          postDeleteRedirect="/object/list"
          type="metadata"
        />
      </ButtonBar>
      <div>
        <div className="form-group">
          <FileView
            clickToDownload={true}
            filePath={filePath}
            fileType={fileType}
            imgHeight="15rem"
          />
        </div>
        <div className="form-group">
          <h2>
            <DinaMessage id="metadataMediaDetailsLabel" />
          </h2>
          <div className="row">
            <TextField
              className="col-md-3 col-sm-4"
              name="originalFilename"
              readOnly={true}
            />
            <DateField
              className="col-md-3 col-sm-4"
              name="acDigitizationDate"
              disabled={true}
            />
          </div>
          <div className="row">
            <SelectField
              className="col-md-3 col-sm-4"
              name="dcType"
              options={DCTYPE_OPTIONS}
            />
            <TextField className="col-md-3 col-sm-4" name="acCaption" />
            <TextField
              className="col-md-3 col-sm-4"
              name="acTags"
              multiLines={true}
              label={formatMessage("metadataBulkEditTagsLabel")}
            />
          </div>
          <div className="row">
            <ResourceSelectField<Person>
              className="col-md-3 col-sm-4"
              name="dcCreator"
              filter={filterBy(["displayName"])}
              model="agent-api/person"
              optionLabel={person => person.displayName}
              label={formatMessage("field_dcCreator.displayName")}
            />
          </div>
        </div>
        <div className="form-group">
          <h2>
            <DinaMessage id="metadataRightsDetailsLabel" />
          </h2>
          <div className="row">
            <TextField className="col-md-3 col-sm-4" name="dcRights" />
            <ResourceSelectField<License>
              className="col-md-3 col-sm-4"
              name="license"
              filter={() => ({})}
              model="objectstore-api/license"
              optionLabel={license => license.titles[locale] ?? license.url}
            />
          </div>
        </div>
        <ManagedAttributesEditor />
      </div>
    </DinaForm>
  );
}

function ManagedAttributesEditor() {
  const { values: metadata } = useFormikContext<Metadata>();
  const { bulkGet } = useApiClient();
  const { formatMessage } = useDinaIntl();

  const [editableManagedAttributes, setEditableManagedAttributes] = useState<
    ManagedAttribute[]
  >([]);

  useEffect(() => {
    (async () => {
      const initialAttributes = await getManagedAttributesInUse(
        [metadata],
        bulkGet
      );
      setEditableManagedAttributes(initialAttributes);
    })();
  }, []);

  return (
    <div className="form-group managed-attributes-editor">
      <h2>
        <DinaMessage id="metadataManagedAttributesLabel" />
      </h2>
      <div className="row">
        <div className="col-md-3 col-sm-4">
          <FieldWrapper
            name="editableManagedAttributes"
            label={formatMessage("field_editableManagedAttributes")}
          >
            <ResourceSelect<ManagedAttribute>
              filter={filterBy(["name"])}
              model="objectstore-api/managed-attribute"
              optionLabel={attribute => attribute.name}
              isMulti={true}
              onChange={ma =>
                setEditableManagedAttributes(ma as ManagedAttribute[])
              }
              value={editableManagedAttributes}
            />
          </FieldWrapper>
        </div>
        <div className="col-md-3 col-sm-4">
          <div className="alert alert-warning">
            <DinaMessage id="editableManagedAttributesRemoveInfo" />
          </div>
        </div>
      </div>
      <div className="row" style={{ minHeight: "25rem" }}>
        {editableManagedAttributes.map(attribute => {
          const props = {
            className: "col-md-3 col-sm-4",
            key: attribute.id,
            label: attribute.name,
            name: `managedAttributeMap.values.${attribute.id}.value`
          };

          if (attribute.managedAttributeType === "STRING") {
            if (attribute.acceptedValues) {
              return (
                <SelectField
                  {...props}
                  options={[
                    { label: `<${formatMessage("none")}>`, value: "" },
                    ...attribute.acceptedValues.map(value => ({
                      label: value,
                      value
                    }))
                  ]}
                />
              );
            }
            return (
              <TextField
                {...props}
                inputProps={{ type: "search" }} // Adds the 'X' clear button in the text input.
              />
            );
          } else if (attribute.managedAttributeType === "INTEGER") {
            return <NumberField {...props} />;
          } else {
            return null;
          }
        })}
      </div>
    </div>
  );
}

const DCTYPE_OPTIONS = [
  { label: "Image", value: "IMAGE" },
  { label: "Moving Image", value: "MOVING_IMAGE" },
  { label: "Sound", value: "SOUND" },
  { label: "Text", value: "TEXT" },
  { label: "Dataset", value: "DATASET" },
  { label: "Undetermined", value: "UNDETERMINED" }
];
