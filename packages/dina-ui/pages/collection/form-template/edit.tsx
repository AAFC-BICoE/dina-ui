import {
  BackButton,
  DeleteButton,
  DinaForm,
  DinaFormSubmitParams,
  FieldSet,
  SubmitButton,
  TextField,
  useQuery,
  withResponse
} from "common-ui";
import { useRouter } from "next/router";
import React from "react";
import {
  FormTemplate,
  FormTemplateComponents,
  MATERIAL_SAMPLE_FORM_LEGEND
} from "../../../types/collection-api";
import PageLayout from "packages/dina-ui/components/page/PageLayout";
import { MaterialSampleFormTemplateForm } from "packages/dina-ui/components/form-template/form-template-material-sample/MaterialSampleFormTemplate";
import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";
import { GroupSelectField } from "packages/dina-ui/components/group-select/GroupSelectField";
import { InputResource } from "kitsu";

export default function FormTemplateEditPage() {
  const router = useRouter();
  const id = router.query.id?.toString();

  const formTemplateQuery = useQuery<FormTemplate>(
    { path: `/collection-api/form-template/${id}` },
    { disabled: !id }
  );

  return (
    <>
      {/* New Form Template or New Form Template */}
      {id ? (
        withResponse(formTemplateQuery, ({ data: fetchedFormTemplate }) => (
          <FormTemplateEditPageLoaded
            fetchedFormTemplate={fetchedFormTemplate}
            id={id}
          />
        ))
      ) : (
        <FormTemplateEditPageLoaded id={id} />
      )}
    </>
  );
}

interface FormTemplateEditPageLoadedProps {
  id?: string;
  fetchedFormTemplate?: FormTemplate;
}

/**
 * This component is only displayed after the Form Template has been loaded.
 */
export function FormTemplateEditPageLoaded({
  id,
  fetchedFormTemplate
}: FormTemplateEditPageLoadedProps) {
  const router = useRouter();

  const pageTitle = id
    ? "editMaterialSampleFormTemplate"
    : "createMaterialSampleFormTemplate";

  async function moveToNextPage() {
    await router.push("/collection/form-template/list");
  }

  async function onSaveTemplateSubmit({
    api: { save },
    submittedValues
  }: DinaFormSubmitParams<FormTemplate & FormTemplateComponents>) {
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
            fields: section.fields.map((field, fieldIndex) => ({
              name: field.id,
              visible: submittedValues.templateCheckboxes?.[field.id] ?? false
            }))
          }))
        })
      )
    };

    // console.log(JSON.stringify("Form Template to be saved: " + JSON.stringify(formTemplate)));

    const [savedDefinition] = await save<FormTemplate>(
      [{ resource: formTemplate, type: "form-template" }],
      { apiBaseUrl: "/collection-api" }
    );

    await moveToNextPage();
  }

  const buttonBarContent = (
    <>
      <BackButton
        entityId={id}
        className="me-auto"
        entityLink="/collection/form-template"
        byPassView={true}
      />

      {id && (
        <DeleteButton
          id={id}
          options={{ apiBaseUrl: "/collection-api" }}
          postDeleteRedirect="/collection/form-template/list"
          type="form-template"
          className="me-5"
        />
      )}

      <SubmitButton />
    </>
  );

  const initialValues = {
    id,
    type: "form-template",
    ...fetchedFormTemplate
  };

  return (
    <DinaForm<FormTemplate>
      initialValues={initialValues as any}
      onSubmit={onSaveTemplateSubmit}
    >
      <PageLayout titleId={pageTitle} buttonBarContent={buttonBarContent}>
        {/* Form Template Specific Configuration */}
        <div className="container-fluid px-0">
          <FieldSet
            className="workflow-main-details"
            legend={<DinaMessage id="configureFormTemplate" />}
          >
            <div className="row">
              <div className="col-md-6">
                <TextField name="name" className="row" />
                <GroupSelectField
                  name="group"
                  enableStoredDefaultGroup={true}
                />
              </div>
            </div>
          </FieldSet>
        </div>

        {/* New Form Template or New Form Template */}
        {id ? (
          <MaterialSampleFormTemplateForm
            fetchedFormTemplate={fetchedFormTemplate as any}
          />
        ) : (
          <MaterialSampleFormTemplateForm />
        )}
      </PageLayout>
    </DinaForm>
  );
}
