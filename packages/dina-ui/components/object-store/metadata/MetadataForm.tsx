import {
  DateField,
  DinaForm,
  FieldSet,
  ResourceSelectField,
  SelectField,
  TextField
} from "common-ui";
import { Field } from "formik";
import {
  NotPubliclyReleasableWarning,
  PersonSelectField,
  TagsAndRestrictionsSection
} from "../..";
import { ManagedAttributesEditor } from "../../managed-attributes/ManagedAttributesEditor";
import { MetadataFileView } from "./MetadataFileView";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  License,
  Metadata,
  ObjectSubtype
} from "../../../types/objectstore-api";
import { useMetadataSave } from "./useMetadata";
import {
  DCTYPE_OPTIONS,
  ORIENTATION_OPTIONS
} from "../../../pages/object-store/metadata/edit";
import { ReactNode, Ref } from "react";
import { InputResource } from "kitsu";
import { FormikProps } from "formik";

export interface MetadataFormProps {
  metadata?: InputResource<Metadata>;

  // Function to redirect to next page after saving metadata
  onSaved?: (id: string) => Promise<void>;

  buttonBar?: ReactNode;

  /** Optionally call the hook from the parent component. */
  metadataSaveHook?: ReturnType<typeof useMetadataSave>;

  // Form ref from parent component
  metadataFormRef?: Ref<FormikProps<InputResource<Metadata>>>;

  /**
   * Removes the html tag IDs from hidden tabs.
   * This needs to be done for off-screen forms in the bulk editor.
   */
  isOffScreen?: boolean;

  /** Reduces the rendering to improve performance when bulk editing many material samples. */
  reduceRendering?: boolean;
}

export function MetadataForm({
  metadata,
  onSaved,
  buttonBar,
  metadataSaveHook,
  metadataFormRef
}: MetadataFormProps) {
  const { formatMessage, locale } = useDinaIntl();

  const { initialValues, onSubmit } =
    metadataSaveHook ??
    useMetadataSave({
      initialValues: metadata,
      onSaved
    });

  const metadataOnSubmit = async (submittedValues) => {
    await onSubmit(submittedValues);
  };

  return (
    <DinaForm<InputResource<Metadata>>
      initialValues={initialValues}
      onSubmit={metadataOnSubmit}
      innerRef={metadataFormRef}
    >
      <NotPubliclyReleasableWarning />
      {buttonBar}
      <div className="mb-3">
        {metadata?.derivatives && (
          <MetadataFileView metadata={metadata as Metadata} imgHeight="15rem" />
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
                filter={(input) => ({
                  rsql:
                    `acSubtype=='${input}*'` +
                    (dcType ? ` and dcType==${dcType}` : "")
                })}
                model="objectstore-api/object-subtype"
                optionLabel={(ost) => ost.acSubtype}
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
            optionLabel={(license) => license.titles[locale] ?? license.url}
            removeDefaultSort={true}
          />
        </div>
      </FieldSet>
      <ManagedAttributesEditor
        valuesPath="managedAttributes"
        values={metadata?.managedAttributes}
        managedAttributeApiPath="objectstore-api/managed-attribute"
        fieldSetProps={{
          legend: <DinaMessage id="managedAttributes" />
        }}
      />
      {buttonBar}
    </DinaForm>
  );
}
