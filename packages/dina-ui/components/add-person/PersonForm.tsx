import {
  DeleteButton,
  DinaForm,
  DinaFormOnSubmit,
  filterBy,
  SubmitButton,
  TextField,
  useModal,
  StringArrayField,
  FormikButton
} from "common-ui";
import { ResourceSelectField } from "common-ui/lib";
import { PersistedResource } from "kitsu";
import { Organization } from "../../../dina-ui/types/agent-api/resources/Organization";
import { DinaMessage } from "../../intl/dina-ui-intl";
import { Person } from "../../types/objectstore-api";
import { FieldArray } from "formik";
import { clamp } from "lodash";
import { useState } from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { IdentifierRow } from "../collection/IdentifierRow";

interface PersonFormProps {
  person?: Person;
  onSubmitSuccess?: (person: PersistedResource<Person>) => void | Promise<void>;
}

/** Form to add or edit a Person. */
export function PersonForm({ onSubmitSuccess, person }: PersonFormProps) {
  const initialValues: Partial<Person> = person || { type: "person" };

  const [activeTabIdx, setActiveTabIdx] = useState(0);

  const id = person?.id;

  const onSubmit: DinaFormOnSubmit = async ({
    api: { save },
    submittedValues: { ...submittedPerson }
  }) => {
    const submitCopy = { ...submittedPerson };
    if (submitCopy.organizations) {
      submittedPerson.relationships = {};
      submittedPerson.relationships.organizations = {};
      submittedPerson.relationships.organizations.data = [];
      submitCopy.organizations.map(org =>
        submittedPerson.relationships.organizations.data.push({
          id: org.id,
          type: "organization"
        })
      );
      delete submittedPerson.organizations;
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

    await onSubmitSuccess?.(savedPerson);
  };

  return (
    <DinaForm initialValues={initialValues} onSubmit={onSubmit}>
      <div style={{ width: "30rem" }}>
        <FieldArray name="identifiers">
          {({ form, push, remove }) => {
            const identifiers = (form.values as Person).identifiers ?? [{}];

            function addIdentifier() {
              push({});
              setActiveTabIdx(identifiers.length);
            }

            function removeIdentifier(index: number) {
              remove(index);
              // Stay on the current tab number, or reduce if removeing the last element:
              setActiveTabIdx(current =>
                clamp(current, 0, identifiers.length - 2)
              );
            }
            return (
              <div className="identifier-section">
                <Tabs selectedIndex={activeTabIdx} onSelect={setActiveTabIdx}>
                  {
                    // Only show the tabs when there is more than 1 identifier:
                    <TabList
                      className={`react-tabs__tab-list ${
                        identifiers.length === 1 ? "d-none" : ""
                      }`}
                    >
                      {identifiers.map((_, index) => (
                        <Tab key={index}>
                          <span className="m-3">{index + 1}</span>
                        </Tab>
                      ))}
                    </TabList>
                  }
                  {identifiers.length
                    ? identifiers.map((_, index) => (
                        <TabPanel key={index}>
                          <IdentifierRow index={index} />
                          <div className="list-inline mb-3">
                            <FormikButton
                              className="list-inline-item btn btn-primary add-identifier-button"
                              onClick={addIdentifier}
                            >
                              <DinaMessage id="addAnotherIdentifier" />
                            </FormikButton>
                            {identifiers.length > 1 && (
                              <FormikButton
                                className="list-inline-item btn btn-dark"
                                onClick={() => removeIdentifier(index)}
                              >
                                <DinaMessage id="removeIdentifier" />
                              </FormikButton>
                            )}
                          </div>
                        </TabPanel>
                      ))
                    : null}
                </Tabs>
              </div>
            );
          }}
        </FieldArray>
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
          optionLabel={organization => organization.names?.[0].name}
        />
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
