import { DinaForm } from "common-ui";
import { RolesPerGroupEditor } from "../../../pages/dina-user/edit";
import { mountWithAppContext } from "common-ui";
import { SUPER_USER, USER, GUEST } from "common-ui/types/DinaRoles";
import { fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";

// Not perfect - all rendered groups take test-group label
const mockGet = jest.fn<any, any>(async (path) => {
  if (path === "user-api/group") {
    return {
      data: [
        {
          id: "test-group",
          name: "test-group",
          type: "group",
          labels: { en: "test-group" }
        }
      ]
    };
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

    // Renders the rows except for test-group:
    expect(wrapper.getByRole("cell", { name: /cnc/i })).toBeInTheDocument();
    expect(wrapper.getByRole("cell", { name: /aafc/i })).toBeInTheDocument();
    expect(
      wrapper.queryByRole("cell", { name: /test-group/i })
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
    userEvent.click(wrapper.getAllByRole("combobox", { name: / /i })[1]);
    await wrapper.waitForRequests();

    userEvent.click(wrapper.getByRole("option", { name: /test-group/i }));
    await wrapper.waitForRequests();

    // Select Role for test-group
    userEvent.click(
      wrapper.getAllByRole("combobox", { name: /select\.\.\./i })[1]
    );
    await wrapper.waitForRequests();

    userEvent.click(wrapper.getByRole("option", { name: /super/i }));

    // Remove a group: (cnc)
    userEvent.click(
      wrapper.getAllByRole("button", { name: /remove group/i })[0]
    );

    // Submit form
    fireEvent.submit(wrapper.container.querySelector("form")!);

    await wrapper.waitForRequests();

    // Check form state: cnc removed, test-group added:
    expect(mockSubmit.mock.calls).toEqual([
      [
        {
          rolesPerGroup: {
            aafc: [USER],
            // Only one role at a time is allowed for now:
            "test-group": [SUPER_USER]
          }
        }
      ]
    ]);
  });
});
