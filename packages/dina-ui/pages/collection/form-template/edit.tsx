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
import { get, isNil, mapValues, pick, pickBy, set, toPairs } from "lodash";
import { useRouter } from "next/router";
import { RESTRICTIONS_FIELDS } from "../../../components/collection/material-sample/RestrictionField";
import React, { useRef, useState } from "react";
import { Promisable } from "type-fest";
import * as yup from "yup";
import {
  FormTemplateConfig,
  GroupSelectField,
  Head,
  IDENTIFIERS_FIELDS,
  materialSampleFormTemplateSchema,
  MaterialSampleFormTemplateConfig,
  MATERIALSAMPLE_FIELDSET_FIELDS,
  Nav,
  PREPARATION_FIELDS,
  TAG_SECTION_FIELDS,
  TemplateField,
  TemplateFieldMap,
  useMaterialSampleSave,
  MaterialSampleForm
} from "../../../components";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import {
  AcquisitionEvent,
  CollectingEvent,
  FormTemplate,
  MaterialSample,
  MaterialSampleFormSectionId
} from "../../../types/collection-api";

/** The form schema (Not the back-end data model). */
const workflowMainFieldsSchema = yup.object({
  // FormTemplate resource fields:
  id: yup.string(),
  name: yup.string().trim().required(),
  group: yup.string().required(),
  restrictToCreatedBy: yup.boolean().required(),

  // Managed Attributes default values:
  managedAttributes: yup.object({}),
  // Managed Attributes display order:
  managedAttributesOrder: yup.array(yup.string().required()),
  determinationManagedAttributesOrder: yup.array(yup.string().required()),

  attachmentsConfig: yup.mixed(),
  storageUnit: yup.mixed(),
  templateCheckboxes: yup.mixed()
});

type WorkflowFormValues = yup.InferType<typeof workflowMainFieldsSchema>;

