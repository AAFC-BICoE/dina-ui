import { DinaForm, FieldSet, SelectField } from "common-ui";
import {
  NotPubliclyReleasableWarning,
  TagsAndRestrictionsSection,
  NotPubliclyReleasableSection
} from "../..";
import { MetadataFileView } from "../metadata/MetadataFileView";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { Derivative } from "../../../types/objectstore-api";
import { useDerivativeSave } from "../metadata/useMetadata";
import { DCTYPE_OPTIONS } from "../../../pages/object-store/metadata/edit";
import { ReactNode, Ref } from "react";
import { InputResource } from "kitsu";
import { FormikProps } from "formik";
import MetadataBadges from "../metadata/MetadataBadges";

export interface MetadataFormProps {
  derivative?: InputResource<Derivative>;

  // Function to redirect to next page after saving metadata
  onSaved?: (id: string) => Promise<void>;

  buttonBar?: ReactNode;

  /** Optionally call the hook from the parent component. */
  derivativeSaveHook?: ReturnType<typeof useDerivativeSave>;

  // Form ref from parent component
  derivativeFormRef?: Ref<FormikProps<InputResource<Derivative>>>;
}

export function DerivativeForm({
  derivative,
  onSaved,
  buttonBar,
  derivativeSaveHook,
  derivativeFormRef
}: MetadataFormProps) {
  const { initialValues, onSubmit } =
    derivativeSaveHook ??
    useDerivativeSave({
      initialValues: derivative,
      onSaved
    });

  const derivativeOnSubmit = async (submittedValues) => {
    await onSubmit(submittedValues);
  };

  return (
    <DinaForm<InputResource<Derivative>>
      initialValues={{ ...initialValues, type: "derivative" }}
      onSubmit={derivativeOnSubmit}
      innerRef={
        derivativeFormRef as Ref<FormikProps<InputResource<Derivative>>>
      }
    >
      <NotPubliclyReleasableWarning />
      {buttonBar}
      <div className="mb-3">
        <MetadataFileView
          metadata={derivative as Derivative}
          imgHeight="15rem"
          hideDownload={true}
        />
      </div>
      <MetadataBadges />
      <NotPubliclyReleasableSection />
      <TagsAndRestrictionsSection
        resourcePath="objectstore-api/derivative"
        tagsFieldName="acTags"
        groupSelectorName="bucket"
        indexName="dina_object_store_index"
      />
      <FieldSet legend={<DinaMessage id="metadataMediaDetailsLabel" />}>
        <div className="row">
          <SelectField
            className="col-md-6"
            name="dcType"
            options={DCTYPE_OPTIONS}
          />
        </div>
      </FieldSet>
      {buttonBar}
    </DinaForm>
  );
}
