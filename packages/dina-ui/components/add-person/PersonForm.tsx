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
  useApiClient,
  DeleteArgs
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
  let submittedIdentifierIds: any[] = [];

  /**
   * Handle creating, updating Identifiers
   */
  async function saveIdentifiers(
    submitted: InputResource<Person>
  ): Promise<PersistedResource<Identifier>[]> {
    submittedIdentifierIds =
      submitted.identifiers?.map((identifier) => {
        return identifier.id;
      }) ?? [];

    // get save arguments. save() already automatically POSTs for new resources and PATCH for existing resources
    const identifierSaveArgs: SaveArgs<Identifier>[] =
      submitted.identifiers?.map((resource) => {
        return {
          resource,
          type: "identifier"
        };
      }) ?? [];

    delete submitted.identifiers;
    try {
      let savedIdentifiers: PersistedResource<Identifier>[] = [];
      // Don't call the API with an empty Save array:
      if (identifierSaveArgs.length) {
        savedIdentifiers = await save<Identifier>(identifierSaveArgs, {
          apiBaseUrl: "/agent-api"
        });
      }

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

  async function deleteIdentifiers() {
    const initialValuesIdentifiers = initialValues.identifiers?.map(
      (identifier) => {
        return {
          delete: identifier
        };
      }
    );
    const identifierDeleteArgs: any[] =
      initialValues.identifiers
        ?.map((identifier) => {
          return {
            delete: identifier
          };
        })
        .filter((deleteArg) => {
          return !submittedIdentifierIds.includes(deleteArg.delete.id);
        }) ?? [];
    try {
      let deletedIdentifiers: PersistedResource<Identifier>[] = [];
      // Don't call the API with an empty Save array:
      if (identifierDeleteArgs.length) {
        deletedIdentifiers = await save<Identifier>(identifierDeleteArgs, {
          apiBaseUrl: "/agent-api"
        });
      }

      return deletedIdentifiers;
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
    if (Object.keys(submittedPerson.relationships).length === 0) {
      delete submittedPerson.relationships;
    }

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

    // delete Identifier after unlinking from Person
    await deleteIdentifiers();
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
