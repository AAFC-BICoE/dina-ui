import { DinaFormSection, DinaFormSubmitParams } from "common-ui";
import { InputResource, PersistedResource } from "kitsu";
import React from "react";
import { Promisable } from "type-fest";
import { MaterialSampleForm } from "../../../components";
import { FormTemplate } from "../../../types/collection-api";

export interface MaterialSampleFormTemplateFormProps {
  fetchedFormTemplate?: PersistedResource<FormTemplate>;
  onSaved: (
    savedDefinition: PersistedResource<FormTemplate>
  ) => Promisable<void>;
}

export function MaterialSampleFormTemplateForm({
  fetchedFormTemplate,
  onSaved
}: MaterialSampleFormTemplateFormProps) {
  async function onSaveTemplateSubmit({
    api: { save },
    submittedValues
  }: DinaFormSubmitParams<FormTemplate>) {
    const formTemplate: InputResource<FormTemplate> = {
      type: "form-template"
    };

    const [savedDefinition] = await save<FormTemplate>(
      [{ resource: formTemplate, type: "form-template" }],
      { apiBaseUrl: "/collection-api" }
    );

    await onSaved(savedDefinition);
  }

  return (
    <>
      <DinaFormSection isTemplate={true}>
        <MaterialSampleForm
          templateInitialValues={fetchedFormTemplate as any}
        />
      </DinaFormSection>
    </>
  );
}
