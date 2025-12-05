import {
  DinaForm,
  filterBy,
  SubmitButton,
  TextField,
  useModal,
  StringArrayField,
  ResourceSelectField,
  BackButton,
  ButtonBar,
  useSubmitHandler
} from "common-ui";
import { PersistedResource } from "kitsu";
import { Organization } from "../../../dina-ui/types/agent-api/resources/Organization";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { Person } from "../../types/objectstore-api";
import { PersonFormFields } from "./PersonFormFields";
import { useDinaIntl } from "../../intl/dina-ui-intl";
import * as yup from "yup";

interface PersonFormProps {
  person?: Person;
  onSubmitSuccess?: (person: PersistedResource<Person>) => void | Promise<void>;
}

/** Form to add or edit a Person. */
export function PersonForm({ onSubmitSuccess, person }: PersonFormProps) {
  const initialValues: Partial<Person> = person || {
    type: "person"
  };
  const { formatMessage } = useDinaIntl();
  const id = person?.id;
  const personFormValidationSchema = yup.object({
    displayName: yup
      .string()
      .required(formatMessage("field_personMandatoryFieldsError")),
    identifiers: yup
      .array()
      .of(
        yup.object({
          namespace: yup
            .string()
            .required(formatMessage("field_personIdentifierTypeError")),
          value: yup
            .string()
            .required(formatMessage("field_personIdentifierValueError"))
        })
      )
      .test(
        "unique-values",
        formatMessage("field_personIdentifierUniqueError"),
        (identifiers) => {
          if (!identifiers) return true; // No error if empty
          const values = identifiers
            .map((i) => i.value?.trim())
            .filter(Boolean);
          return values.length === new Set(values).size;
        }
      )
  });

  const personSubmitHandler = useSubmitHandler<Person>({
    original: initialValues as Person,
    resourceType: "person",
    saveOptions: { apiBaseUrl: "/agent-api", skipOperationForSingleRequest: true },

    // Configure relationships (including nested resources)
    relationshipMappings: [
      {
        sourceAttribute: "identifiers",
        relationshipName: "identifiers",
        removeSourceAttribute: true,
        relationshipType: "ARRAY",
        nestedResource: {
          resourceType: "identifier",
          apiBaseUrl: "/agent-api"
        }
      },
      {
        sourceAttribute: "organizations",
        relationshipName: "organizations",
        removeSourceAttribute: true,
        relationshipType: "ARRAY"
      }
    ],
    
    onSuccess: onSubmitSuccess
      
  });

  const buttonBar = (
    <ButtonBar className="mb-3">
      <div className="col-md-6 col-sm-12 mt-2">
        <BackButton
          entityId={id as string}
          entityLink="/person"
          byPassView={true}
        />
      </div>
      <div className="col-md-6 col-sm-12 d-flex">
        <SubmitButton className="ms-auto" />
      </div>
    </ButtonBar>
  );

  return (
    <DinaForm
      initialValues={initialValues}
      onSubmit={personSubmitHandler}
      validationSchema={personFormValidationSchema}
    >
      {buttonBar}
      <div style={{ width: "30rem" }}>
        <TextField name="displayName" />
      </div>
      <div style={{ width: "30rem" }}>
        <TextField name="givenNames" />
      </div>
      <div style={{ width: "30rem" }}>
        <TextField name="familyNames" />
      </div>
      <div style={{ width: "30rem" }}>
        <StringArrayField name="aliases" />
      </div>
      <div style={{ width: "30rem" }}>
        <TextField name="email" />
      </div>
      <div style={{ width: "30rem" }}>
        <ResourceSelectField<Organization>
          name="organizations"
          filter={filterBy(["names[0].name"])}
          model="agent-api/organization"
          isMulti={true}
          optionLabel={(organization) => organization.names?.[0].name}
        />
      </div>
      <PersonFormFields width="30rem" />
      <div style={{ width: "30rem" }}>
        <TextField name="webpage" />
      </div>
      <div style={{ width: "30rem" }}>
        <TextField name="remarks" multiLines={true} />
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
    return new Promise<PersistedResource<Person> | undefined>((resolve) => {
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
