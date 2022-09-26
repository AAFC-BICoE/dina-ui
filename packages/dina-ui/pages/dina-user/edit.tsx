import {
  BackButton,
  ButtonBar,
  DinaForm,
  DinaFormOnSubmit,
  FieldView,
  FormikButton,
  SelectField,
  SubmitButton,
  useAccount,
  useQuery,
  withResponse
} from "common-ui";
import { FieldArray } from "formik";
import { keys, last, omit, uniq } from "lodash";
import { NextRouter, useRouter } from "next/router";
import { SUPER_USER, USER, GUEST } from "common-ui/types/DinaRoles";
import Select from "react-select";
import {
  GroupLabel,
  Head,
  Nav,
  PersonSelectField,
  useAvailableGroupOptions
} from "../../components";
import { DinaMessage, useDinaIntl } from "../../intl/dina-ui-intl";
import { Person } from "../../types/objectstore-api";
import { DinaUser } from "../../types/user-api/resources/DinaUser";

interface DinaUserFormValues extends DinaUser {
  agent?: Person;
}

export default function DinaUserEditPage() {
  const router = useRouter();
  const {
    query: { id }
  } = router;

  const { formatMessage } = useDinaIntl();

  const userQuery = useQuery<DinaUser & { agent?: Person }>(
    { path: `user-api/user/${id}` },
    {
      joinSpecs: [
        {
          apiBaseUrl: "/agent-api",
          idField: "agentId",
          joinField: "agent",
          path: (user) => `person/${user.agentId}`
        }
      ]
    }
  );

  return (
    <div>
      <Head title={formatMessage("editDinaUserTitle")} />
      <Nav />
      <main className="container">
        <h1 id="wb-cont">
          <DinaMessage id="editDinaUserTitle" />
        </h1>
        {withResponse(userQuery, (response) => (
          <DinaUserForm dinaUser={response.data} router={router} />
        ))}
      </main>
    </div>
  );
}

interface DinaUserFormProps {
  dinaUser: DinaUserFormValues;
  router: NextRouter;
}

export function DinaUserForm({
  dinaUser: initialValues,
  router
}: DinaUserFormProps) {
  const onSubmit: DinaFormOnSubmit<DinaUserFormValues> = async ({
    api: { save },
    submittedValues
  }) => {
    const updatedUser = {
      id: submittedValues.id,
      type: submittedValues.type
    } as DinaUser;

    if (submittedValues.agent?.id !== undefined) {
      updatedUser.agentId = submittedValues.agent.id;
    }

    if (submittedValues.rolesPerGroup) {
      updatedUser.rolesPerGroup = submittedValues.rolesPerGroup;
    }

    await save(
      [
        {
          resource: updatedUser,
          type: updatedUser.type
        }
      ],
      { apiBaseUrl: "/user-api" }
    );

    await router.push(`/dina-user/view?id=${submittedValues.id}`);
  };

  return (
    <DinaForm<DinaUserFormValues>
      initialValues={initialValues}
      onSubmit={onSubmit}
    >
      <ButtonBar>
        <BackButton
          entityId={initialValues.id as string}
          entityLink="/dina-user"
        />
        <SubmitButton className="ms-auto" />
      </ButtonBar>
      <div>
        <div className="row">
          <FieldView className="col-md-6" name="username" />
          <PersonSelectField className="col-md-6" name="agent" />
        </div>
        <RolesPerGroupEditor
          initialRolesPerGroup={initialValues.rolesPerGroup}
        />
      </div>
    </DinaForm>
  );
}

export interface RolesPerGroupEditorProps {
  initialRolesPerGroup: Record<string, string[] | undefined>;
}

export function RolesPerGroupEditor({
  initialRolesPerGroup
}: RolesPerGroupEditorProps) {
  const { groupSelectOptions } = useAvailableGroupOptions();
  const { rolesPerGroup: editorsRolesPerGroup, isAdmin: editorIsAdmin } =
    useAccount();

  const editableRoles = [USER, GUEST, SUPER_USER];

  return (
    <label className="w-100">
      <strong>
        <DinaMessage id="rolesPerGroup" />
      </strong>
      <FieldArray name="rolesPerGroup">
        {({ form }) => {
          const usersGroups =
            keys((form.values as DinaUser).rolesPerGroup) ?? [];

          const unsetGroupOptions = groupSelectOptions.filter(
            (it) => !keys(form.values.rolesPerGroup).includes(it.value)
          );

          return (
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th style={{ width: "30%" }}>
                    <DinaMessage id="group" />
                  </th>
                  <th style={{ width: "40%" }}>
                    <DinaMessage id="role" />
                  </th>
                  <th style={{ width: "30%" }} />
                </tr>
              </thead>
              <tbody>
                {usersGroups.length ? (
                  usersGroups.map((groupName) => {
                    const canEdit =
                      editorIsAdmin ||
                      editorsRolesPerGroup?.[groupName]?.includes(SUPER_USER);

                    return (
                      <tr key={groupName} className={`${groupName}-row`}>
                        <td>
                          <GroupLabel groupName={groupName} />
                        </td>
                        <td className="role-select">
                          <SelectField
                            name={`rolesPerGroup.${groupName}`}
                            hideLabel={true}
                            isMulti={true}
                            // Only allow one group at a time:
                            onChange={(selectedRoles, formik) => {
                              const newRole = last(selectedRoles);
                              formik.setFieldValue(
                                `rolesPerGroup.${groupName}`,
                                newRole ? [newRole] : []
                              );
                            }}
                            // Options should be the possible groups or the
                            options={uniq([
                              ...editableRoles,
                              ...(initialRolesPerGroup[groupName] ?? [])
                            ]).map((it) => ({
                              label: it,
                              value: it
                            }))}
                            disabled={!canEdit}
                          />
                        </td>
                        <td className="remove-group">
                          {canEdit && (
                            <FormikButton
                              className="btn btn-dark remove-button"
                              onClick={() =>
                                form.setFieldValue(
                                  "rolesPerGroup",
                                  omit(form.values.rolesPerGroup, groupName)
                                )
                              }
                            >
                              <DinaMessage id="removeGroup" />
                            </FormikButton>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={3}>
                      <DinaMessage id="noGroups" />
                    </td>
                  </tr>
                )}
                <tr>
                  <td colSpan={3} className="add-group">
                    <label style={{ width: "20rem" }}>
                      <strong>
                        <DinaMessage id="addGroup" />
                      </strong>
                      <Select
                        value={null}
                        onChange={(option) => {
                          if (option) {
                            form.setFieldValue("rolesPerGroup", {
                              ...form.values.rolesPerGroup,
                              [option.value]: []
                            });
                          }
                        }}
                        placeholder={<DinaMessage id="selectGroup" />}
                        options={unsetGroupOptions}
                      />
                    </label>
                  </td>
                </tr>
              </tbody>
            </table>
          );
        }}
      </FieldArray>
    </label>
  );
}
