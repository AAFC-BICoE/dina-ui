import {
  DeleteButton,
  DinaForm,
  DinaFormOnSubmit,
  filterBy,
  SubmitButton,
  TextField,
  useModal,
  StringArrayField,
  ResourceSelectField,
  DoOperationsError,
  OperationError,
  SaveArgs,
  useApiClient
} from "common-ui";
import { InputResource, PersistedResource } from "kitsu";
import { Identifier } from "packages/dina-ui/types/agent-api/resources/Identifier";
import { Organization } from "../../../dina-ui/types/agent-api/resources/Organization";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { Person } from "../../types/objectstore-api";
import { PersonFormFields } from "./PersonFormFields";
import { mapKeys, pick } from "lodash";

interface PersonFormProps {
  person?: Person;
  onSubmitSuccess?: (person: PersistedResource<Person>) => void | Promise<void>;
}

/** Form to add or edit a Person. */
export function PersonForm({ onSubmitSuccess, person }: PersonFormProps) {
  const initialValues: Partial<Person> = person || {
    type: "person"
  };
  const id = person?.id;
  const { save } = useApiClient();
  /**
   * Handle creating, updating, deleting Identifiers in back-end
   */
  async function saveIdentifiers(
    submitted: InputResource<Person>
  ): Promise<PersistedResource<Identifier>[]> {
    const identifierSaveArgs: SaveArgs<Identifier>[] | undefined =
      submitted.identifiers?.map((resource) => ({
        resource,
        type: "identifier"
      }));

    // createOperations = newIdentifiers.map<Operation>((identifier) => ({
    //   op: "POST",
    //   ...
    // }));

    // updateOperations = existingIdentifiers.map<Operation>((identifier) => ({
    //   op: "PATCH"
    // }));

    // deleteOperations = deletedIdentifiers.map<Operation>((identifier) => ({
    //   op: "DELETE"
    // }));

    // Merge all of them together
    // const operations = [ ...createOperations, ...updateOperations, ...deleteOperations ];
    delete submitted.identifiers;
    try {
      // Don't call the API with an empty Save array:
      if (!identifierSaveArgs) {
        return [];
      }
      const savedIdentifiers = await save<Identifier>(identifierSaveArgs, {
        apiBaseUrl: "/agent-api"
      });

      return savedIdentifiers;
    } catch (error: unknown) {
      if (error instanceof DoOperationsError) {
        const newErrors = error.individualErrors.map<OperationError>((err) => ({
          fieldErrors: mapKeys(
            err.fieldErrors,
            (_, field) => `identifier[${err.index}].${field}`
          ),
          errorMessage: err.errorMessage,
          index: err.index
        }));

        const overallFieldErrors = newErrors.reduce(
          (total, curr) => ({ ...total, ...curr.fieldErrors }),
          {}
        );

        throw new DoOperationsError(error.message, overallFieldErrors);
      } else {
        throw error;
      }
    }
  }

  const onSubmit: DinaFormOnSubmit = async ({
    submittedValues: { ...submittedPerson }
  }) => {
    submittedPerson.relationships = {
      ...(submittedPerson.organizations && {
        organizations: {
          data: submittedPerson.organizations.map((it) => {
            return {
              id: it.id,
              type: "organization"
            };
          })
        }
      }),
      ...(submittedPerson.identifiers && {
        identifiers: {
          data: (await saveIdentifiers(submittedPerson)).map((it) => {
            return pick(it, "id", "type");
          })
        }
      })
    };
    delete submittedPerson.organizations;

    const [savedPerson] = await save<Person>(
      [
        {
          resource: submittedPerson,
          type: "person"
        }
      ],
      {
        apiBaseUrl: "/agent-api"
      }
    );
    await onSubmitSuccess?.(savedPerson);
  };

  return (
    <DinaForm initialValues={initialValues} onSubmit={onSubmit}>
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
      <div className="mb-3 list-inline">
        <div className="list-inline-item">
          <SubmitButton />
        </div>
        <div className="list-inline-item">
          <DeleteButton
            id={id}
            options={{ apiBaseUrl: "/agent-api" }}
            postDeleteRedirect="/person/list"
            type="person"
          />
        </div>
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
