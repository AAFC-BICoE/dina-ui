import {
  ButtonBar,
  CancelButton,
  DateField,
  DeleteButton,
  ErrorViewer,
  filterBy,
  Query,
  ResourceSelectField,
  safeSubmit,
  SelectField,
  SubmitButton,
  TextField,
  useApiClient,
  withResponse
} from "common-ui";
import { Form, Formik } from "formik";
import { NextRouter, useRouter } from "next/router";
import { Head, Nav } from "../../../components";
import { FileView } from "../../../components/object-store";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { License, Metadata, Person } from "../../../types/objectstore-api";

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
                include: "dcCreator"
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

  const { apiClient, save } = useApiClient();

  const DCTYPE_OPTIONS = [
    { label: "Image", value: "IMAGE" },
    { label: "Moving Image", value: "MOVING_IMAGE" },
    { label: "Sound", value: "SOUND" },
    { label: "Text", value: "TEXT" },
    { label: "Dataset", value: "DATASET" },
    { label: "Undetermined", value: "UNDETERMINED" }
  ];

  const onSubmit = safeSubmit(async submittedValues => {
    const { acTags, license, ...metadataValues } = submittedValues;

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
        }
      ],
      { apiBaseUrl: "/objectstore-api" }
    );

    await router.push(`/object-store/object/view?id=${id}`);
  });

  const filePath = `/api/objectstore-api/file/${metadata.bucket}/${metadata.fileIdentifier}`;
  // fileExtension should always be available when getting the Metadata from the back-end:
  const fileType = (metadata.fileExtension as string)
    .replace(/\./, "")
    .toLowerCase();

  return (
    <Formik initialValues={initialValues} onSubmit={onSubmit}>
      <Form translate={undefined}>
        <ErrorViewer />
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
            />
          </div>
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
      </Form>
    </Formik>
  );
}
