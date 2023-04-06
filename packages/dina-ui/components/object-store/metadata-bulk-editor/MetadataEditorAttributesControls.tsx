import { HotColumnProps } from "@handsontable/react";
import { useLocalStorage } from "@rehooks/local-storage";
import {
  DinaForm,
  DinaFormOnSubmit,
  filterBy,
  FormikButton,
  ResourceSelectField,
  SelectField,
  SubmitButton,
  TextField,
  useModal
} from "common-ui";
import { useFormikContext } from "formik";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { ManagedAttribute } from "../../../types/collection-api";

/** A named set of attributes used for editing Metadatas. */
export interface AttributesTemplate {
  name: string;
  editableBuiltInAttributes: string[];
  editableManagedAttributes: ManagedAttribute[];
}

/** The form fields used in the attribute selector. */
export interface MetadataEditorControls {
  attributesTemplate: AttributesTemplate | null;
  editableBuiltInAttributes: string[];
  editableManagedAttributes: ManagedAttribute[];
}

/** MetadataEditorAttributesControls component props. */
export interface MetadataEditorAttributesControlsProps {
  builtInAttributes: HotColumnProps[];
}

export const ATTRIBUTE_TEMPLATES_STORAGE_KEY = "metadata_attributesTemplates";

/** Provides functions to save/load Metadata Bulk Editor templates to/from the browser's Local Storage. */
function useMetadataEditorSavedTemplates() {
  const [storedAttributesTemplates, setAttributesTemplates] = useLocalStorage<
    AttributesTemplate[]
  >(ATTRIBUTE_TEMPLATES_STORAGE_KEY);
  const attributesTemplates = storedAttributesTemplates ?? [];

  const { closeModal, openModal } = useModal();

  /** Opens a modal to save a new attributes template. */
  function openAttributesTemplateForm(
    {
      editableBuiltInAttributes,
      editableManagedAttributes
    }: Omit<AttributesTemplate, "name">,
    onSuccess: (newTemplate: AttributesTemplate) => void
  ) {
    const onTemplateSubmit: DinaFormOnSubmit = ({
      submittedValues: { name }
    }) => {
      const newTemplate: AttributesTemplate = {
        name: name || `New Template ${new Date().toLocaleString()}`,
        editableBuiltInAttributes,
        editableManagedAttributes
      };
      setAttributesTemplates([...attributesTemplates, newTemplate]);

      onSuccess(newTemplate);

      closeModal();
    };

    openModal(
      <div className="modal-content">
        <div className="modal-header">
          <h2>
            <DinaMessage id="addAttributesTemplateTitle" />
          </h2>
        </div>
        <DinaForm initialValues={{ name: "" }} onSubmit={onTemplateSubmit}>
          <div className="modal-body">
            <TextField name="name" inputProps={{ autoFocus: true }} />
          </div>
          <div className="modal-footer">
            <SubmitButton />
            <button className="btn btn-dark" onClick={closeModal}>
              <DinaMessage id="cancelButtonText" />
            </button>
          </div>
        </DinaForm>
      </div>
    );
  }

  function deleteTemplate(templateToRemove: AttributesTemplate) {
    const newTemplates = attributesTemplates.filter(
      (template) => template !== templateToRemove
    );
    setAttributesTemplates(newTemplates);
  }

  return {
    attributesTemplates,
    deleteTemplate,
    openAttributesTemplateForm
  };
}

/** Provides Formik inputs for selecting and saving Attributes Templates. */
export function MetadataEditorAttributesControls({
  builtInAttributes
}: MetadataEditorAttributesControlsProps) {
  const { attributesTemplates, deleteTemplate, openAttributesTemplateForm } =
    useMetadataEditorSavedTemplates();

  const formikCtx = useFormikContext<MetadataEditorControls>();

  function setCurrentAttributesTemplate(template: AttributesTemplate) {
    formikCtx.setValues({
      ...formikCtx.values,
      attributesTemplate: template,
      editableBuiltInAttributes: template.editableBuiltInAttributes,
      editableManagedAttributes: template.editableManagedAttributes
    });
  }

  function resetAttributesLayout() {
    formikCtx.setValues({
      ...formikCtx.values,
      ...formikCtx.initialValues
    });
  }

  function saveAttributeTemplate() {
    openAttributesTemplateForm(formikCtx.values, (newTemplate) => {
      formikCtx.setValues({
        ...formikCtx.values,
        attributesTemplate: newTemplate
      });
    });
  }

  function deleteSelectedTemplate() {
    if (formikCtx.values.attributesTemplate) {
      deleteTemplate(formikCtx.values.attributesTemplate);
      resetAttributesLayout();
    }
  }

  return (
    <div>
      <div className="row">
        <div className="col-2">
          <SelectField<AttributesTemplate | null>
            name="attributesTemplate"
            // When the template is changed
            onChange={(template: AttributesTemplate) =>
              setCurrentAttributesTemplate(template)
            }
            options={attributesTemplates.map((template) => ({
              label: template.name,
              value: template
            }))}
          />
        </div>
        <div className="col-2">
          {formikCtx.values.attributesTemplate && (
            <FormikButton
              className="template-delete-button btn btn-danger mt-4"
              onClick={deleteSelectedTemplate}
            >
              <DinaMessage id="deleteThisAttributesTemplate" />
            </FormikButton>
          )}
        </div>
      </div>
      <div className="row">
        <SelectField
          className="col-6 editable-builtin-attributes-select"
          name="editableBuiltInAttributes"
          isMulti={true}
          options={builtInAttributes.map((col) => ({
            label: col.title ?? "",
            value: col.data
          }))}
        />
        <ResourceSelectField<ManagedAttribute>
          className="col-3 editable-managed-attributes-select"
          filter={filterBy(["name"])}
          name="editableManagedAttributes"
          isMulti={true}
          model="objectstore-api/managed-attribute"
          optionLabel={(attr) => attr.name}
        />
        <div className="col-3 pt-3">
          <FormikButton
            className="template-save-button btn btn-primary m-2"
            onClick={saveAttributeTemplate}
          >
            <DinaMessage id="metadataAttributesTemplateSave" />
          </FormikButton>
          <FormikButton
            className="template-reset-button btn btn-dark m-2"
            onClick={resetAttributesLayout}
          >
            <DinaMessage id="resetMetadataEditorAttributesButtonText" />
          </FormikButton>
        </div>
      </div>
    </div>
  );
}
