import {
  DinaForm,
  DinaFormSubmitParams,
  FieldSpy,
  filterBy,
  FormikButton,
  ResourceSelect,
  SubmitButton,
  TextField,
  useApiClient,
  useModal
} from "common-ui";
import { InputResource, PersistedResource } from "kitsu";
import { isEqual } from "lodash";
import { useState } from "react";
import * as yup from "yup";
import {
  MaterialSampleFormSectionId,
  materialSampleFormViewConfigSchema
} from "..";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { CustomView } from "../../../types/collection-api";

const navSaveFormSchema = yup.object({
  name: yup.string().required()
});

export interface MaterialSampleNavCustomViewSelect {
  onChange: (newVal: PersistedResource<CustomView> | { id: null }) => void;
  selectedView?: PersistedResource<CustomView> | { id: null };
  navOrder?: MaterialSampleFormSectionId[];
}

export function MaterialSampleNavCustomViewSelect({
  onChange: onChangeProp,
  selectedView,
  navOrder
}: MaterialSampleNavCustomViewSelect) {
  const { openModal, closeModal } = useModal();
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  const viewConfig =
    selectedView?.id &&
    materialSampleFormViewConfigSchema.isValidSync(
      selectedView.viewConfiguration
    )
      ? selectedView.viewConfiguration
      : null;

  const isEdited = navOrder && !isEqual(navOrder, viewConfig?.navOrder);

  function onChange(newSelected: PersistedResource<CustomView> | { id: null }) {
    onChangeProp(newSelected);
    setLastUpdate(Date.now());
  }

  return (
    <FieldSpy<string> fieldName="group">
      {group => (
        <div>
          {isEdited && (
            <div className="d-flex justify-content-center">
              <FormikButton
                className="btn btn-outline-primary mb-2"
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
                <DinaMessage id="saveThisView" />
                ...
              </FormikButton>
            </div>
          )}
          <label className="w-100">
            <div className="mb-2 fw-bold">
              <DinaMessage id="customComponentOrder" />
            </div>
            <ResourceSelect<CustomView>
              filter={input => ({
                // Filter by "material-sample-form-section-order" to omit unrelated custom-view records:
                "viewConfiguration.type": "material-sample-form-section-order",
                // Filter by view name typed into the dropdown:
                ...filterBy(["name"])(input),
                // Filter by the form's group:
                ...(group && { group: { EQ: `${group}` } })
              })}
              optionLabel={view => view.name || view.id}
              model="collection-api/custom-view"
              onChange={newVal =>
                onChange(newVal as PersistedResource<CustomView>)
              }
              value={selectedView}
              // Refresh the query whenever the custom view is changed.
              key={lastUpdate}
            />
          </label>
        </div>
      )}
    </FieldSpy>
  );
}

export interface MaterialSampleNavViewModalProps {
  closeModal: () => void;
  onChange: (newSelected: PersistedResource<CustomView> | { id: null }) => void;
  selectedView?: PersistedResource<CustomView> | { id: null };
  navOrder?: MaterialSampleFormSectionId[];
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

  async function saveView(newView: InputResource<CustomView>) {
    const [savedView] = await save<CustomView>(
      [
        {
          resource: newView,
          type: "custom-view"
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
    const newViewConfig: yup.InferType<
      typeof materialSampleFormViewConfigSchema
    > = {
      type: "material-sample-form-section-order",
      navOrder
    };

    const newView: InputResource<CustomView> = {
      type: "custom-view",
      name: submittedValues.name,
      group: group ?? undefined,
      restrictToCreatedBy: false,
      viewConfiguration: newViewConfig
    };

    await saveView(newView);
  }

  async function saveExistingView(existingView: PersistedResource<CustomView>) {
    const newViewConfig: yup.InferType<
      typeof materialSampleFormViewConfigSchema
    > = {
      type: "material-sample-form-section-order",
      navOrder
    };

    const newView: InputResource<CustomView> = {
      type: "custom-view",
      id: existingView.id,
      viewConfiguration: {
        ...viewConfig,
        ...newViewConfig
      }
    };

    await saveView(newView);
  }

  const viewConfig =
    selectedView?.id &&
    materialSampleFormViewConfigSchema.isValidSync(
      selectedView.viewConfiguration
    )
      ? selectedView.viewConfiguration
      : null;

  return (
    <div className="modal-content">
      <style>{`.modal-dialog { max-width: 50rem; }`}</style>
      <div className="modal-body">
        <div className="card card-body">
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
        {selectedView?.id && (
          <>
            <div className="d-flex align-items-center">
              <strong className="mx-3 fs-4">
                <DinaMessage id="OR" />
              </strong>
            </div>
            <div className="card card-body">
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