export default function MaterialSampleFormTemplateEditPage() {
  const { formatMessage } = useDinaIntl();
  const router = useRouter();
  const id = router.query.id?.toString();

  const formTemplateQuery = useQuery<FormTemplate>(
    { path: `/collection-api/form-template/${id}` },
    { disabled: !id }
  );

  const pageTitle = id
    ? "editMaterialSampleFormTemplate"
    : "createMaterialSampleFormTemplate";

  async function moveToNextPage() {
    await router.push("/collection/form-template/list");
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
          withResponse(formTemplateQuery, ({ data: fetchedFormTemplate }) => (
            <MaterialSampleFormTemplateForm
              fetchedFormTemplate={fetchedFormTemplate}
              onSaved={moveToNextPage}
            />
          ))
        ) : (
          <MaterialSampleFormTemplateForm onSaved={moveToNextPage} />
        )}
      </main>
    </div>
  );
}

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
  const collectingEvtFormRef = useRef<FormikProps<any>>(null);
  const acqEventFormRef = useRef<FormikProps<any>>(null);

  const { viewConfiguration: unknownViewConfig, ...initialDefinition } =
    fetchedFormTemplate ?? {
      type: "form-template",
      restrictToCreatedBy: false,
      publiclyReleasable: true,
      viewConfiguration: {
        formTemplate: {},
        type: "material-sample-form-template"
      }
    };

  const initialViewConfig =
    materialSampleFormTemplateSchema.parse(unknownViewConfig);

  const [navOrder, setNavOrder] = useState<
    MaterialSampleFormSectionId[] | null
  >(initialViewConfig.navOrder);

  // Initialize the template form default values and checkbox states:
  const colEventTemplateInitialValues = {
    ...getTemplateInitialValuesFromSavedFormTemplate<CollectingEvent>(
      initialViewConfig.formTemplate?.COLLECTING_EVENT
    ),
    managedAttributesOrder:
      initialViewConfig.collectingEventManagedAttributesOrder
  };

  if (!colEventTemplateInitialValues.geoReferenceAssertions?.length) {
    colEventTemplateInitialValues.geoReferenceAssertions = [{}];
  }

  const acqEventTemplateInitialValues =
    getTemplateInitialValuesFromSavedFormTemplate<AcquisitionEvent>(
      initialViewConfig.formTemplate?.ACQUISITION_EVENT
    );

  const materialSampleTemplateInitialValues =
    getTemplateInitialValuesFromSavedFormTemplate<MaterialSample>(
      initialViewConfig.formTemplate?.MATERIAL_SAMPLE
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
    managedAttributesOrder: initialViewConfig.managedAttributesOrder,
    determinationManagedAttributesOrder:
      initialViewConfig.determinationManagedAttributesOrder,
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
      enableAcquisitionEvent,
      enableRestrictions
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

      managedAttributes: sampleManagedAttributes,
      managedAttributesOrder,
      determinationManagedAttributesOrder,

      ...materialSampleTemplateFields
    } = submittedValues;
    const formTemplateFields = { id, group, name, restrictToCreatedBy };

    const determinationManagedAttributes = (get(
      materialSampleTemplateFields,
      "organism[0].determination[0].managedAttributes"
    ) ?? {}) as Record<string, string | null | undefined>;

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

    const restrictionsTemplateFields =
      enableRestrictions && pick(enabledTemplateFields, ...RESTRICTIONS_FIELDS);

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
    const newViewConfig: MaterialSampleFormTemplateConfig = {
      formTemplate: {
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
            ...associationTemplateFields,
            ...restrictionsTemplateFields,
            ...getManagedAttributeTemplate(
              sampleManagedAttributes,
              managedAttributesOrder
            ),
            ...getManagedAttributeTemplate(
              determinationManagedAttributes,
              determinationManagedAttributesOrder,
              "organism[0].determination[0].managedAttributes"
            )
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
                    ...getManagedAttributeTemplate(
                      collectingEvtFormRef.current?.values.managedAttributes,
                      collectingEvtFormRef.current?.values
                        ?.managedAttributesOrder
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
      navOrder,
      managedAttributesOrder,
      determinationManagedAttributesOrder,
      collectingEventManagedAttributesOrder:
        collectingEvtFormRef.current?.values?.managedAttributesOrder,
      type: "material-sample-form-template"
    };

    const validatedViewConfig =
      materialSampleFormTemplateSchema.parse(newViewConfig);

    const formTemplate: InputResource<FormTemplate> = {
      ...formTemplateFields,
      type: "form-template",
      viewConfiguration: validatedViewConfig
    };

    const [savedDefinition] = await save<FormTemplate>(
      [{ resource: formTemplate, type: "form-template" }],
      { apiBaseUrl: "/collection-api" }
    );

    await onSaved(savedDefinition);
  }

  const buttonBar = (
    <ButtonBar>
      <div className="container d-flex">
        <BackButton
          entityId={fetchedFormTemplate?.id}
          className="me-auto"
          entityLink="/collection/form-template"
          byPassView={true}
        />
        <DeleteButton
          id={fetchedFormTemplate?.id}
          options={{ apiBaseUrl: "/collection-api" }}
          postDeleteRedirect="/collection/form-template/list"
          type="form-template"
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
          hideNavFormTemplateSelect={true}
          navOrder={navOrder}
          onChangeNavOrder={setNavOrder}
        />
      </DinaFormSection>
      {buttonBar}
    </DinaForm>
  );
}

/** Get the enabled template fields with their default values from the form. */
export function getEnabledTemplateFieldsFromForm(
  formValues: any
): TemplateFieldMap {
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
  formTemplate?: Partial<FormTemplateConfig>
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

/**
 * Gets the template fields for the managed attributes,
 * which are enabled without the usual visibility checkbox.
 */
function getManagedAttributeTemplate(
  managedAttributes: Record<string, string | null | undefined>,
  managedAttributesOrder?: string[],
  managedAttributePath = "managedAttributes"
): TemplateFieldMap {
  // Managed attribute default values don't need the template checkbox, all are set to "enabled":
  const templateFieldMap: TemplateFieldMap = {};
  for (const key of managedAttributesOrder ?? []) {
    templateFieldMap[`${managedAttributePath}.${key}`] = {
      enabled: true,
      defaultValue: managedAttributes?.[key]
    };
  }
  return templateFieldMap;
}
