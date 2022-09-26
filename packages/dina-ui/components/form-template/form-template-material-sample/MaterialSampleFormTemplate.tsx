import { DinaFormSection } from "common-ui";
import { PersistedResource } from "kitsu";
import React from "react";
import { MaterialSampleForm } from "../../../components";
import { FormTemplate } from "../../../types/collection-api";

export interface MaterialSampleFormTemplateFormProps {
  fetchedFormTemplate?: PersistedResource<FormTemplate>;

  /**
   * Data component navigation order to be used by the form.
   */
  navOrder?: string[] | null;

  /**
   * This should only be used when editing a form template. Returns the new order of the
   * navigation.
   */
  onChangeNavOrder?: (newOrder: string[] | null) => void;
}

export function MaterialSampleFormTemplateForm({
  fetchedFormTemplate,
  navOrder,
  onChangeNavOrder
}: MaterialSampleFormTemplateFormProps) {
  return (
    <DinaFormSection isTemplate={true}>
      <MaterialSampleForm
        navOrder={navOrder}
        onChangeNavOrder={onChangeNavOrder}
        templateInitialValues={fetchedFormTemplate as any}
      />
    </DinaFormSection>
  );
}
