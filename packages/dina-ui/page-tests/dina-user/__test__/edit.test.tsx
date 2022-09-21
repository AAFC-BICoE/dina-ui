import { DinaForm } from "common-ui";
import { RolesPerGroupEditor } from "../../../pages/dina-user/edit";
import { mountWithAppContext } from "../../../test-util/mock-app-context";
import Select from "react-select";
import { SUPER_USER, USER, GUEST } from "common-ui/types/DinaRoles";

const mockGet = jest.fn<any, any>(async (path) => {
  if (path === "user-api/group") {
    return { data: [] };
  }
});

const apiContext = {
  apiClient: {
    get: mockGet
  }
};

describe("User edit page", () => {
  it("Lets you edit the Roles per Group.", async () => {
    const mockSubmit = jest.fn();

    const testUserToEdit = {
      rolesPerGroup: {
        cnc: [GUEST],
        aafc: [USER]
      }
    };

    const wrapper = mountWithAppContext(
      <DinaForm
        initialValues={testUserToEdit}
        onSubmit={({ submittedValues }) => mockSubmit(submittedValues)}
      >
        <RolesPerGroupEditor
          initialRolesPerGroup={testUserToEdit.rolesPerGroup}
        />
      </DinaForm>,
      {
        apiContext,
        accountContext: {
          groupNames: ["cnc", "aafc", "test-group"],
          // The logged in user is a collection manager for CNC and test-group:
          rolesPerGroup: {
            cnc: [SUPER_USER],
            "test-group": [SUPER_USER]
          }
        }
      }
    );

    // Renders the rows:
    expect(wrapper.find("tr.cnc-row").exists()).toEqual(true);
    expect(wrapper.find("tr.aafc-row").exists()).toEqual(true);
    expect(wrapper.find("tr.test-group-row").exists()).toEqual(false);

    // The logged in user must be super_user to edit a group's row:
    // Can edit the cnc row:
    expect(wrapper.find("tr.cnc-row .remove-button").exists()).toEqual(true);
    expect(
      wrapper.find("tr.cnc-row .role-select").find(Select).prop("isDisabled")
    ).toEqual(false);
    // Can't edit the AAFC row:
    expect(wrapper.find("tr.aafc-row .remove-button").exists()).toEqual(false);
    expect(
      wrapper.find("tr.aafc-row .role-select").find(Select).prop("isDisabled")
    ).toEqual(true);

    // Add new group + roles:
    wrapper.find(".add-group Select").prop<any>("onChange")({
      value: "test-group"
    });

    wrapper.update();
    expect(wrapper.find("tr.test-group-row").exists()).toEqual(true);

    wrapper.find("tr.test-group-row .role-select Select").prop<any>("onChange")(
      [{ value: "role1" }, { value: "role2" }]
    );

    // Remove a group:
    wrapper.find("tr.cnc-row .remove-group button").simulate("click");

    wrapper.find("form").simulate("submit");

    await new Promise(setImmediate);
    wrapper.update();

    // Check form state: cnc removed, test-group added:
    expect(mockSubmit.mock.calls).toEqual([
      [
        {
          rolesPerGroup: {
            aafc: [USER],
            // Only one role at a time is allowed for now:
            "test-group": ["role2"]
          }
        }
      ]
    ]);
  });
});
