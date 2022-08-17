import { DinaFormSection, DinaFormSubmitParams } from "common-ui";
import { InputResource, PersistedResource } from "kitsu";
import React from "react";
import { Promisable } from "type-fest";
import { MaterialSampleForm } from "../../../components";
import {
  FormTemplate,
  MATERIAL_SAMPLE_FORM_LEGEND
} from "../../../types/collection-api";

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
    // console.log(JSON.stringify(submittedValues));

    const formTemplate: InputResource<FormTemplate> = {
      type: "form-template",
      name: submittedValues.name,
      group: submittedValues.group,
      components: MATERIAL_SAMPLE_FORM_LEGEND.map(
        (dataComponent, componentIndex) => ({
          name: dataComponent.id,
          visible: true,
          order: componentIndex,
          sections: dataComponent.sections.map((section, sectionIndex) => ({
            name: section.id,
            visible: true,
            fields: section.fields.map((field, fieldIndex) => ({}))
          }))
        })
      )
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
