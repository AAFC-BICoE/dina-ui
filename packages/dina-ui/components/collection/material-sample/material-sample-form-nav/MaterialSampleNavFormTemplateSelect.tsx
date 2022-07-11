import { useLocalStorage } from "@rehooks/local-storage";
import {
  DeleteButton,
  DinaForm,
  DinaFormSubmitParams,
  FieldSpy,
  filterBy,
  FormikButton,
  ResourceSelect,
  SubmitButton,
  TextField,
  useAccount,
  useApiClient,
  useModal,
  useQuery
} from "common-ui";
import { InputResource, PersistedResource } from "kitsu";
import { isEqual } from "lodash";
import { useState } from "react";
import * as yup from "yup";
import { DinaMessage } from "../../../../intl/dina-ui-intl";
import {
  FormTemplate,
  MaterialSampleFormSectionId
} from "../../../../types/collection-api";

const navSaveFormSchema = yup.object({
  name: yup.string().required()
});

export const LAST_USED_ID_STORAGE_KEY =
  "last-selected-material-sample-form-section-order-id";

export interface MaterialSampleNavFormTemplateSelect {
  onChange: (newVal: PersistedResource<FormTemplate> | { id: null }) => void;
  selectedView?: PersistedResource<FormTemplate> | { id: null };
  navOrder: MaterialSampleFormSectionId[] | null;
}

/**
 * Dropdown menu for selecting a Material Sample Form custom view order.
 * With controls for create/update/delete.
 */
export function MaterialSampleNavFormTemplateSelect({
  onChange: onChangeProp,
  selectedView,
  navOrder
}: MaterialSampleNavFormTemplateSelect) {
  const { username } = useAccount();
  const { openModal, closeModal } = useModal();
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [lastSelectedId, setLastSelectedId] = useLocalStorage<string | null>(
    LAST_USED_ID_STORAGE_KEY
  );

  const lastUsedViewQuery = useQuery<FormTemplate>(
    { path: `collection-api/form-template/${lastSelectedId}` },
    { disabled: !lastSelectedId }
  );
  const lastUsedView = lastUsedViewQuery.response?.data;

  const viewConfig =
    selectedView?.id &&
    materialSampleNavOrderSchema.isValidSync(selectedView.viewConfiguration)
      ? selectedView.viewConfiguration
      : null;

  const isEdited = navOrder && !isEqual(navOrder, viewConfig?.navOrder);

  function onChange(
    newSelected: PersistedResource<FormTemplate> | { id: null }
  ) {
    onChangeProp(newSelected);
    setLastUpdate(Date.now());
    if (newSelected.id) {
      setLastSelectedId(newSelected.id);
    }
  }

  return (
    <FieldSpy<string> fieldName="group">
      {group => (
        <div>
          {isEdited && (
            <div className="d-flex mb-2 justify-content-center">
              <FormikButton
                className="btn btn-outline-primary save-this-view"
                onClick={() =>
                  openModal(
                    <MaterialSampleNavViewModal
                      closeModal={closeModal}
                      onChange={onChange}
                      group={group ?? undefined}
                      navOrder={navOrder}
                      selectedView={selectedView}
                    />
                  )
                }
              >
                <DinaMessage id="saveThisOrderView" />
                ...
              </FormikButton>
            </div>
          )}
          <label className="w-100 mb-3 form-template-select">
            <div className="mb-2 fw-bold">
              <DinaMessage id="customComponentOrder" />
            </div>
            <ResourceSelect<FormTemplate>
              filter={input => ({
                // Filter by "material-sample-form-section-order" to omit unrelated form-template records:
                "viewConfiguration.type": "material-sample-form-section-order",
                // Filter by view name typed into the dropdown:
                ...filterBy(["name"])(input),
                // Filter by the form's group:
                ...(group && { group: { EQ: `${group}` } })
              })}
              optionLabel={view => view.name || view.id}
              model="collection-api/form-template"
              onChange={newVal =>
                onChange(newVal as PersistedResource<FormTemplate>)
              }
              value={selectedView}
              // Refresh the query whenever the custom view is changed.
              key={lastUpdate}
            />
          </label>
          {selectedView?.id && selectedView.createdBy === username && (
            <div className="d-flex justify-content-end mb-2">
              <DeleteButton
                id={selectedView.id}
                options={{ apiBaseUrl: "/collection-api" }}
                onDeleted={() => {
                  onChange({ id: null });
                  setLastSelectedId(null);
                }}
                type="form-template"
                replaceClassName="btn btn-outline-danger delete-view"
                style={{ width: "" }}
              >
                <DinaMessage id="deleteThisView" />
              </DeleteButton>
            </div>
          )}
          {lastUsedView && selectedView?.id !== lastSelectedId && (
            <div className="d-flex mb-2">
              <FormikButton
                className="btn btn-outline-primary text-start overflow-hidden use-last-selected-view"
                onClick={() => onChange(lastUsedView)}
              >
                <DinaMessage id="useLastSelectedOrderView" />:{" "}
                {lastUsedView.name}
              </FormikButton>
            </div>
          )}
        </div>
      )}
    </FieldSpy>
  );
}

