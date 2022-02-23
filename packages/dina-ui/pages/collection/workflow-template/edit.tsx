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
import { get, mapValues, pick, pickBy, set, toPairs, isNil } from "lodash";
import { useRouter } from "next/router";
import React, { useRef } from "react";
import { Promisable } from "type-fest";
import * as yup from "yup";
import {
  GroupSelectField,
  Head,
  Nav,
  TAG_SECTION_FIELDS
} from "../../../components";
import {
  PREPARATION_FIELDS,
  useMaterialSampleSave
} from "../../../components/collection";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  AcquisitionEvent,
  CollectingEvent,
  CustomView,
  FormTemplate,
  MaterialSample,
  MaterialSampleFormViewConfig,
  materialSampleFormViewConfigSchema,
  TemplateField,
  TemplateFields
} from "../../../types/collection-api";
import {
  IDENTIFIERS_FIELDS,
  MaterialSampleForm,
  MATERIALSAMPLE_FIELDSET_FIELDS
} from "../material-sample/edit";

/** The form schema (Not the back-end data model). */
const workflowMainFieldsSchema = yup.object({
  id: yup.string(),
  name: yup.string().trim().required(),
  group: yup.string().required(),
  restrictToCreatedBy: yup.boolean().required(),
  attachmentsConfig: yup.mixed(),

  storageUnit: yup.mixed(),
  templateCheckboxes: yup.mixed()
});

type WorkflowFormValues = yup.InferType<typeof workflowMainFieldsSchema>;

export default function PreparationProcessTemplatePage() {
  const { formatMessage } = useDinaIntl();
  const router = useRouter();
  const id = router.query.id?.toString();

  const workflowTemplateQuery = useQuery<CustomView>(
    { path: `/collection-api/custom-view/${id}` },
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
          withResponse(workflowTemplateQuery, ({ data: fetchedCustomView }) => (
            <WorkflowTemplateForm
              fetchedCustomView={fetchedCustomView}
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
  fetchedCustomView?: PersistedResource<CustomView>;
  onSaved: (savedDefinition: PersistedResource<CustomView>) => Promisable<void>;
}

export function WorkflowTemplateForm({
  fetchedCustomView,
  onSaved
}: WorkflowTemplateFormProps) {
  const collectingEvtFormRef = useRef<FormikProps<any>>(null);
  const acqEventFormRef = useRef<FormikProps<any>>(null);

  const { viewConfiguration: unknownViewConfig, ...initialDefinition } =
    fetchedCustomView ?? {
      type: "custom-view",
      restrictToCreatedBy: false,
      publiclyReleasable: true,
      viewConfiguration: {
        formTemplates: {},
        type: "material-sample-form-custom-view"
      }
    };

  const initialViewConfig =
    materialSampleFormViewConfigSchema.parse(unknownViewConfig);

  // Initialize the tempalte form default values and checkbox states:
  const colEventTemplateInitialValues =
    getTemplateInitialValuesFromSavedFormTemplate<CollectingEvent>(
      initialViewConfig.formTemplates?.COLLECTING_EVENT
    );
  if (!colEventTemplateInitialValues.geoReferenceAssertions?.length) {
    colEventTemplateInitialValues.geoReferenceAssertions = [{}];
  }

  const acqEventTemplateInitialValues =
    getTemplateInitialValuesFromSavedFormTemplate<AcquisitionEvent>(
      initialViewConfig.formTemplates?.ACQUISITION_EVENT
    );

  const materialSampleTemplateInitialValues =
    getTemplateInitialValuesFromSavedFormTemplate<MaterialSample>(
      initialViewConfig.formTemplates?.MATERIAL_SAMPLE
    );

  if (!materialSampleTemplateInitialValues.organism?.length) {
    materialSampleTemplateInitialValues.organism = [
      { type: "organism", determination: [{}] }
    ];
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
      enableOrganisms,
      enableScheduledActions,
      enableAssociations,
      enableAcquisitionEvent
    }
  } = materialSampleSaveHook;

  async function onSaveTemplateSubmit({
    api: { save },
    submittedValues
  }: DinaFormSubmitParams<WorkflowFormValues>) {
    const {
      id,
      group,
      name,
      restrictToCreatedBy,
      ...materialSampleTemplateFields
    } = submittedValues;
    const customViewFields = { id, group, name, restrictToCreatedBy };

    const enabledTemplateFields = getEnabledTemplateFieldsFromForm(
      materialSampleTemplateFields
    );

    const tagSectionTemplateFields = pick(
      enabledTemplateFields,
      ...TAG_SECTION_FIELDS,
      "projects"
    );

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

    const organismsTemplateFields =
      enableOrganisms &&
      pickBy(enabledTemplateFields, (_, key) => key.startsWith("organism[0]."));

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
    const newViewConfig: MaterialSampleFormViewConfig = {
      formTemplates: {
        MATERIAL_SAMPLE: {
          ...materialSampleTemplateFields.attachmentsConfig,
          templateFields: {
            ...tagSectionTemplateFields,
            ...identifierTemplateFields,
            ...materialSampleFieldsetTemplateFields,
            ...preparationTemplateFields,
            ...organismsTemplateFields,
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
      type: "material-sample-form-custom-view"
    };

    const validatedViewConfig =
      materialSampleFormViewConfigSchema.parse(newViewConfig);

    const customView: InputResource<CustomView> = {
      ...customViewFields,
      type: "custom-view",
      viewConfiguration: validatedViewConfig
    };

    const [savedDefinition] = await save<CustomView>(
      [{ resource: customView, type: "custom-view" }],
      { apiBaseUrl: "/collection-api" }
    );

    await onSaved(savedDefinition);
  }

  const buttonBar = (
    <ButtonBar>
      <div className="container d-flex">
        <BackButton
          entityId={fetchedCustomView?.id}
          className="me-auto"
          entityLink="/collection/workflow-template"
          byPassView={true}
        />
        <DeleteButton
          id={fetchedCustomView?.id}
          options={{ apiBaseUrl: "/collection-api" }}
          postDeleteRedirect="/collection/workflow-template/list"
          type="custom-view"
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
    (checked: boolean | undefined, key) =>
      checked
        ? {
            enabled: true,
            defaultValue: get(formValues, key) ?? undefined
          }
        : undefined
  );
}

/** Get the checkbox values for the template form from the persisted form template. */
export function getTemplateInitialValuesFromSavedFormTemplate<T>(
  formTemplate?: Partial<FormTemplate>
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
  for (const [field, templateField] of toPairs<TemplateField | undefined>(
    formTemplate.templateFields
  )) {
    if (templateField?.enabled && !isNil(templateField.defaultValue)) {
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
