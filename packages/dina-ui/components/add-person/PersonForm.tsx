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
import { PersistedResource } from "kitsu";
import { Organization } from "packages/dina-ui/types/agent-api/resources/Organization";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { Person } from "../../types/objectstore-api";

interface PersonFormProps {
  person?: Person;
  onSubmitSuccess: (person: PersistedResource<Person>) => void | Promise<void>;
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
    const [newPerson] = await save<Person>(
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

    await onSubmitSuccess(newPerson);
  };

  return (
    <DinaForm initialValues={initialValues} onSubmit={onSubmit}>
      <div className="list-inline">
        <div style={{ width: "20rem" }} className="list-inline-item">
          <TextField name="displayName" />
        </div>
      </div>
      <div className="list-inline">
        <div style={{ width: "20rem" }} className="list-inline-item">
          <TextField name="givenNames" />
        </div>
        <div style={{ width: "20rem" }} className="list-inline-item">
          <TextField name="familyNames" />
        </div>
        <div style={{ width: "20rem" }} className="list-inline-item">
          <TextField name="title" />
        </div>
        <div style={{ width: "20rem" }} className="list-inline-item">
          <TextField name="appellation" />
        </div>
      </div>
      <div className="list-inline">
        <div style={{ width: "20rem" }} className="list-inline-item">
          <TextField name="email" />
        </div>
        <div style={{ width: "20rem" }} className="list-inline-item">
          <ResourceSelectField<Organization>
            name="organizations"
            filter={filterBy(["names[0].name"])}
            model="agent-api/organization"
            isMulti={true}
            optionLabel={organization => organization.names?.[0].name}
          />
        </div>
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
  const { openAddPersonModal } = useAddPersonModal();

  return (
    <button
      className="btn btn-info delete-button open-person-modal"
      onClick={openAddPersonModal}
      type="button"
    >
      <DinaMessage id="addPersonButtonText" />
    </button>
  );
}

export function useAddPersonModal() {
  const { closeModal, openModal } = useModal();

  function openAddPersonModal() {
    return new Promise<PersistedResource<Person> | undefined>(resolve => {
      function finishModal(newPerson?: PersistedResource<Person>) {
        closeModal();
        resolve(newPerson);
      }

      openModal(
        <div className="modal-content">
          <style>{`.modal-dialog { max-width: 100rem; }`}</style>
          <div className="modal-header">
            <h2>
              <DinaMessage id="addPersonTitle" />
            </h2>
          </div>
          <div className="modal-body">
            <PersonForm onSubmitSuccess={finishModal} />
          </div>
          <div className="modal-footer">
            <button className="btn btn-dark" onClick={() => finishModal()}>
              <DinaMessage id="cancelButtonText" />
            </button>
          </div>
        </div>
      );
    });
  }

  return { openAddPersonModal };
}
