import { useLocalStorage } from "@rehooks/local-storage";
import { SubmitButton, TextField, useModal } from "common-ui";
import { Form, Formik } from "formik";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { ManagedAttribute } from "../../types/objectstore-api";

export interface AttributesTemplate {
  name: string;
  editableBuiltInAttributes: string[];
  editableManagedAttributes: ManagedAttribute[];
}

export function useMetadataEditorSavedTemplates() {
  const [storedAttributesTemplates, setAttributesTemplates] = useLocalStorage<
    AttributesTemplate[]
  >("metadata_attributesTemplates");
  const attributesTemplates = storedAttributesTemplates ?? [];

  const { closeModal, openModal } = useModal();

  function openAttributesTemplateForm(
    {
      editableBuiltInAttributes,
      editableManagedAttributes
    }: Omit<AttributesTemplate, "name">,
    onSuccess: (newTemplate: AttributesTemplate) => void
  ) {
    function onTemplateSubmit({ name }) {
      const newTemplate: AttributesTemplate = {
        name: name || `New Template ${new Date().toLocaleString()}`,
        editableBuiltInAttributes,
        editableManagedAttributes
      };
      setAttributesTemplates([...attributesTemplates, newTemplate]);

      onSuccess(newTemplate);

      closeModal();
    }

    openModal(
      <div className="modal-content">
        <Formik initialValues={{ name: "" }} onSubmit={onTemplateSubmit}>
          <Form translate={undefined}>
            <div className="modal-header">
              <h2>
                <DinaMessage id="addAttributesTemplateTitle" />
              </h2>
            </div>
            <div className="modal-body">
              <TextField name="name" />
            </div>
            <div className="modal-footer">
              <SubmitButton />
              <button className="btn btn-dark" onClick={closeModal}>
                <DinaMessage id="cancelButtonText" />
              </button>
            </div>
          </Form>
        </Formik>
      </div>
    );
  }

  return {
    attributesTemplates,
    openAttributesTemplateForm
  };
}
