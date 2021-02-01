import {
  DeleteButton,
  DinaForm,
  DinaFormOnSubmit,
  filterBy,
  SubmitButton,
  TextField,
  useModal
} from "common-ui";
import { ResourceSelectField } from "common-ui/lib";
import { Organization } from "packages/dina-ui/types/agent-api/resources/Organization";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { Person } from "../../types/objectstore-api";

interface PersonFormProps {
  person?: Person;
  onSubmitSuccess: () => Promise<void>;
}

/** Form to add or edit a Person. */
export function PersonForm({ onSubmitSuccess, person }: PersonFormProps) {
  const initialValues = person || { type: "person" };

  const id = person?.id;

  const onSubmit: DinaFormOnSubmit = async ({
    api: { save },
    submittedValues
  }) => {
    const submitCopy = { ...submittedValues };
    if (submitCopy.organizations) {
      submittedValues.relationships = {};
      submittedValues.relationships.organizations = {};
      submittedValues.relationships.organizations.data = [];
      submitCopy.organizations.map(org =>
        submittedValues.relationships.organizations.data.push({
          id: org.id,
          type: "organization"
        })
      );
      delete submittedValues.organizations;
    }
    await save(
      [
        {
          resource: submittedValues,
          type: "person"
        }
      ],
      {
        apiBaseUrl: "/agent-api"
      }
    );

    await onSubmitSuccess();
  };

  return (
    <DinaForm initialValues={initialValues} onSubmit={onSubmit}>
      <div style={{ maxWidth: "20rem" }}>
        <TextField name="displayName" />
      </div>
      <div style={{ maxWidth: "20rem" }}>
        <TextField name="givenNames" />
      </div>
      <div style={{ maxWidth: "20rem" }}>
        <TextField name="familyNames" />
      </div>
      <div style={{ maxWidth: "20rem" }}>
        <TextField name="email" />
      </div>
      <div style={{ maxWidth: "20rem" }}>
        <ResourceSelectField<Organization>
          name="organizations"
          filter={filterBy(["names[0].name"])}
          model="agent-api/organization"
          isMulti={true}
          optionLabel={organization => organization.names?.[0].name}
        />
      </div>
      <div className="form-group">
        <SubmitButton />
        <DeleteButton
          id={id}
          options={{ apiBaseUrl: "/agent-api" }}
          postDeleteRedirect="/person/list"
          type="person"
        />
      </div>
    </DinaForm>
  );
}

/** Button that opens a PersonForm in a modal. */
export function AddPersonButton() {
  const { closeModal, openModal } = useModal();

  async function onSubmitSuccess() {
    closeModal();
  }

  return (
    <button
      className="btn btn-info delete-button open-person-modal"
      onClick={() =>
        openModal(
          <div className="modal-content">
            <div className="modal-header">
              <h2>
                <DinaMessage id="addPersonTitle" />
              </h2>
            </div>
            <div className="modal-body">
              <PersonForm onSubmitSuccess={onSubmitSuccess} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-dark" onClick={closeModal}>
                <DinaMessage id="cancelButtonText" />
              </button>
            </div>
          </div>
        )
      }
      type="button"
    >
      <DinaMessage id="addPersonButtonText" />
    </button>
  );
}
