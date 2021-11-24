import {
  BackButton,
  ButtonBar,
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
import { FormikProps } from "formik";
import { InputResource, PersistedResource } from "kitsu";
import { get, mapValues, pick, pickBy, set, toPairs } from "lodash";
import { useRouter } from "next/router";
import React, { useRef } from "react";
import { Promisable } from "type-fest";
import * as yup from "yup";
import { GroupSelectField, Head, Nav } from "../../../components";
import {
  PREPARATION_FIELDS,
  useMaterialSampleSave
} from "../../../components/collection";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  FormTemplate,
  PreparationProcessDefinition,
  TemplateField,
  TemplateFields
} from "../../../types/collection-api";
import {
  IDENTIFIERS_FIELDS,
  MaterialSampleForm,
  MATERIALSAMPLE_FIELDSET_FIELDS
} from "../material-sample/edit";

const workflowMainFieldsSchema = yup.object({
  id: yup.string(),
  name: yup.string().trim().required(),
  group: yup.string().required(),
  attachmentsConfig: yup.mixed(),

  storageUnit: yup.mixed(),
  templateCheckboxes: yup.mixed()
});

type WorkflowFormValues = yup.InferType<typeof workflowMainFieldsSchema>;

export default function PreparationProcessTemplatePage() {
  const { formatMessage } = useDinaIntl();
  const router = useRouter();
  const id = router.query.id?.toString();

  const workflowTemplateQuery = useQuery<PreparationProcessDefinition>(
    { path: `/collection-api/material-sample-action-definition/${id}` },
    { disabled: !id }
  );

  const pageTitle = id
    ? "editWorkflowTemplateTitle"
    : "createWorkflowTemplateTitle";

  async function moveToNextPage() {
    await router.push("/collection/workflow-template/list");
  }

  return (
    <div>
      <Head title={formatMessage(pageTitle)} />
      <Nav />
      <main className="container-fluid">
        <h1 id="wb-cont">
          <DinaMessage id={pageTitle} />
        </h1>
        {id ? (
          withResponse(workflowTemplateQuery, ({ data: fetchedDefinition }) => (
            <WorkflowTemplateForm
              fetchedActionDefinition={fetchedDefinition}
              onSaved={moveToNextPage}
            />
          ))
        ) : (
          <WorkflowTemplateForm onSaved={moveToNextPage} />
        )}
      </main>
    </div>
  );
}

export interface WorkflowTemplateFormProps {
  fetchedActionDefinition?: PersistedResource<PreparationProcessDefinition>;
  onSaved: (
    savedDefinition: PersistedResource<PreparationProcessDefinition>
  ) => Promisable<void>;
}

