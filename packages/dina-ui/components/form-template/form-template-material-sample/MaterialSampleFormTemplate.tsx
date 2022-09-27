import { DinaFormSection } from "common-ui";
import { PersistedResource } from "kitsu";
import React from "react";
import { MaterialSampleForm } from "../../../components";
import { FormTemplate } from "../../../types/collection-api";

export interface MaterialSampleFormTemplateFormProps {
  fetchedFormTemplate?: PersistedResource<FormTemplate>;
}

export function MaterialSampleFormTemplateForm({
  fetchedFormTemplate
}: MaterialSampleFormTemplateFormProps) {
  return (
    <DinaFormSection isTemplate={true}>
      <MaterialSampleForm templateInitialValues={fetchedFormTemplate as any} />
    </DinaFormSection>
  );
}
