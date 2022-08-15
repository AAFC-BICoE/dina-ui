import {
  BackButton,
  ButtonBar,
  DateField,
  DinaForm,
  FieldSet,
  ResourceSelectField,
  SelectField,
  SubmitButton,
  TextField
} from "common-ui";
import { Field } from "formik";
import {
  NotPubliclyReleasableWarning,
  PersonSelectField,
  TagsAndRestrictionsSection
} from "../..";
import { ManagedAttributesEditor } from "../managed-attributes/ManagedAttributesEditor";
import { MetadataFileView } from "./MetadataFileView";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { License, ObjectSubtype } from "../../../types/objectstore-api";
import { useMetadataSave } from "./useMetadata";
import {
  SingleMetadataFormProps,
  DCTYPE_OPTIONS,
  ORIENTATION_OPTIONS
} from "../../../pages/object-store/metadata/single-record-edit";

export function SingleMetadataForm({
  router,
  metadata
}: SingleMetadataFormProps) {
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
  const metadataSaveHook = useMetadataSave({
    initialValues
  });
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
