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
  withResponse
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
  License,
  Metadata,
  ObjectSubtype
} from "../../../types/objectstore-api";
import { useMetadataEditQuery } from "../../../components/object-store/metadata/useMetadata";

interface SingleMetadataFormProps {
  /** Existing Metadata is required, no new ones are added with this form. */
  metadata: Metadata;
  router: NextRouter;
}

export default function MetadataEditPage() {
  const router = useRouter();

  const id = router.query.id?.toString();

  const { formatMessage } = useDinaIntl();
  const query = useMetadataEditQuery(id);

  return (
    <div>
      <Head title={formatMessage("editMetadataTitle")} />
      <Nav />
      <main className="container">
        {id && (
          <div>
            <h1 id="wb-cont">
              <DinaMessage id="editMetadataTitle" />
            </h1>
            {withResponse(query, ({ data }) => (
              <SingleMetadataForm metadata={data} router={router} />
            ))}
          </div>
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
      : null
  };

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
      acSubtype: acSubtype?.acSubtype ?? null
    };

    // Remove blank managed attribute values from the map:
    const blankValues: any[] = ["", null];
    for (const maKey of keys(metadataEdit?.managedAttributes)) {
      if (blankValues.includes(metadataEdit?.managedAttributes?.[maKey])) {
        delete metadataEdit?.managedAttributes?.[maKey];
      }
    }

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
  };

  const buttonBar = (
    <ButtonBar>
      <BackButton entityId={id as string} entityLink="/object-store/object" />
      <SubmitButton className="ms-auto" />
    </ButtonBar>
  );

  return (
    <DinaForm initialValues={initialValues} onSubmit={onSubmit}>
      <NotPubliclyReleasableWarning />
      {buttonBar}
      <div className="mb-3">
        <MetadataFileView metadata={metadata} imgHeight="15rem" />
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