export function WorkflowTemplateForm({
  fetchedActionDefinition,
  onSaved
}: WorkflowTemplateFormProps) {
  const collectingEvtFormRef = useRef<FormikProps<any>>(null);
  const acqEventFormRef = useRef<FormikProps<any>>(null);

  const { formTemplates, ...initialDefinition } = fetchedActionDefinition ?? {};

  // Initialize the tempalte form default values and checkbox states:
  const colEventTemplateInitialValues =
    getTemplateInitialValuesFromSavedFormTemplate(
      formTemplates?.COLLECTING_EVENT
    );
  if (!colEventTemplateInitialValues.geoReferenceAssertions?.length) {
    colEventTemplateInitialValues.geoReferenceAssertions = [{}];
  }

  const acqEventTemplateInitialValues =
    getTemplateInitialValuesFromSavedFormTemplate(
      formTemplates?.ACQUISITION_EVENT
    );

  const materialSampleTemplateInitialValues =
    getTemplateInitialValuesFromSavedFormTemplate(
      formTemplates?.MATERIAL_SAMPLE
    );
  if (!materialSampleTemplateInitialValues.determination?.length) {
    materialSampleTemplateInitialValues.determination = [{}];
  }
  if (!materialSampleTemplateInitialValues.associations?.length) {
    materialSampleTemplateInitialValues.associations = [{}];
  }

  const initialValues: Partial<WorkflowFormValues> = {
    ...initialDefinition,
    ...materialSampleTemplateInitialValues
  };

  const materialSampleSaveHook = useMaterialSampleSave({
    isTemplate: true,
    acqEventTemplateInitialValues,
    colEventTemplateInitialValues,
    materialSampleTemplateInitialValues,
    colEventFormRef: collectingEvtFormRef,
    acquisitionEventFormRef: acqEventFormRef
  });

  const {
    colEventId: attachedColEventId,
    acqEventId: attachedAcqEventId,
    dataComponentState: {
      enableCollectingEvent,
      enablePreparations,
      enableStorage,
      enableDetermination,
      enableOrganism,
      enableScheduledActions,
      enableAssociations,
      enableAcquisitionEvent
    }
  } = materialSampleSaveHook;

  async function onSaveTemplateSubmit({
    api: { save },
    submittedValues
  }: DinaFormSubmitParams<WorkflowFormValues>) {
    const mainTemplateFields = pick(submittedValues, "id", "group", "name");

    const enabledTemplateFields =
      getEnabledTemplateFieldsFromForm(submittedValues);

    const identifierTemplateFields = pick(
      enabledTemplateFields,
      ...IDENTIFIERS_FIELDS
    );

    const materialSampleFieldsetTemplateFields = pick(
      enabledTemplateFields,
      ...MATERIALSAMPLE_FIELDSET_FIELDS
    );

    const preparationTemplateFields =
      enablePreparations && pick(enabledTemplateFields, ...PREPARATION_FIELDS);

    const organismTemplateFields =
      enableOrganism &&
      pickBy(enabledTemplateFields, (_, key) => key.startsWith("organism."));

    const determinationTemplateFields =
      enableDetermination &&
      pickBy(enabledTemplateFields, (_, key) =>
        key.startsWith("determination[0].")
      );

    const storageTemplateFields =
      enableStorage && pick(enabledTemplateFields, "storageUnit");

    const scheduledActionsTemplateFields =
      enableScheduledActions &&
      pickBy(enabledTemplateFields, (_, key) =>
        key.startsWith("scheduledAction.")
      );

    const associationTemplateFields = enableAssociations
      ? pickBy(
          enabledTemplateFields,
          (_, key) =>
            key.startsWith("hostOrganism.") ||
            key.startsWith("associations[0].")
        )
      : {};

    // Construct the template definition to persist based on the form values:
    const definition: InputResource<PreparationProcessDefinition> = {
      ...mainTemplateFields,
      actionType: "ADD",
      formTemplates: {
        MATERIAL_SAMPLE: {
          ...submittedValues.attachmentsConfig,
          templateFields: {
            ...identifierTemplateFields,
            ...materialSampleFieldsetTemplateFields,
            ...preparationTemplateFields,
            ...organismTemplateFields,
            ...determinationTemplateFields,
            ...storageTemplateFields,
            ...scheduledActionsTemplateFields,
            ...associationTemplateFields
          }
        },
        COLLECTING_EVENT: enableCollectingEvent
          ? {
              // When making a template for a new Collecting Event, set all chosen fields here:
              ...(!attachedColEventId &&
                collectingEvtFormRef.current?.values?.attachmentsConfig),
              templateFields: attachedColEventId
                ? {
                    id: { enabled: true, defaultValue: attachedColEventId }
                  }
                : {
                    ...getEnabledTemplateFieldsFromForm(
                      collectingEvtFormRef.current?.values
                    ),
                    id: undefined
                  }
            }
          : undefined,
        ACQUISITION_EVENT: enableAcquisitionEvent
          ? {
              templateFields: attachedAcqEventId
                ? {
                    id: { enabled: true, defaultValue: attachedAcqEventId }
                  }
                : {
                    ...getEnabledTemplateFieldsFromForm(
                      acqEventFormRef.current?.values
                    ),
                    id: undefined
                  }
            }
          : undefined
      },
      type: "material-sample-action-definition"
    };

    const [savedDefinition] = await save<PreparationProcessDefinition>(
      [
        {
          resource: definition,
          type: "material-sample-action-definition"
        }
      ],
      { apiBaseUrl: "/collection-api" }
    );

    await onSaved(savedDefinition);
  }

  const buttonBar = (
    <ButtonBar>
      <div className="container d-flex">
        <BackButton
          entityId={fetchedActionDefinition?.id}
          className="me-auto"
          entityLink="/collection/workflow-template"
          byPassView={true}
        />
        <DeleteButton
          id={fetchedActionDefinition?.id}
          options={{ apiBaseUrl: "/collection-api" }}
          postDeleteRedirect="/collection/workflow-template/list"
          type="material-sample-action-definition"
          className="me-5"
        />
        <SubmitButton />
      </div>
    </ButtonBar>
  );

  return (
    <DinaForm<Partial<WorkflowFormValues>>
      initialValues={initialValues}
      onSubmit={onSaveTemplateSubmit}
      validationSchema={workflowMainFieldsSchema}
    >
      {buttonBar}
      <div className="container">
        <FieldSet
          className="workflow-main-details"
          legend={<DinaMessage id="configureAction" />}
        >
          <div className="row">
            <div className="col-md-6">
              <TextField name="name" className="row" />
              <GroupSelectField name="group" enableStoredDefaultGroup={true} />
            </div>
          </div>
        </FieldSet>
      </div>
      <DinaFormSection isTemplate={true}>
        <MaterialSampleForm
          templateInitialValues={materialSampleTemplateInitialValues}
          materialSampleSaveHook={materialSampleSaveHook}
        />
      </DinaFormSection>
      {buttonBar}
    </DinaForm>
  );
}

/** Get the enabled template fields with their default values from the form. */
export function getEnabledTemplateFieldsFromForm(
  formValues: any
): TemplateFields {
  // delete the key "determination" as children with index are actual keys
  delete formValues.templateCheckboxes?.determination;
  return mapValues(
    formValues.templateCheckboxes ?? {},
    (val: boolean | undefined, key) =>
      val
        ? {
            enabled: true,
            defaultValue: get(formValues, key) || undefined
          }
        : undefined
  );
}

/** Get the checkbox values for the template form from the persisted form template. */
export function getTemplateInitialValuesFromSavedFormTemplate<T>(
  formTemplate?: Partial<FormTemplate<T>>
): Partial<T> & { templateCheckboxes?: Record<string, true | undefined> } {
  if (!formTemplate) {
    return {};
  }

  // Get the checkbox state:
  const templateCheckboxes = mapValues(formTemplate.templateFields, val =>
    val?.enabled ? true : undefined
  );

  // Get the default values from the stored template:
  const defaultValues: Partial<T> = {};
  for (const [field, templateField] of toPairs<TemplateField<any> | undefined>(
    formTemplate.templateFields
  )) {
    if (templateField?.enabled && templateField.defaultValue) {
      set(defaultValues, field, templateField.defaultValue);
    }
  }

  const { allowNew, allowExisting } = formTemplate;
  return {
    ...defaultValues,
    templateCheckboxes,
    attachmentsConfig: { allowNew, allowExisting }
  };
}
