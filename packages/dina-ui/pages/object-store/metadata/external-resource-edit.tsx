import {
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
  withResponse
} from "common-ui";
import { NextRouter, useRouter } from "next/router";
import { Field } from "formik";
import { keys } from "lodash";
import { Footer, Head, Nav } from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  License,
  Metadata,
  ObjectSubtype
} from "../../../types/objectstore-api";
import { DCTYPE_OPTIONS } from "../metadata/single-record-edit";

export default function ExternalResourceMetadataPage() {
  const { formatMessage } = useDinaIntl();
  const router = useRouter();

  const id = router?.query.id?.toString();

  const { apiClient } = useApiClient();

  const query = useQuery<Metadata>(
    {
      path: `objectstore-api/metadata/${id}`
    },
    {
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
      <Head title={formatMessage("inputExternalResourceTitle")} />
      <Nav />
      <main className="container">
        {id ? (
          <div>
            <h1 id="wb-cont">
              <DinaMessage id="inputExternalResourceTitle" />
            </h1>
            {withResponse(query, ({ data }) => (
              <ExternalResourceMetatdataForm metadata={data} router={router} />
            ))}
          </div>
        ) : (
          <div>
            <h1 id="wb-cont">
              <DinaMessage id="inputExternalResourceTitle" />
            </h1>
            <ExternalResourceMetatdataForm router={router} />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

interface ExternalResourceMetatdataProps {
  /** Existing Metadata is required, no new ones are added with this form. */
  metadata?: Metadata;
  router: NextRouter;
}

function ExternalResourceMetatdataForm({
  router,
  metadata
}: ExternalResourceMetatdataProps) {
  const { locale } = useDinaIntl();
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
          : null
      }
    : {};
  const onSubmit: DinaFormOnSubmit = async ({
    submittedValues,
    api: { apiClient, save }
  }) => {
    const {
      // Don't include derivatives in the form submission:
      derivatives,
      license,
      acSubtype,
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
      // No need to store this ; The url should be enough.
      metadataValues.xmpRightsUsageTerms = "";
    }

    const metadataEdit = {
      ...metadataValues,
      // Convert the object back to a string:
      acSubtype: acSubtype?.acSubtype ?? null,
      bucket: metadataValues.bucket ?? groupNames?.[0]
    };

    const savedMeta = await save(
      [
        {
          resource: metadataEdit,
          type: "metadata"
        }
      ],
      { apiBaseUrl: "/objectstore-api" }
    );

    await router.push(
      `/object-store/object/external-resource-view?id=${savedMeta?.[0].id}`
    );
  };

  const buttonBar = (
    <ButtonBar>
      <SubmitButton className="ms-auto" />
    </ButtonBar>
  );

  return (
    <DinaForm initialValues={initialValues} onSubmit={onSubmit}>
      {buttonBar}
      <FieldSet legend={<DinaMessage id="metadataMediaDetailsLabel" />}>
        <div className="row">
          <TextField className="col-md-6" name="fileExtension" />
          <TextField className="col-md-6" name="resourceExternalURI" />
          <DateField
            className="col-md-6"
            name="acDigitizationDate"
            showTime={true}
          />
          <TextField className="col-md-6" name="dcFormat" />
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
      {buttonBar}
    </DinaForm>
  );
}