export interface MaterialSampleNavViewModalProps {
  closeModal: () => void;
  onChange: (
    newSelected: PersistedResource<FormTemplate> | { id: null }
  ) => void;
  selectedView?: PersistedResource<FormTemplate> | { id: null };
  navOrder: MaterialSampleFormSectionId[];
  group?: string;
}

/** The modal that opens when you save a Material Sample Nav custom view. */
export function MaterialSampleNavViewModal({
  closeModal,
  onChange,
  selectedView,
  navOrder,
  group
}: MaterialSampleNavViewModalProps) {
  const { save } = useApiClient();
  const { username } = useAccount();

  const NEW_VIEW_CONFIG: yup.InferType<typeof materialSampleNavOrderSchema> = {
    type: "material-sample-form-section-order",
    navOrder
  };

  async function saveView(newView: InputResource<FormTemplate>) {
    const [savedView] = await save<FormTemplate>(
      [
        {
          resource: newView,
          type: "form-template"
        }
      ],
      { apiBaseUrl: "/collection-api" }
    );
    onChange(savedView);
    closeModal();
  }

  async function saveNewView({
    submittedValues
  }: DinaFormSubmitParams<yup.InferType<typeof navSaveFormSchema>>) {
    const newView: InputResource<FormTemplate> = {
      type: "form-template",
      name: submittedValues.name,
      group: group ?? undefined,
      restrictToCreatedBy: false,
      viewConfiguration: NEW_VIEW_CONFIG
    };

    await saveView(newView);
  }

  async function saveExistingView(
    existingView: PersistedResource<FormTemplate>
  ) {
    const newView: InputResource<FormTemplate> = {
      type: "form-template",
      id: existingView.id,
      viewConfiguration: {
        ...viewConfig,
        ...NEW_VIEW_CONFIG
      }
    };

    await saveView(newView);
  }

  const viewConfig =
    selectedView?.id &&
    materialSampleNavOrderSchema.isValidSync(selectedView.viewConfiguration)
      ? selectedView.viewConfiguration
      : null;

  return (
    <div className="modal-content">
      <style>{`.modal-dialog { max-width: 50rem; }`}</style>
      <div className="modal-body">
        <div className="card card-body save-new-view-form">
          <h2>
            <DinaMessage id="createNewView" />
          </h2>
          <DinaForm
            validationSchema={navSaveFormSchema}
            initialValues={{ name: "" }}
            onSubmit={saveNewView}
          >
            <TextField
              name="name"
              customInput={inputProps => (
                <div className="input-group">
                  <input {...inputProps} type="text" />
                  <SubmitButton />
                </div>
              )}
            />
          </DinaForm>
        </div>
        {selectedView?.id && selectedView.createdBy === username && (
          <>
            <div className="d-flex align-items-center">
              <strong className="mx-3 fs-4">
                <DinaMessage id="OR" />
              </strong>
            </div>
            <div className="card card-body save-existing-view-form">
              <h2>
                <DinaMessage id="updateExistingView" />:
                <div>{selectedView.name}</div>
              </h2>
              <DinaForm
                initialValues={{}}
                onSubmit={async () => await saveExistingView(selectedView)}
              >
                <SubmitButton
                  buttonProps={() => ({
                    style: { width: "" }
                  })}
                >
                  <DinaMessage id="update" />: {selectedView.name}
                </SubmitButton>
              </DinaForm>
            </div>
          </>
        )}
      </div>
      <div className="modal-footer">
        <button className="btn btn-dark" onClick={closeModal}>
          <DinaMessage id="cancelButtonText" />
        </button>
      </div>
    </div>
  );
}
