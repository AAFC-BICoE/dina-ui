import {
  BackToListButton,
  ButtonBar,
  DateField,
  DinaForm,
  DinaFormOnSubmit,
  FieldSet,
  ResourceSelectField,
  SelectField,
  SubmitButton,
  TextField,
  useAccount,
  useApiClient,
  useQuery,
  withResponse,
  SimpleSearchFilterBuilder,
  resourceDifference
} from "common-ui";
import { NextRouter, useRouter } from "next/router";
import { Field } from "formik";
import {
  Footer,
  Head,
  Nav,
  NotPubliclyReleasableWarning,
  PersonSelectField,
  TagsAndRestrictionsSection,
  NotPubliclyReleasableSection
} from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  License,
  MediaType,
  Metadata,
  ObjectSubtype
} from "../../../types/objectstore-api";
import { DCTYPE_OPTIONS, ORIENTATION_OPTIONS } from "../metadata/edit";
import { MetadataFileView } from "../../../components/object-store/metadata/MetadataFileView";
import { InputResource } from "kitsu";
import _ from "lodash";

export default function ExternalResourceMetadataPage() {
  const { formatMessage } = useDinaIntl();
  const router = useRouter();

  const id = router?.query.id?.toString();

  const { apiClient } = useApiClient();

  const query = useQuery<Metadata>(
    {
      path: `objectstore-api/metadata/${id}?include=dcCreator,derivatives`
    },
    {
      disabled: !id,
      onSuccess: async ({ data: metadata }) => {
        // Get the License resource based on the Metadata's xmpRightsWebStatement field:
        if (metadata.xmpRightsWebStatement) {
          const url = metadata.xmpRightsWebStatement;
          (metadata as any).license = (
            await apiClient.get<License[]>("objectstore-api/license", {
              filter: { url }
            })
          ).data[0];
        }
      }
    }
  );

  return (
    <div>
      <Head title={formatMessage("externalResourceListTitle")} />
      <Nav />
      <main className="container-fluid">
        {id ? (
          <div>
            <h1 id="wb-cont">
              <DinaMessage id="editExternalResourceTitle" />
            </h1>
            {withResponse(query, ({ data }) => (
              <div>
                {data.derivatives && (
                  <MetadataFileView metadata={data} imgHeight="15rem" />
                )}
                <ExternalResourceMetadataForm metadata={data} router={router} />
              </div>
            ))}
          </div>
        ) : (
          <div>
            <h1 id="wb-cont">
              <DinaMessage id="addExternalResourceTitle" />
            </h1>
            <ExternalResourceMetadataForm router={router} />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

interface ExternalResourceMetadataProps {
  /** Existing Metadata is required, no new ones are added with this form. */
  metadata?: Metadata;
  router: NextRouter;
}

function ExternalResourceMetadataForm({
  router,
  metadata
}: ExternalResourceMetadataProps) {
  const { locale, formatMessage } = useDinaIntl();
  const { groupNames } = useAccount();

  const initialValues = metadata
    ? {
        ...metadata,
        // Convert the string to an object for the dropdown:
        acSubtype: metadata?.acSubtype
          ? {
              id: "id-unavailable",
              type: "object-subtype",
              acSubtype: metadata?.acSubtype
            }
          : null,
        dcFormat: metadata?.dcFormat
          ? {
              id: metadata?.dcFormat,
              type: "media-type",
              mediaType: metadata?.dcFormat
            }
          : null
      }
    : {};

  const onSubmit: DinaFormOnSubmit = async ({
    submittedValues,
    api: { apiClient, save }
  }) => {
    const {
      // Don't include derivatives in the form submission:
      derivatives: _derivatives,
      license,
      ...metadataValues
    } = submittedValues;

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
    }

    // Before checking the difference, we need to parse some fields.
    metadataValues.acSubtype =
      (metadataValues as any)?.acSubtype?.acSubtype ?? undefined;
    metadataValues.xmpRightsWebStatement =
      (metadataValues as any)?.license?.url ??
      metadataValues.xmpRightsWebStatement;
    metadataValues.dcFormat = (metadataValues as any)?.dcFormat
      ? metadataValues?.dcFormat?.mediaType
      : undefined;
    metadataValues.bucket = (metadataValues as any).bucket ?? groupNames?.[0];
    delete metadataValues.license;

    // Only submit the changed values to the back-end:
    const metadataDiff: InputResource<Metadata> = metadata?.id
      ? resourceDifference({
          original: metadata,
          updated: metadataValues
        })
      : metadataValues;

    const metadataWithRelationships: InputResource<Metadata> & {
      relationships: any;
    } = {
      ...metadataDiff,
      relationships: {
        // acMetadataCreator should only be saved on create, not edit.
        ...(metadataDiff.acMetadataCreator &&
          !metadataDiff.id && {
            acMetadataCreator: {
              data: metadataDiff.acMetadataCreator?.id
                ? _.pick(metadataDiff.acMetadataCreator, "id", "type")
                : null
            }
          }),
        ...(metadataDiff.dcCreator && {
          dcCreator: {
            data: metadataDiff.dcCreator?.id
              ? _.pick(metadataDiff.dcCreator, "id", "type")
              : null
          }
        })
      }
    };

    // Delete relationships handled above.
    delete metadataWithRelationships.acMetadataCreator;
    delete metadataWithRelationships.dcCreator;

    // If the relationship section is empty, remove it from the query.
    if (Object.keys(metadataWithRelationships.relationships).length === 0) {
      delete metadataWithRelationships.relationships;
    }

    const savedMeta = await save(
      [{ resource: metadataWithRelationships, type: "metadata" }],
      { apiBaseUrl: "/objectstore-api" }
    );

    await router.push(
      `/object-store/object/external-resource-view?id=${savedMeta?.[0].id}`
    );
  };

  const buttonBar = (
    <ButtonBar className="mb-3">
      <div className="col-md-6 col-sm-12">
        <BackToListButton entityLink="/object-store/object" />
      </div>
      <div className="col-md-6 col-sm-12 d-flex">
        <SubmitButton className="ms-auto" />
      </div>
    </ButtonBar>
  );

  return (
    <DinaForm initialValues={initialValues} onSubmit={onSubmit}>
      <NotPubliclyReleasableWarning />
      {buttonBar}
      <NotPubliclyReleasableSection />
      <TagsAndRestrictionsSection
        resourcePath="objectstore-api/metadata"
        tagsFieldName="acTags"
        groupSelectorName="bucket"
        indexName="dina_object_store_index"
      />
      <FieldSet legend={<DinaMessage id="metadataMediaDetailsLabel" />}>
        <div className="row">
          <TextField
            className="col-md-6"
            name="resourceExternalURL"
            label={formatMessage("metadataResourceExternalURLLabel")}
          />
          <ResourceSelectField<MediaType>
            name="dcFormat"
            className="col-md-6"
            filter={(input) => ({
              mediaType: {
                LIKE: `${input}%`
              }
            })}
            model="objectstore-api/media-type"
            optionLabel={(format) => format.mediaType}
            removeDefaultSort={true}
            omitNullOption={true}
          />
          <TextField className="col-md-6" name="acCaption" />
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
                filter={(input) =>
                  SimpleSearchFilterBuilder.create<ObjectSubtype>()
                    .searchFilter("acSubtype", input)
                    // if dcType is set, filter by it as well
                    .when(dcType, (builder) =>
                      builder.where("dcType", "EQ", dcType)
                    )
                    .build()
                }
                model="objectstore-api/object-subtype"
                optionLabel={(ost) => ost.acSubtype}
              />
            )}
          </Field>
        </div>
        <div className="row">
          <TextField
            className="col-md-6"
            name="fileExtension"
            label={formatMessage("metadataFileExtensionLabel")}
          />
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
            optionLabel={(license) => license.titles[locale] ?? license.url}
            removeDefaultSort={true}
          />
        </div>
      </FieldSet>
    </DinaForm>
  );
}
