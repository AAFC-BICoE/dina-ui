import { DinaForm } from "common-ui";
import { RolesPerGroupEditor } from "../../../pages/dina-user/edit";
import { mountWithAppContext2 } from "../../../test-util/mock-app-context";
import Select from "react-select";
import { SUPER_USER, USER, GUEST } from "common-ui/types/DinaRoles";
import { fireEvent, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";

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

    const wrapper = mountWithAppContext2(
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
    expect(wrapper.getByRole("cell", { name: /cnc/i })).toBeInTheDocument();
    expect(wrapper.getByRole("cell", { name: /aafc/i })).toBeInTheDocument();
    expect(
      wrapper.queryByRole("cell", { name: /test group/i })
    ).not.toBeInTheDocument();

    // The logged in user must be super_user to edit a group's row:
    // Can edit the cnc row:
    expect(
      wrapper.getAllByRole("button", { name: /remove group/i })[0]
    ).toBeInTheDocument();
    expect(
      wrapper.getByRole("combobox", {
        name: /role cnc guest/i
      })
    ).not.toBeDisabled();

    // Can't edit the AAFC row:
    // Find only one remove button (for cnc group)
    expect(
      wrapper.queryAllByRole("button", { name: /remove group/i })
    ).toHaveLength(1);
    // Only detects cnc and Add Group comboboxes (not the aafc combobox)
    expect(wrapper.getAllByRole("combobox", { name: / /i })).toHaveLength(2);

    // Add new group + roles:
    // unable to find test group
    userEvent.click(wrapper.getAllByRole("combobox", { name: / /i })[1]);
    await new Promise(setImmediate);
    userEvent.click(wrapper.getByRole("option", { name: /test-group/i }));

    await new Promise(setImmediate);

    // expect(wrapper.find("tr.test-group-row").exists()).toEqual(true);
    expect(
      wrapper.getByRole("cell", { name: /test-group/i })
    ).toBeInTheDocument();

    wrapper.find("tr.test-group-row .role-select Select").prop<any>("onChange")(
      [{ value: "role1" }, { value: "role2" }]
    );

    // Remove a group: (cnc)
    userEvent.click(
      wrapper.getAllByRole("button", { name: /remove group/i })[0]
    );

    // Submit form
    fireEvent.submit(wrapper.container.querySelector("form")!);

    await new Promise(setImmediate);

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
