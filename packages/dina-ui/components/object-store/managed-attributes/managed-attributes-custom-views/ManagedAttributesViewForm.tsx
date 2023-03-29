import {
  BackButton,
  ButtonBar,
  DinaForm,
  DinaFormOnSubmit,
  DinaFormSection,
  FieldSpy,
  SelectField,
  SubmitButton,
  TextField,
  useQuery
} from "common-ui";
import { InputResource, PersistedResource } from "kitsu";
import * as yup from "yup";
import { GroupSelectField } from "../../..";
import { useDinaIntl } from "../../../../intl/dina-ui-intl";
import {
  FormTemplate,
  ManagedAttributesView,
  managedAttributesViewSchema
} from "../../../../types/collection-api";
import {
  COLLECTION_MODULE_TYPES,
  COLLECTION_MODULE_TYPE_LABELS
} from "../../../../types/collection-api/resources/ManagedAttribute";
import { ManagedAttributesSorter } from "./ManagedAttributesSorter";

export interface ManagedAttributesViewFormProps {
  data?: InputResource<FormTemplate>;
  /** Default component in the form's initialValues. */
  defaultManagedAttributeComponent?: string;
  /** Disable the attribute component field. */
  disabledAttributeComponent?: boolean;
  onSaved: (data: PersistedResource<FormTemplate>) => Promise<void>;
}

export function useFormTemplates(id?: string) {
  return useQuery<FormTemplate>(
    { path: `collection-api/form-template/${id}` },
    {
      onSuccess: async ({ data: fetchedView }) => {
        // Throw an error if the wrong type of Form Template
        managedAttributesViewSchema.validateSync(fetchedView.viewConfiguration);
      },
      disabled: !id
    }
  );
}

/**
 * Validate the JSON field on the front-end because it's unstructured JSON on the back-end.
 */
const formTemplateSchema = yup.object({
  viewConfiguration: managedAttributesViewSchema
});

export function ManagedAttributesViewForm({
  onSaved,
  data,
  disabledAttributeComponent,
  defaultManagedAttributeComponent
}: ManagedAttributesViewFormProps) {
  const initialViewConfiguration: Partial<ManagedAttributesView> = {
    type: "managed-attributes-view",
    attributeKeys: [],
    managedAttributeComponent: defaultManagedAttributeComponent
  };

  const initialValues = data ?? {
    type: "form-template",
    restrictToCreatedBy: true,
    viewConfiguration: initialViewConfiguration
  };

  const onSubmit: DinaFormOnSubmit<InputResource<FormTemplate>> = async ({
    submittedValues,
    api: { save }
  }) => {
    const [savedView] = await save<FormTemplate>(
      [{ resource: submittedValues, type: "form-template" }],
      { apiBaseUrl: "/collection-api" }
    );
    await onSaved(savedView);
  };

  const buttonBar = (
    <ButtonBar>
      <BackButton
        entityId={data?.id}
        entityLink="/collection/managed-attributes-view"
      />
      <SubmitButton className="ms-auto" />
    </ButtonBar>
  );

  return (
    <div className="managed-attributes-view-form">
      <DinaForm
        initialValues={initialValues}
        onSubmit={onSubmit}
        validationSchema={formTemplateSchema}
      >
        {buttonBar}
        <ManagedAttributesViewFormLayout
          disabledAttributeComponent={disabledAttributeComponent}
        />
        {buttonBar}
      </DinaForm>
    </div>
  );
}

export interface ManagedAttributesViewFormLayoutProps {
  disabledAttributeComponent?: boolean;
}

export function ManagedAttributesViewFormLayout({
  disabledAttributeComponent
}: ManagedAttributesViewFormLayoutProps) {
  const { formatMessage } = useDinaIntl();

  const ATTRIBUTE_COMPONENT_OPTIONS: {
    label: string;
    value: string;
  }[] = COLLECTION_MODULE_TYPES.map((dataType) => ({
    label: formatMessage(COLLECTION_MODULE_TYPE_LABELS[dataType] as any),
    value: dataType
  }));

  return (
    <div>
      <div className="row">
        <GroupSelectField
          name="group"
          enableStoredDefaultGroup={true}
          className="col-md-6"
        />
      </div>
      <DinaFormSection horizontal="flex">
        <div className="row">
          <TextField name="name" className="col-sm-6" />
        </div>
        <div className="row">
          <SelectField
            className="col-md-6"
            disabled={disabledAttributeComponent}
            name="viewConfiguration.managedAttributeComponent"
            customName="managedAttributeComponent"
            options={ATTRIBUTE_COMPONENT_OPTIONS}
            readOnlyRender={(value) =>
              ATTRIBUTE_COMPONENT_OPTIONS.find(
                (option) => option.value === value
              )?.label
            }
            onChange={(_, form) =>
              form.setFieldValue("viewConfiguration.attributeKeys", [])
            }
          />
        </div>
      </DinaFormSection>
      <FieldSpy<string> fieldName="viewConfiguration.managedAttributeComponent">
        {(managedAttributeComponent) =>
          managedAttributeComponent ? (
            <>
              <hr />
              <ManagedAttributesSorter
                name="viewConfiguration.attributeKeys"
                managedAttributeComponent={managedAttributeComponent}
                managedAttributeApiPath="collection-api/managed-attribute"
              />
            </>
          ) : null
        }
      </FieldSpy>
    </div>
  );
}
