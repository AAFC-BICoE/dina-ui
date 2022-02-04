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
  useAccount
} from "common-ui";
import { Field } from "formik";
import { keys } from "lodash";
import { useRouter } from "next/router";
import {
  Footer,
  Head,
  Nav,
  NotPubliclyReleasableWarning,
  PersonSelectField,
  TagsAndRestrictionsSection
} from "../../components";
import { ManagedAttributesEditor } from "../../components/object-store/managed-attributes/ManagedAttributesEditor";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { License, ObjectSubtype } from "../../types/objectstore-api";
import {
  DCTYPE_OPTIONS,
  ORIENTATION_OPTIONS
} from "./metadata/single-record-edit";

export default function ExternalResourceMetadataPage() {
  const { formatMessage } = useDinaIntl();
  return (
    <div>
      <Head title={formatMessage("inputExternalResourceTitle")} />
      <Nav />
      <main className="container">
        <div>
          <h1 id="wb-cont">
            <DinaMessage id="inputExternalResourceTitle" />
          </h1>
          <SingleMetadataForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}

function SingleMetadataForm() {
  const { formatMessage, locale } = useDinaIntl();
  const router = useRouter();
  const { groupNames } = useAccount();

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
      bucket: groupNames?.[0]
    };

    // Remove blank managed attribute values from the map:
    const blankValues: any[] = ["", null];
    for (const maKey of keys(metadataEdit?.managedAttributeValues)) {
      if (blankValues.includes(metadataEdit?.managedAttributeValues?.[maKey])) {
        delete metadataEdit?.managedAttributeValues?.[maKey];
      }
    }

    const savedMeta = await save(
      [
        {
          resource: metadataEdit,
          type: "metadata"
        }
      ],
      { apiBaseUrl: "/objectstore-api" }
    );

    await router.push(`/object-store/object/view?id=${savedMeta[0].id}`);
  };

  const buttonBar = (
    <ButtonBar>
      <SubmitButton className="ms-auto" />
    </ButtonBar>
  );

  return (
    <DinaForm initialValues={{}} onSubmit={onSubmit}>
      <NotPubliclyReleasableWarning />
      {buttonBar}
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
          <TextField className="col-md-6" name="resourceExternalURI" />
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
      <FieldSet legend={<DinaMessage id="managedAttributeListTitle" />}>
        <ManagedAttributesEditor
          valuesPath="managedAttributeValues"
          managedAttributeApiPath="objectstore-api/managed-attribute"
          apiBaseUrl="/objectstore-api"
          managedAttributeKeyField="key"
          useKeyInFilter={true}
        />
      </FieldSet>
      {buttonBar}
    </DinaForm>
  );
}
