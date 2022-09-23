import {
  BackButton,
  DeleteButton,
  DinaForm,
  DinaFormSection,
  DinaFormSubmitParams,
  FieldSet,
  SubmitButton,
  TextField,
  useQuery,
  withResponse
} from "common-ui";
import { useRouter } from "next/router";
import React, { useRef } from "react";
import {
  AcquisitionEvent,
  CollectingEvent,
  FormTemplate,
  FormTemplateComponents,
  MaterialSample,
  MATERIAL_SAMPLE_FORM_LEGEND
} from "../../../types/collection-api";
import PageLayout from "packages/dina-ui/components/page/PageLayout";
import { DinaMessage } from "packages/dina-ui/intl/dina-ui-intl";
import { GroupSelectField } from "packages/dina-ui/components/group-select/GroupSelectField";
import { InputResource, PersistedResource } from "kitsu";
import { getInitialValuesFromFormTemplate } from "packages/dina-ui/components/form-template/formTemplateUtils";
import {
  MaterialSampleForm,
  useMaterialSampleSave
} from "packages/dina-ui/components";
import { FormikProps } from "formik";
import { Promisable } from "type-fest";

export default function FormTemplateEditPage() {
  const router = useRouter();
  const id = router.query.id?.toString();

  const formTemplateQuery = useQuery<FormTemplate>(
    { path: `/collection-api/form-template/${id}` },
    { disabled: !id }
  );

  async function moveToNextPage() {
    await router.push("/collection/form-template/list");
  }

  return (
    <>
      {/* Load Form Template or New Form Template */}
      {id ? (
        withResponse(formTemplateQuery, ({ data: fetchedFormTemplate }) => (
          <FormTemplateEditPageLoaded
            fetchedFormTemplate={fetchedFormTemplate}
            onSaved={moveToNextPage}
            id={id}
          />
        ))
      ) : (
        <FormTemplateEditPageLoaded id={id} onSaved={moveToNextPage} />
      )}
    </>
  );
}

interface FormTemplateEditPageLoadedProps {
  id?: string;
  fetchedFormTemplate?: FormTemplate;
  onSaved: (
    savedDefinition: PersistedResource<FormTemplate>
  ) => Promisable<void>;
}

/**
 * This component is only displayed after the Form Template has been loaded.
 */
export function FormTemplateEditPageLoaded({
  id,
  fetchedFormTemplate,
  onSaved
}: FormTemplateEditPageLoadedProps) {
  const collectingEvtFormRef = useRef<FormikProps<any>>(null);
  const acqEventFormRef = useRef<FormikProps<any>>(null);
  const pageTitle = id
    ? "editMaterialSampleFormTemplate"
    : "createMaterialSampleFormTemplate";
  // Collecting Event Initial Values
  const collectingEventInitialValues = {
    ...getInitialValuesFromFormTemplate<CollectingEvent>(fetchedFormTemplate),
    managedAttributesOrder: []
  };
  if (!collectingEventInitialValues.geoReferenceAssertions?.length) {
    collectingEventInitialValues.geoReferenceAssertions = [{}];
  }

  // Acquisition Event Initial Values
  const acquisitionEventInitialValues =
    getInitialValuesFromFormTemplate<AcquisitionEvent>(fetchedFormTemplate);

  // The material sample initial values to load.
  const materialSampleTemplateInitialValues =
    getInitialValuesFromFormTemplate<MaterialSample>(fetchedFormTemplate);
  if (!materialSampleTemplateInitialValues.organism?.length) {
    materialSampleTemplateInitialValues.organism = [
      { type: "organism", determination: [{}] }
    ];
  }
  if (!materialSampleTemplateInitialValues.associations?.length) {
    materialSampleTemplateInitialValues.associations = [{}];
  }

  // Provide initial values for the material sample form.
  const initialValues: any = {
    ...collectingEventInitialValues,
    ...fetchedFormTemplate,
    id,
    type: "form-template"
  };

  // Generate the material sample save hook to use for the form.
  const materialSampleSaveHook = useMaterialSampleSave({
    isTemplate: true,
    acqEventTemplateInitialValues: acquisitionEventInitialValues,
    colEventTemplateInitialValues: collectingEventInitialValues,
    materialSampleTemplateInitialValues,
    colEventFormRef: collectingEvtFormRef,
    acquisitionEventFormRef: acqEventFormRef
  });

  async function onSaveTemplateSubmit({
    api: { save },
    submittedValues
  }: DinaFormSubmitParams<FormTemplate & FormTemplateComponents>) {
    // Include the collecting event and acquisition event values.
    const allSubmittedValues: FormTemplate & FormTemplateComponents = {
      ...submittedValues,
      ...(collectingEvtFormRef?.current?.values ?? {}),
      ...(acqEventFormRef?.current?.values ?? {})
    };

    // All arrays should be removed from the submitted values.
    const iterateThrough = (object: any) => {
      Object.keys(object).forEach((key) => {
        if (object[key]) {
          if (Array.isArray(object[key])) {
            const objects = Object.assign({}, ...object[key]);
            allSubmittedValues[key] = objects;
            iterateThrough(objects);
          }

          if (typeof object[key] === "object") {
            return iterateThrough(object[key]);
          }
        }
      });
    };
    iterateThrough(allSubmittedValues);

    // The finished form template to save with all of the visibility, default values for each
    // field. Eventually position will also be stored here.
    const formTemplate: InputResource<FormTemplate> = {
      id: submittedValues.id,
      type: "form-template",
      name: submittedValues.name,
      group: submittedValues.group,
      restrictToCreatedBy: false,
      viewConfiguration: {},
      components: MATERIAL_SAMPLE_FORM_LEGEND.map(
        (dataComponent, componentIndex) => ({
          name: dataComponent.id,
          visible: true,
          order: componentIndex,
          sections: dataComponent.sections.map((section) => ({
            name: section.id,
            visible: true,
            items: section.items.map((field) => ({
              name: field.id,
              visible:
                allSubmittedValues?.templateCheckboxes?.[field.id] ?? false,
              defaultValue: allSubmittedValues?.[field.id]
            }))
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

  return (
    <DinaForm<FormTemplate & FormTemplateComponents>
      initialValues={initialValues}
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

        {/* The Material Sample Form in Template Mode */}
        <DinaFormSection isTemplate={true}>
          <MaterialSampleForm
            templateInitialValues={initialValues}
            materialSampleSaveHook={materialSampleSaveHook}
          />
        </DinaFormSection>
      </PageLayout>
    </DinaForm>
  );
}
