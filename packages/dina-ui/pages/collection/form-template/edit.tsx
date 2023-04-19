import {
  BackButton,
  CheckBoxField,
  DeleteButton,
  DinaForm,
  DinaFormSection,
  DinaFormSubmitParams,
  FieldSet,
  FieldSpy,
  SubmitButton,
  TextField,
  useQuery,
  withResponse
} from "common-ui";
import { FormikProps } from "formik";
import { InputResource, PersistedResource } from "kitsu";
import _ from "lodash";
import { useRouter } from "next/router";
import { onValidateSplitConfiguration } from "../../../components/collection/material-sample/SplitConfigurationSection";
import { useRef, useState } from "react";
import { Promisable } from "type-fest";
import {
  MaterialSampleForm,
  useMaterialSampleSave
} from "../../../../dina-ui/components";
import {
  getMaterialSampleComponentValues,
  getComponentOrderFromTemplate,
  getComponentValues,
  getFormTemplateCheckboxes,
  getSplitConfigurationComponentValues
} from "../../../../dina-ui/components/form-template/formTemplateUtils";
import { GroupSelectField } from "../../../../dina-ui/components/group-select/GroupSelectField";
import PageLayout from "../../../../dina-ui/components/page/PageLayout";
import {
  DinaMessage,
  useDinaIntl
} from "../../../../dina-ui/intl/dina-ui-intl";
import {
  ASSOCIATIONS_COMPONENT_NAME,
  COLLECTING_EVENT_COMPONENT_NAME,
  FIELD_EXTENSIONS_COMPONENT_NAME,
  FormTemplate,
  FormTemplateComponents,
  IDENTIFIER_COMPONENT_NAME,
  MANAGED_ATTRIBUTES_COMPONENT_NAME,
  MATERIAL_SAMPLE_ATTACHMENTS_COMPONENT_NAME,
  MATERIAL_SAMPLE_FORM_LEGEND,
  MATERIAL_SAMPLE_INFO_COMPONENT_NAME,
  ORGANISMS_COMPONENT_NAME,
  PREPARATIONS_COMPONENT_NAME,
  RESTRICTION_COMPONENT_NAME,
  SCHEDULED_ACTIONS_COMPONENT_NAME,
  SPLIT_CONFIGURATION_COMPONENT_NAME,
  STORAGE_COMPONENT_NAME
} from "../../../types/collection-api";

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
  const { formatMessage } = useDinaIntl();

  const [navOrder, setNavOrder] = useState<string[] | null>(
    getComponentOrderFromTemplate(fetchedFormTemplate)
  );
  const collectingEvtFormRef = useRef<FormikProps<any>>(null);
  const pageTitle = id
    ? "editMaterialSampleFormTemplate"
    : "createMaterialSampleFormTemplate";
  // Get initial values of data components
  const allMaterialSampleComponentValues =
    getMaterialSampleComponentValues(fetchedFormTemplate);

  if (!allMaterialSampleComponentValues.associations?.length) {
    allMaterialSampleComponentValues.associations = [{}];
  }

  // collecting event components need to be isolated for useMaterialSample hook
  const collectingEventInitialValues =
    getComponentValues(
      COLLECTING_EVENT_COMPONENT_NAME,
      fetchedFormTemplate,
      false
    ) ?? {};

  if (!collectingEventInitialValues.geoReferenceAssertions?.length) {
    collectingEventInitialValues.geoReferenceAssertions = [{}];
  }

  // Get Split Configuration Settings
  const splitConfigurationInitialValues =
    getSplitConfigurationComponentValues(fetchedFormTemplate);

  const formTemplateCheckboxes = getFormTemplateCheckboxes(fetchedFormTemplate);

  // Initial values do not need to contain the components object.
  const { components, ...fetchedFormTemplateWithoutComponents } =
    fetchedFormTemplate || {};

  // Provide initial values for the material sample form.
  const initialValues: any = {
    restrictToCreatedBy: true,
    ...fetchedFormTemplateWithoutComponents,
    ...allMaterialSampleComponentValues,
    ...formTemplateCheckboxes,
    ...(splitConfigurationInitialValues ?? {}),
    id,
    type: "form-template"
  };

  // Generate the material sample save hook to use for the form.
  const materialSampleSaveHook = useMaterialSampleSave({
    isTemplate: true,
    colEventTemplateInitialValues: collectingEventInitialValues,
    materialSampleTemplateInitialValues: allMaterialSampleComponentValues,
    colEventFormRef: collectingEvtFormRef,
    splitConfigurationInitialState: !_.isUndefined(
      splitConfigurationInitialValues
    )
  });
  const dataComponentState = materialSampleSaveHook.dataComponentState;

  async function onSaveTemplateSubmit({
    api: { save },
    submittedValues
  }: DinaFormSubmitParams<FormTemplate & FormTemplateComponents>) {
    // Get collecting event checkboxes and values
    const {
      templateCheckboxes: collectingEventCheckboxes,
      ...collectinEventFormRefValues
    } = collectingEvtFormRef?.current?.values || {};
    submittedValues.templateCheckboxes = {
      ...submittedValues.templateCheckboxes,
      ...collectingEventCheckboxes
    };

    // Include the collecting event values.
    const allSubmittedValues: FormTemplate & FormTemplateComponents = {
      ...submittedValues
    };
    allSubmittedValues.collectingEvent = collectinEventFormRefValues ?? {};
    allSubmittedValues.collectingEvent.group = allSubmittedValues.group;

    const dataComponentsStateMap =
      getDataComponentsStateMap(dataComponentState);

    // The finished form template to save with all of the visibility, default values for each
    // field. Eventually position will also be stored here.
    const formTemplate: InputResource<FormTemplate> = {
      id: submittedValues.id,
      type: "form-template",
      name: submittedValues.name,
      group: submittedValues.group,
      restrictToCreatedBy: submittedValues.restrictToCreatedBy,
      viewConfiguration: { type: "material-sample-form-template" },
      components: MATERIAL_SAMPLE_FORM_LEGEND.map(
        (dataComponent, componentIndex) => ({
          name: dataComponent.id,
          visible: dataComponentsStateMap[dataComponent.id],
          order: navOrder?.indexOf(dataComponent.id) ?? componentIndex,
          sections: dataComponent.sections.map((section) => ({
            name: section.id,
            visible: true,
            items: section.items.map((field) => {
              const item = {
                name: field.id,
                visible: field.visible
                  ? true
                  : allSubmittedValues?.templateCheckboxes?.[
                      dataComponent.id + "." + section.id + "." + field.id
                    ] ?? false,
                defaultValue: _.get(allSubmittedValues, field.id)
              };

              // Separate the different parts of the form that are not being saved to the Material
              // Sample directly.
              switch (dataComponent.id) {
                case COLLECTING_EVENT_COMPONENT_NAME:
                  item.defaultValue = _.get(
                    allSubmittedValues,
                    `collectingEvent.${field.id}`
                  );
                  break;
                case SPLIT_CONFIGURATION_COMPONENT_NAME:
                  // Displayed by default. Visibility cannot be configured.
                  item.visible = true;
              }

              return item;
            })
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

  /**
   * Validation rules to apply for the form template.
   */
  function onValidate(values: FormTemplate & FormTemplateComponents) {
    // Get switches for validation purposes.
    const dataComponentsStateMap =
      getDataComponentsStateMap(dataComponentState);

    let errors: any = {};

    // Split Configuration Validation Checking
    if (dataComponentsStateMap[SPLIT_CONFIGURATION_COMPONENT_NAME]) {
      errors = Object.assign(
        {},
        errors,
        onValidateSplitConfiguration(values, errors, formatMessage)
      );
    }

    return errors;
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
          className="me-3"
        />
      )}

      <SubmitButton />
    </>
  );

  return (
    <DinaForm<FormTemplate & FormTemplateComponents>
      initialValues={initialValues}
      onSubmit={onSaveTemplateSubmit}
      validate={onValidate}
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
                <FieldSpy<string> fieldName={"group"}>
                  {(group) => (
                    <FieldSpy<boolean> fieldName={"restrictToCreatedBy"}>
                      {(privateFormTemplate) => (
                        <CheckBoxField
                          name="restrictToCreatedBy"
                          tooltipOverride={
                            privateFormTemplate
                              ? formatMessage("formTemplatePrivate_tooltip")
                              : group
                              ? formatMessage("formTemplatePublic_tooltip", {
                                  group: group?.toUpperCase()
                                })
                              : formatMessage(
                                  "formTemplateGroupVisibility_tooltip"
                                )
                          }
                          overridecheckboxProps={{
                            style: {
                              height: "30px",
                              width: "30px"
                            }
                          }}
                        />
                      )}
                    </FieldSpy>
                  )}
                </FieldSpy>
              </div>
              <div className="col-md-6">
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
            navOrder={navOrder}
            onChangeNavOrder={(newOrder) => setNavOrder(newOrder)}
          />
        </DinaFormSection>
      </PageLayout>
    </DinaForm>
  );
}
function getDataComponentsStateMap(dataComponentState) {
  const dataComponentEnabledMap = {};
  dataComponentEnabledMap[SPLIT_CONFIGURATION_COMPONENT_NAME] =
    dataComponentState.enableSplitConfiguration;
  dataComponentEnabledMap[IDENTIFIER_COMPONENT_NAME] = true;
  dataComponentEnabledMap[MATERIAL_SAMPLE_INFO_COMPONENT_NAME] = true;
  dataComponentEnabledMap[ASSOCIATIONS_COMPONENT_NAME] =
    dataComponentState.enableAssociations;
  dataComponentEnabledMap[COLLECTING_EVENT_COMPONENT_NAME] =
    dataComponentState.enableCollectingEvent;
  dataComponentEnabledMap[ORGANISMS_COMPONENT_NAME] =
    dataComponentState.enableOrganisms;
  dataComponentEnabledMap[PREPARATIONS_COMPONENT_NAME] =
    dataComponentState.enablePreparations;
  dataComponentEnabledMap[RESTRICTION_COMPONENT_NAME] =
    dataComponentState.enableRestrictions;
  dataComponentEnabledMap[SCHEDULED_ACTIONS_COMPONENT_NAME] =
    dataComponentState.enableScheduledActions;
  dataComponentEnabledMap[STORAGE_COMPONENT_NAME] =
    dataComponentState.enableStorage;
  dataComponentEnabledMap[FIELD_EXTENSIONS_COMPONENT_NAME] = true;
  dataComponentEnabledMap[MANAGED_ATTRIBUTES_COMPONENT_NAME] = true;
  dataComponentEnabledMap[MATERIAL_SAMPLE_ATTACHMENTS_COMPONENT_NAME] = true;
  return dataComponentEnabledMap;
}
